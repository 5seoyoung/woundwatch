from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db, WoundRecord
from app.models.schemas import HistoryRecord

router = APIRouter()


@router.get("/history", response_model=list[HistoryRecord])
def get_history(
    patient_id: str     = Query(default="default"),
    limit:      int     = Query(default=30, le=100),
    db:         Session = Depends(get_db),
):
    records = (
        db.query(WoundRecord)
        .filter(WoundRecord.patient_id == patient_id)
        .order_by(WoundRecord.created_at.asc())
        .limit(limit)
        .all()
    )
    return [
        HistoryRecord(
            id          = r.id,
            patient_id  = r.patient_id,
            image_path  = r.image_path,
            date        = r.date,
            infection   = r.infection,
            ischemia    = r.ischemia,
            severity    = r.severity,
            area_cm2    = r.area_cm2,
            risk_level  = r.risk_level,
            description = r.description or "",
        )
        for r in records
    ]
