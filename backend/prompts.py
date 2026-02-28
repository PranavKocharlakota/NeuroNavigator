from openai import AsyncOpenAI
import json

client = AsyncOpenAI()

SYSTEM_PROMPT = """
You are a neuro-oncology clinical trial matching assistant.
Given a patient's molecular profile and a list of clinical trials, you will:

1. Analyze each trial's eligibility criteria against the patient profile
2. Assign a match score 0-100 based on:
   - Molecular marker alignment (IDH, MGMT, mutations) — 40%
   - Treatment history compatibility — 25%
   - Performance status eligibility — 20%
   - Age and general criteria — 15%
3. Rank trials from highest to lowest match
4. For each trial, write a 2-3 sentence plain-English explanation of WHY it matches or doesn't
5. Flag any hard exclusion criteria that immediately disqualify

Return ONLY valid JSON. No markdown, no preamble.
Schema:
{
  "trials": [
    {
      "nctId": "NCT...",
      "rank": 1,
      "matchScore": 94,
      "matchLabel": "Strong Match",
      "shortName": "...",
      "reasoning": "...",
      "keyFlags": ["BRAF fusion required — confirmed", "No prior immunotherapy — met"],
      "hardExclusions": []
    }
  ]
}
"""

async def rank_trials(profile: PatientProfile, raw_trials: list[dict]) -> dict:
    """Send trials + patient profile to OpenAI for reasoning and ranking."""

    user_message = f"""
PATIENT PROFILE:
{json.dumps(profile.model_dump(), indent=2)}

CLINICAL TRIALS TO EVALUATE ({len(raw_trials)} total):
{json.dumps(raw_trials, indent=2)}

Rank these trials by eligibility match for this specific patient.
Return JSON only.
"""

    response = await client.chat.completions.create(
        model="o3",               # or "gpt-4o" for speed/cost tradeoff
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=1,            # o3 requires temperature=1
    )

    return json.loads(response.choices[0].message.content)