from pydantic import BaseModel
from typing import Optional

class AnalysisResponse(BaseModel):
    infection:   bool
    ischemia:    bool
    severity:    float
    area_cm2:    Optional[float]
    risk_level:  str           # LOW | MEDIUM | HIGH
    description: str
    date:        str

class HistoryRecord(AnalysisResponse):
    id:         int
    patient_id: str
    image_path: str
