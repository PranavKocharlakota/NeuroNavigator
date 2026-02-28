from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from patient_profile import PatientProfile
from clinical_trials import fetch_studies, parse_studies
from prompts import rank_trials
import os
from geocode import geocode_address

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.post("/rank")
async def rank(profile: PatientProfile):
    try:
        query = f"{profile.diagnosis.value} brain tumor clinical trial"
        raw = fetch_studies(query=query, page_size=150)
        trials = parse_studies(raw)

        for trial in trials:
            for site in trial.get("sites", []):
                if site["lat"] is None and site["address"]:
                    coords = geocode_address(site["address"])
                    if coords:
                        site["lat"], site["lng"] = coords

        result = await rank_trials(profile, trials)

        sites_by_nct = {t["nct_id"]: t.get("sites", []) for t in trials}
        for ranked in result.get("rankedTrials", []):
            ranked["sites"] = sites_by_nct.get(ranked["nctId"], [])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
