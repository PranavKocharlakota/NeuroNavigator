from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from patient_profile import PatientProfile
from clinical_trials import fetch_studies, parse_studies
from prompts import rank_trials
from geocode import geocode_address
import asyncio
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/api/maps-key")
def maps_key():
    key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="Maps key not configured")
    return {"key": key}


async def _geocode_all(trials: list[dict]) -> None:
    """Geocode all sites with missing coords in parallel using a thread pool."""
    tasks = {}
    for trial in trials:
        for site in trial.get("sites", []):
            addr = site.get("address")
            if site["lat"] is None and addr and addr not in tasks:
                # asyncio.to_thread runs the sync geocode_address in a thread,
                # allowing all missing addresses to geocode concurrently
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
    import time
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
        raw    = await fetch_studies(condition=condition, page_size=50)
        trials = parse_studies(raw)
        print(f"[timing] fetch+parse: {time.monotonic()-t0:.2f}s  trials={len(trials)}")

        t1 = time.monotonic()
        result, _ = await asyncio.gather(
            rank_trials(profile, trials),
            _geocode_all(trials),
        )
        print(f"[timing] gpt+geocode: {time.monotonic()-t1:.2f}s")

        sites_by_nct = {t["nct_id"]: t.get("sites", []) for t in trials}
        for ranked in result.get("rankedTrials", []):
            ranked["sites"] = sites_by_nct.get(ranked["nctId"], [])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
