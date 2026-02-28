import requests

BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def fetch_studies(query: str = None, page_size: int = 10, page_token: str = None) -> dict:
    params = {"pageSize": page_size, "sort": "LastUpdatePostDate:desc"}
    if query:
        params["query.term"] = query
    if page_token:
        params["pageToken"] = page_token

    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()
    return response.json()


def parse_studies(data: dict) -> list[dict]:
    results = []
    for study in data.get("studies", []):
        protocol = study.get("protocolSection", {})
        id_module = protocol.get("identificationModule", {})
        status_module = protocol.get("statusModule", {})
        eligibility_module = protocol.get("eligibilityModule", {})

        nct_id = id_module.get("nctId")
        eligibility = eligibility_module.get("eligibilityCriteria") or ""
        design_module = protocol.get("designModule", {})
        phases = design_module.get("phases", [])
        phase_str = " / ".join(phases) if phases else "N/A"
        results.append({
            "nct_id": nct_id,
            "title": id_module.get("briefTitle"),
            "status": status_module.get("overallStatus"),
            "phase": phase_str,
            "eligibility": eligibility[:700],
            "url": f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None,
        })
    return results


if __name__ == "__main__":
    data = fetch_studies(query="cancer", page_size=5)
    studies = parse_studies(data)
    for s in studies:
        print(f"[{s['nct_id']}] {s['title']} — {s['status']}")
