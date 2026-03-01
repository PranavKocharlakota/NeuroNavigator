from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from patient_profile import PatientProfile
from clinical_trials import fetch_studies, parse_studies
from prompts import rank_trials
from geocode import geocode_address, geocode_zip
import asyncio
import time
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/maps-key")
def maps_key():
    key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="Maps key not configured")
    return {"key": key}


def _location_bonus(sites: list[dict], patient_loc: dict | None) -> int:
    """Return the best location bonus across all sites for a trial.

    Tiers (applied to the best-matching site):
      Same city + state  → +20
      Same state only    → +10
      Same country       → +3
      No match / unknown →  0
    """
    if not patient_loc or not sites:
        return 0

    p_city    = (patient_loc.get("city")    or "").strip().lower()
    p_state   = (patient_loc.get("state")   or "").strip().lower()
    p_country = (patient_loc.get("country") or "").strip().lower()

    best = -15  # default: assume all international until proven otherwise
    for site in sites:
        s_city    = (site.get("city")    or "").strip().lower()
        s_state   = (site.get("state")   or "").strip().lower()
        s_country = (site.get("country") or "").strip().lower()

        if p_city and p_state and s_city == p_city and s_state == p_state:
            return 20  # best possible — no need to check further
        elif p_state and s_state == p_state:
            best = max(best, 10)
        elif p_country and s_country == p_country:
            best = max(best, 3)

    return best


async def _geocode_all(trials: list[dict]) -> None:
    """Geocode all sites with missing coords in parallel using a thread pool."""
    tasks = {}
    for trial in trials:
        for site in trial.get("sites", []):
            addr = site.get("address")
            if site["lat"] is None and addr and addr not in tasks:
                tasks[addr] = asyncio.create_task(
                    asyncio.to_thread(geocode_address, addr)
                )

    if not tasks:
        return

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    coords_map = {
        addr: coords
        for addr, coords in zip(tasks.keys(), results)
        if isinstance(coords, tuple)
    }

    for trial in trials:
        for site in trial.get("sites", []):
            addr = site.get("address")
            if site["lat"] is None and addr in coords_map:
                site["lat"], site["lng"] = coords_map[addr]


@app.post("/rank")
async def rank(profile: PatientProfile):
    try:
        DIAGNOSIS_COND = {
            "GBM":               "glioblastoma",
            "Astrocytoma":       "astrocytoma brain",
            "Oligodendroglioma": "oligodendroglioma",
            "DIPG":              "diffuse intrinsic pontine glioma",
            "Other":             "brain tumor glioma",
        }
        base_cond = DIAGNOSIS_COND.get(profile.diagnosis.value, "brain tumor")
        condition  = f"recurrent {base_cond}" if profile.tumorStatus.value == "recurrent" else base_cond

        t0 = time.monotonic()
        raw    = await fetch_studies(condition=condition, page_size=25)
        trials = parse_studies(raw)
        print(f"[timing] fetch+parse: {time.monotonic()-t0:.2f}s  trials={len(trials)}")

        t1 = time.monotonic()
        (result, _), patient_loc = await asyncio.gather(
            asyncio.gather(rank_trials(profile, trials), _geocode_all(trials)),
            asyncio.to_thread(geocode_zip, profile.zipCode) if profile.zipCode else asyncio.sleep(0),
        )
        print(f"[timing] gpt+geocode+zip: {time.monotonic()-t1:.2f}s")

        sites_by_nct = {t["nct_id"]: t.get("sites", []) for t in trials}
        ranked_trials = result.get("rankedTrials", [])

        # Apply location bonus and re-sort
        if patient_loc:
            for trial in ranked_trials:
                sites = sites_by_nct.get(trial["nctId"], [])
                trial["matchScore"] = trial.get("matchScore", 0) + _location_bonus(sites, patient_loc)
            ranked_trials.sort(key=lambda t: t.get("matchScore", 0), reverse=True)
            for i, trial in enumerate(ranked_trials):
                trial["rank"] = i + 1

        for ranked in ranked_trials:
            ranked["sites"] = sites_by_nct.get(ranked["nctId"], [])

        return {**result, "rankedTrials": ranked_trials}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
