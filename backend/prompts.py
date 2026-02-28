from openai import AsyncOpenAI, RateLimitError
from patient_profile import PatientProfile
import asyncio
import json

CHUNK_SIZE    = 10  # trials per GPT call — smaller chunks finish faster in parallel
MAX_PARALLEL  = 5   # max simultaneous GPT calls; controls TPM burst
MAX_RETRIES   = 4   # retry attempts on rate-limit errors
RETRY_BASE_S  = 2   # exponential backoff base (2, 4, 8, 16 seconds)

SYSTEM_PROMPT = """
You are a neuro-oncology clinical trial eligibility analyst. Evaluate a patient profile against a list of active trials and return a ranked JSON match report.

HARD EXCLUSIONS — only exclude when BOTH are true: the trial explicitly requires/excludes something AND the patient's profile CONFIRMS they fail it. Unknown/untested markers are never grounds for exclusion — deduct points instead. Valid exclusions: confirmed wrong age range, confirmed recurrent when trial requires newly diagnosed, confirmed prior bevacizumab when excluded, confirmed negative marker when trial requires it, ECOG clearly below KPS threshold.

PATIENT ADDITIONAL NOTES are hard restrictions. Any trial that violates a constraint stated in `additionalNotes` MUST be excluded from rankedTrials entirely — treat violations the same as a confirmed hard exclusion. Do not include violating trials at a lower score; remove them completely.

SCORING (0–100):
- Molecular markers (40 pts): +15 IDH match, +10 MGMT match, +8 each confirmed additional mutation; -5 each untested required marker; -10 trial prefers marker patient lacks
- Treatment history (25 pts): +25 all criteria met, +15 minor ambiguity, +5 borderline, 0 significant uncertainty
- Performance status (20 pts): +20 clearly within threshold, +10 borderline, 0 fails
- Age & general eligibility (15 pts): +10 age confirmed, +5 measurable disease confirmed

Untested markers: apply -5, add to warningFlags (e.g. "EGFRvIII untested — confirm; positive result would strengthen match"), never exclude.

Per ranked trial write:
- patientExplanation: 3–4 conversational sentences a non-scientist can follow; explain what the treatment does in everyday terms (e.g. "targets a protein that helps the tumor grow"), then tell the patient specifically what about their situation makes them a candidate; be warm and concrete, no unexplained acronyms or lab terms

dataGaps: actionable recommendations for untested markers that would open additional trials.

OUTPUT: Return only valid JSON, matchScore ≥ 40 only, ranked descending; Phase III breaks ties. All fields required, use [] not null.

{
  "rankedTrials": [
    {
      "rank": 1,
      "nctId": "NCT...",
      "name": "string",
      "phase": "Phase I | Phase II | Phase III | Phase I/II | Phase II/III | N/A",
      "type": "Targeted Therapy | Immunotherapy | Chemotherapy | Vaccine / Immunotherapy | Standard + Device | Other",
      "matchScore": 85,
      "matchTier": "Strong | Moderate | Partial",
      "location": "string",
      "status": "Recruiting | Active, not recruiting | Completed | Unknown",
      "eligibilitySummary": ["string"],
      "mechanism": "string",
      "keyDates": "string",
      "patientExplanation": "string",
      "warningFlags": []
    }
  ],
  "dataGaps": ["string"]
}
"""


async def _rank_chunk(client: AsyncOpenAI, sem: asyncio.Semaphore,
                      profile_dict: dict, chunk: list[dict], index: int = 0) -> dict:
    """Score one batch of trials, throttled by semaphore + retry on rate limit."""
    await asyncio.sleep(index * 0.5)  # stagger starts to avoid OpenAI burst queuing
    notes = profile_dict.get("additionalNotes", "").strip()
    constraints_block = (
        f"⛔ HARD EXCLUSION CONSTRAINTS — ANY TRIAL VIOLATING THESE MUST BE REMOVED FROM rankedTrials:\n{notes}\n\n"
        if notes else ""
    )
    user_message = (
        f"PATIENT PROFILE:\n{json.dumps(profile_dict, indent=2)}\n\n"
        f"{constraints_block}"
        f"CLINICAL TRIALS TO EVALUATE ({len(chunk)} total):\n{json.dumps(chunk, indent=2)}\n\n"
        "Rank these trials by eligibility match. Return JSON only."
    )
    import time
    async with sem:
        for attempt in range(MAX_RETRIES):
            try:
                t = time.monotonic()
                response = await client.chat.completions.create(
                    model="gpt-4.1-nano",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": user_message},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0,
                )
                print(f"[timing] gpt chunk ({len(chunk)} trials): {time.monotonic()-t:.2f}s")
                return json.loads(response.choices[0].message.content)
            except RateLimitError:
                sleep_s = RETRY_BASE_S ** attempt
                print(f"[timing] RateLimitError attempt={attempt}, sleeping {sleep_s}s")
                if attempt == MAX_RETRIES - 1:
                    raise
                await asyncio.sleep(sleep_s)


async def rank_trials(profile: PatientProfile, raw_trials: list[dict]) -> dict:
    """
    Split trials into CHUNK_SIZE batches, run at most MAX_PARALLEL at a time
    (semaphore), retry on rate-limit errors, then merge and return the top 8.
    """
    client = AsyncOpenAI()
    profile_dict = profile.for_gpt()
    sem = asyncio.Semaphore(MAX_PARALLEL)

    chunks = [raw_trials[i:i + CHUNK_SIZE] for i in range(0, len(raw_trials), CHUNK_SIZE)]
    chunk_results = await asyncio.gather(*[
        _rank_chunk(client, sem, profile_dict, chunk, i) for i, chunk in enumerate(chunks)
    ])

    all_ranked = []
    all_gaps   = []
    seen_gaps  = set()

    for result in chunk_results:
        all_ranked.extend(result.get("rankedTrials", []))
        for gap in result.get("dataGaps", []):
            if gap not in seen_gaps:
                seen_gaps.add(gap)
                all_gaps.append(gap)

    all_ranked.sort(key=lambda t: t.get("matchScore", 0), reverse=True)
    top8 = all_ranked[:8]
    for i, trial in enumerate(top8):
        trial["rank"] = i + 1

    return {
        "rankedTrials": top8,
        "dataGaps":     all_gaps,
    }
