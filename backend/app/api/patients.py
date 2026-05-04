import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db, Patient
from app.models.schemas import PatientCreate, PatientResponse

router = APIRouter()


@router.post("/patients", response_model=PatientResponse)
def register_patient(body: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(
        id            = str(uuid.uuid4()),
        name          = body.name.strip(),
        diabetes_type = body.diabetes_type,
        created_at    = datetime.now(timezone.utc),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return PatientResponse(
        patient_id    = patient.id,
        name          = patient.name,
        diabetes_type = patient.diabetes_type,
        created_at    = patient.created_at.strftime("%b %Y"),
    )


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse(
        patient_id    = patient.id,
        name          = patient.name,
        diabetes_type = patient.diabetes_type,
        created_at    = patient.created_at.strftime("%b %Y"),
    )
