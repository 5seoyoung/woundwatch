import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from PIL import Image

from app.core.config import settings
from app.core.database import get_db, WoundRecord
from app.models.schemas import AnalysisResponse
from app.services.ai_service import analyze_image
from app.services.area_calculator import estimate_wound_area

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file:       UploadFile = File(...),
    patient_id: str        = Form(default="default"),
    db:         Session    = Depends(get_db),
):
    # 파일 크기 검증
    content = await file.read()
    if len(content) > settings.max_image_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Image too large (max {settings.max_image_mb}MB)")

    # 이미지 로드
    try:
        image = Image.open(__import__("io").BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # 이미지 저장 (EXIF 없이)
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    image_path = str(upload_dir / filename)
    image.save(image_path, format="JPEG", exif=b"")

    # AI 분석
    result = analyze_image(image)

    # 면적 추정
    result["area_cm2"] = estimate_wound_area(image)

    # DB 저장
    today = datetime.now(timezone.utc).strftime("%b %d")
    record = WoundRecord(
        patient_id  = patient_id,
        image_path  = image_path,
        date        = today,
        infection   = result["infection"],
        ischemia    = result["ischemia"],
        severity    = result["severity"],
        area_cm2    = result.get("area_cm2"),
        risk_level  = result["risk_level"],
        description = result["description"],
    )
    db.add(record)
    db.commit()

    return AnalysisResponse(date=today, **result)
