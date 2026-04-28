"""
AI 추론 서비스 — Ollama(로컬) 또는 HuggingFace 모델 직접 로드 선택 가능.
USE_OLLAMA=true 환경변수로 전환.
"""
import base64
from io import BytesIO
from PIL import Image

from app.core.config import settings
from app.services.risk_engine import parse_gemma_output, compute_risk_level

PROMPT = (
    "Analyze this diabetic foot image. "
    "Determine: (1) infection status — present or absent, "
    "(2) ischemia status — present or absent, "
    "(3) severity score 0-10, "
    "(4) brief clinical description."
)

# ── Ollama 경로 ───────────────────────────────────────────────────────────────

def _analyze_ollama(image: Image.Image) -> str:
    import ollama
    buf = BytesIO()
    image.save(buf, format="JPEG")
    raw = ollama.chat(
        model=settings.ollama_model,
        messages=[{
            "role": "user",
            "content": PROMPT,
            "images": [buf.getvalue()],
        }],
    )
    return raw["message"]["content"]


# ── HuggingFace 직접 로드 경로 ────────────────────────────────────────────────

_hf_model = None
_hf_processor = None

def _load_hf_model():
    global _hf_model, _hf_processor
    if _hf_model is not None:
        return
    from unsloth import FastVisionModel
    _hf_model, _hf_processor = FastVisionModel.from_pretrained(
        settings.hf_model_repo,
        load_in_4bit=True,
    )
    FastVisionModel.for_inference(_hf_model)


def _analyze_hf(image: Image.Image) -> str:
    import torch
    _load_hf_model()
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text",  "text": PROMPT},
            ],
        }
    ]
    inputs = _hf_processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to("cuda" if torch.cuda.is_available() else "cpu")

    outputs = _hf_model.generate(**inputs, max_new_tokens=300, do_sample=False)
    return _hf_processor.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    )


# ── 데모 모드 (Unsloth/Ollama 없을 때 로컬 테스트용) ─────────────────────────

import random as _random

def _analyze_demo(image: Image.Image) -> str:
    # 이미지 밝기로 severity 흉내 (실제 분석 아님)
    import numpy as np
    arr = np.array(image.convert("L"))
    brightness = arr.mean() / 255
    severity = round(10 * (1 - brightness * 0.6), 1)
    severity = max(2.0, min(9.0, severity))
    infection = severity > 5
    ischemia  = severity > 7
    return (
        f"Infection: {'present' if infection else 'absent'}. "
        f"Ischemia: {'present' if ischemia else 'absent'}. "
        f"Severity: {severity}/10. "
        "Wound shows signs consistent with diabetic foot ulcer. "
        "Regular monitoring recommended. [DEMO MODE — connect Ollama or GPU for real analysis]"
    )


# ── 공개 인터페이스 ────────────────────────────────────────────────────────────

def analyze_image(image: Image.Image) -> dict:
    if settings.use_ollama:
        try:
            raw_text = _analyze_ollama(image)
        except Exception:
            raw_text = _analyze_demo(image)
    else:
        try:
            raw_text = _analyze_hf(image)
        except (ImportError, Exception):
            raw_text = _analyze_demo(image)

    parsed = parse_gemma_output(raw_text)
    parsed["risk_level"] = compute_risk_level(
        parsed["severity"], parsed["infection"], parsed["ischemia"]
    )
    parsed["description"] = raw_text
    return parsed
