from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db, WoundRecord
from app.services.risk_engine import calculate_risk_score

router = APIRouter()


@router.get("/risk-score/{patient_id}")
def get_risk_score(patient_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(WoundRecord)
        .filter(WoundRecord.patient_id == patient_id)
        .order_by(WoundRecord.created_at.asc())
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this patient")

    result = calculate_risk_score(records)
    return {"patient_id": patient_id, **result}
