import asyncio
import time
import requests

BASE_URL  = "https://clinicaltrials.gov/api/v2/studies"
CACHE_TTL = 600  # seconds (10 minutes)

_cache: dict[tuple, tuple] = {}  # (query, page_size, page_token) -> (data, timestamp)


def _fetch_studies_sync(condition: str = None, page_size: int = 10, page_token: str = None) -> dict:
    cache_key = (condition, page_size, page_token)
    now = time.monotonic()

    cached = _cache.get(cache_key)
    if cached and (now - cached[1]) < CACHE_TTL:
        return cached[0]

    params = {
        "pageSize": page_size,
        "sort": "LastUpdatePostDate:desc",
        "filter.overallStatus": "RECRUITING",
    }
    if condition:
        params["query.term"] = condition
    if page_token:
        params["pageToken"] = page_token

    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    _cache[cache_key] = (data, now)
    return data


async def fetch_studies(condition: str = None, page_size: int = 10, page_token: str = None) -> dict:
    return await asyncio.to_thread(_fetch_studies_sync, condition, page_size, page_token)


def parse_studies(data: dict) -> list[dict]:
    results = []
    for study in data.get("studies", []):
        protocol = study.get("protocolSection", {})
        id_module = protocol.get("identificationModule", {})
        status_module = protocol.get("statusModule", {})
        eligibility_module = protocol.get("eligibilityModule", {})
        locations_module = protocol.get("contactsLocationsModule", {})

        nct_id = id_module.get("nctId")
        eligibility = eligibility_module.get("eligibilityCriteria") or ""
        design_module = protocol.get("designModule", {})
        phases = design_module.get("phases", [])
        phase_str = " / ".join(phases) if phases else "N/A"

        sites = []
        for location in locations_module.get("locations", [])[:20]:
            facility = location.get("facility", "")
            city     = location.get("city", "")
            state    = location.get("state", "")
            country  = location.get("country", "")
            geo      = location.get("geoPoint")

            parts   = [part for part in [facility, city, state, country] if part]
            address = ", ".join(parts)

            if address:
                sites.append({
                    "facility": facility,
                    "city":     city,
                    "state":    state,
                    "country":  country,
                    "address":  address,
                    "lat":      geo.get("lat") if geo else None,
                    "lng":      geo.get("lon") if geo else None,
                })

        results.append({
            "nct_id": nct_id,
            "title": id_module.get("briefTitle"),
            "status": status_module.get("overallStatus"),
            "phase": phase_str,
            "eligibility": eligibility[:700],
            "url": f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None,
            "sites": sites,
        })
    return results


if __name__ == "__main__":
    data = asyncio.run(fetch_studies(query="cancer", page_size=5))
    studies = parse_studies(data)
    for s in studies:
        print(f"[{s['nct_id']}] {s['title']} — {s['status']}")
