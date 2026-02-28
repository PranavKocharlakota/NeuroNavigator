from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from patient_profile import PatientProfile
from clinical_trials import fetch_studies, parse_studies
from prompts import rank_trials

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


@app.post("/rank")
async def rank(profile: PatientProfile):
    try:
        query = f"{profile.diagnosis.value} brain tumor clinical trial"
        raw = fetch_studies(query=query, page_size=150)
        trials = parse_studies(raw)
        result = await rank_trials(profile, trials)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
