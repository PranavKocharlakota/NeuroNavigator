from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── ENUMS ──────────────────────────────────────────────────────────────────
# These become the exact option values sent from the frontend dropdowns.
# Adding a new option = add one line here, update the frontend dropdown.

class Diagnosis(str, Enum):
    GBM             = "GBM"
    Astrocytoma     = "Astrocytoma"
    Oligodendroglioma = "Oligodendroglioma"
    DIPG            = "DIPG"
    Other           = "Other"

class TumorStatus(str, Enum):
    newly_diagnosed = "newly_diagnosed"
    recurrent       = "recurrent"

class IDHStatus(str, Enum):
    mutant   = "mutant"
    wildtype = "wildtype"
    unknown  = "unknown"

class MGMTStatus(str, Enum):
    methylated   = "methylated"
    unmethylated = "unmethylated"
    unknown      = "unknown"

class PriorTreatment(str, Enum):
    # These are the checklist options in the frontend.
    # Each value is what gets stored and sent to GPT.
    # To add a new treatment: add one line here + one checkbox in the UI.
    Surgery        = "Surgery"
    Radiation      = "Radiation"
    Temozolomide   = "Temozolomide"
    Bevacizumab    = "Bevacizumab"
    Immunotherapy  = "Immunotherapy"
    Lomustine      = "Lomustine"
    Other          = "Other"

class ECOGStatus(int, Enum):
    # Stored as int (0-4) but displayed as plain English in the frontend.
    # The frontend maps each value to a description — see ECOG_DESCRIPTIONS below.
    fully_active          = 0
    light_work            = 1
    self_care_no_work     = 2
    limited_self_care     = 3
    completely_disabled   = 4

class RecurrenceNumber(str, Enum):
    first  = "1st"
    second = "2nd"
    third_or_more = "3rd or more"


# ── FRONTEND DISPLAY MAPS ──────────────────────────────────────────────────
# These live in the backend but can be served to the frontend via a
# /api/form-options endpoint so the UI never hardcodes display strings.
# To update a label: change it here, frontend picks it up automatically.

DIAGNOSIS_LABELS = {
    Diagnosis.GBM:               "Glioblastoma (GBM)",
    Diagnosis.Astrocytoma:       "Astrocytoma",
    Diagnosis.Oligodendroglioma: "Oligodendroglioma",
    Diagnosis.DIPG:              "DIPG (Diffuse Intrinsic Pontine Glioma)",
    Diagnosis.Other:             "Other Brain Tumor",
}

ECOG_DESCRIPTIONS = {
    ECOGStatus.fully_active:        "Fully active — no restrictions",
    ECOGStatus.light_work:          "Can do light work, tires with heavy activity",
    ECOGStatus.self_care_no_work:   "Up and about, can care for myself, cannot work",
    ECOGStatus.limited_self_care:   "Limited self-care, in bed or chair more than half the day",
    ECOGStatus.completely_disabled: "Completely disabled, no self-care",
}

PRIOR_TREATMENT_LABELS = {
    PriorTreatment.Surgery:       "Surgery (resection or biopsy)",
    PriorTreatment.Radiation:     "Radiation therapy",
    PriorTreatment.Temozolomide:  "Temozolomide (Temodar)",
    PriorTreatment.Bevacizumab:   "Bevacizumab (Avastin)",
    PriorTreatment.Immunotherapy: "Immunotherapy (checkpoint inhibitor)",
    PriorTreatment.Lomustine:     "Lomustine (CCNU)",
    PriorTreatment.Other:         "Other",
}


# ── PATIENT PROFILE ────────────────────────────────────────────────────────

class PatientProfile(BaseModel):

    # ── SECTION 1: Basic info (required) ──────────────────────────────
    # Every field here maps 1:1 to a UI element in Section 1 of the form.

    age:         int            = Field(..., ge=18, le=100)
    diagnosis:   Diagnosis
    grade:       int            = Field(..., ge=1, le=4)
    tumorStatus: TumorStatus

    # ── SECTION 1 continued: Treatment & status ───────────────────────

    priorTreatments: list[PriorTreatment] = Field(
        default_factory=list,
        description="Checklist — select all that apply"
    )
    ecog: ECOGStatus

    steroidUse:       bool           = False
    steroidDoseMgDay: Optional[float] = Field(
        None,
        description="Only required if steroidUse is True"
    )

    zipCode: Optional[str] = Field(
        None,
        description="Used for map distance calculations only, not sent to GPT"
    )

    # ── SECTION 2: Pathology report (all optional) ────────────────────
    # None = not tested / unknown — GPT treats this as -5pts + dataGap flag.
    # Frontend shows "I don't know" as a valid selection for each field.

    idh:  Optional[IDHStatus]  = None
    mgmt: Optional[MGMTStatus] = None

    # Nice-to-have fields — only shown if user clicks "Add more detail"
    recurrenceNumber: Optional[RecurrenceNumber] = Field(
        None,
        description="Only relevant if tumorStatus is recurrent"
    )
    mutations: list[str] = Field(
        default_factory=list,
        description="Free tag input — e.g. BRAF V600E, EGFR amplification"
    )
    additionalNotes: Optional[str] = Field(
        None,
        max_length=500,
        description="Anything else relevant"
    )

    # ── DERIVED FIELDS ─────────────────────────────────────────────────
    # Computed from other fields — never set directly by the user or frontend.
    # GPT receives these pre-computed so it doesn't have to infer them.

    @property
    def priorBevacizumab(self) -> bool:
        return PriorTreatment.Bevacizumab in self.priorTreatments

    @property
    def priorImmunotherapy(self) -> bool:
        return PriorTreatment.Immunotherapy in self.priorTreatments

    @property
    def isRecurrent(self) -> bool:
        return self.tumorStatus == TumorStatus.recurrent

    @property
    def untestedMarkers(self) -> list[str]:
        """
        Auto-generated list of markers the patient didn't provide.
        Sent to GPT so it can generate specific dataGaps recommendations.
        """
        untested = []
        if self.idh  is None: untested.append("IDH status")
        if self.mgmt is None: untested.append("MGMT methylation")
        return untested


    def for_gpt(self) -> dict:
        """
        Clean dict to send to GPT.
        - Resolves None → "unknown — not tested or not reported"
        - Adds derived fields
        - Strips zipCode (not relevant for matching)
        - Converts enums to their string values
        """
        return {
            # Section 1
            "age":              self.age,
            "diagnosis":        self.diagnosis.value,
            "grade":            self.grade,
            "isRecurrent":      self.isRecurrent,
            "recurrenceNumber": self.recurrenceNumber.value if self.recurrenceNumber else "not specified",
            "priorTreatments":  [t.value for t in self.priorTreatments],
            "priorBevacizumab": self.priorBevacizumab,
            "priorImmunotherapy": self.priorImmunotherapy,
            "ecog":             self.ecog.value,
            "steroidUse":       self.steroidUse,
            "steroidDoseMgDay": self.steroidDoseMgDay,

            # Section 2 — None becomes explicit "unknown" string for GPT
            "idh":  self.idh.value  if self.idh  else "unknown — not tested or not reported",
            "mgmt": self.mgmt.value if self.mgmt else "unknown — not tested or not reported",

            # Nice-to-have
            "mutations":       self.mutations,
            "untestedMarkers": self.untestedMarkers,
            "additionalNotes": self.additionalNotes or "",
        }