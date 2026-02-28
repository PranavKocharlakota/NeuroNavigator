import requests

BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def fetch_studies(query: str = None, page_size: int = 10, page_token: str = None) -> dict:
    params = {"pageSize": page_size}
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
        desc_module = protocol.get("descriptionModule", {})
        eligibility_module = protocol.get("eligibilityModule", {})

        results.append({
            "nct_id": id_module.get("nctId"),
            "title": id_module.get("briefTitle"),
            "status": status_module.get("overallStatus"),
            "summary": desc_module.get("briefSummary"),
            "eligibility": eligibility_module.get("eligibilityCriteria"),
        })
    return results


if __name__ == "__main__":
    data = fetch_studies(query="cancer", page_size=5)
    studies = parse_studies(data)
    for s in studies:
        print(f"[{s['nct_id']}] {s['title']} — {s['status']}")
