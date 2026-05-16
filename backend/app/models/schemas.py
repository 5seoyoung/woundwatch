from pydantic import BaseModel
from typing import Optional

class PatientCreate(BaseModel):
    name:          str
    diabetes_type: str

class PatientResponse(BaseModel):
    patient_id:    str
    name:          str
    diabetes_type: str
    created_at:    str

class AnalysisResponse(BaseModel):
    infection:       bool
    ischemia:        bool
    severity:        float
    wound_area_cm2:  Optional[float]
    risk_level:      str           # LOW | MEDIUM | HIGH
    description:     str
    date:            str
    bbox:            Optional[list[float]]  # [x_min, y_min, x_max, y_max] normalized 0-1
    confidence:      Optional[float]

class HistoryRecord(AnalysisResponse):
    id:         int
    patient_id: str
    image_path: str
