import requests

BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def _build_parameters(user_input):
    parameters = {"pageSize": user_input.get("page_size", 10)}

    if user_input.get("condition"):
        parameters["query.cond"] = user_input["condition"]

    if user_input.get("keywords"):
        parameters["query.term"] = user_input["keywords"]

    if user_input.get("intervention"):
        parameters["query.intr"] = user_input["intervention"]

    if user_input.get("status"):
        parameters["filter.overallStatus"] = user_input["status"]

    if user_input.get("phase"):
        parameters["filter.phase"] = user_input["phase"]

    if user_input.get("page_token"):
        parameters["pageToken"] = user_input["page_token"]

    return parameters


def _extract_needed_info(raw):
    output = []
    for study in raw.get("studies", []):
        protocol = study.get("protocolSection", {})

        identification = protocol.get("identificationModule", {})
        status = protocol.get("statusModule", {})
        description = protocol.get("descriptionModule", {})
        condition = protocol.get("conditionsModule", {})
        arms = protocol.get("armsInterventionsModule", {})
        eligibility = protocol.get("eligibilityModule", {})

        nct_id = identification.get("nctId")
        if nct_id:
            url = f"https://clinicaltrials.gov/study/{nct_id}"
        else:
            url = None

        interventions = []
        for intervention in (arms.get("interventions") or []):
            name = intervention.get("name")
            if name:
                interventions.append(name)

        output.append({
            "nct_id": nct_id,
            "title": identification.get("briefTitle") or identification.get("officialTitle"),
            "overall_status": status.get("overallStatus"),
            "conditions": condition.get("conditions") or [],
            "interventions": interventions,
            "brief_summary": description.get("briefSummary"),
            "eligibility_criteria": eligibility.get("eligibilityCriteria"),
            "url": url,
        })

    return {
        "count": len(output),
        "next_page_token": raw.get("nextPageToken"),
        "studies": output,
    }


def search_trials(user_input):
    params = _build_parameters(user_input)
    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()
    return _extract_needed_info(response.json())