"""
AI inference service — Ollama (local) or HuggingFace direct load.
Switch with USE_OLLAMA=true env var.

Gemma 4 multimodal: image token MUST come before text in the message.
Output is always parsed as JSON for structured wound assessment.
"""
import base64
import json
import re
from io import BytesIO
from PIL import Image

from app.core.config import settings
from app.services.risk_engine import compute_risk_level

SYSTEM_PROMPT = """You are a clinical AI assistant specialized in diabetic foot ulcer assessment.
Analyze the wound image and respond ONLY with a valid JSON object. No explanation, no markdown, no code fences.

{
  "infection": true or false,
  "ischemia": true or false,
  "severity": 0.0 to 10.0,
  "wound_area_cm2": estimated area as float,
  "description": "one paragraph clinical description in English",
  "confidence": 0.0 to 1.0,
  "bbox": [x_min, y_min, x_max, y_max]
}

Assessment criteria:
- infection: Look for erythema, purulent discharge, warmth indicators, tissue necrosis, perilesional inflammation
- ischemia: Look for pallor, cyanosis, lack of granulation tissue, dry necrosis, pale wound bed
- severity: 0=minimal/healing, 5=moderate progression, 10=critical/limb-threatening
- wound_area_cm2: estimate based on proportion of visible foot area (average adult foot ~150 cm2)
- confidence: your confidence in the assessment (0=very uncertain, 1=highly confident)
- bbox: bounding box of the primary wound region as normalized coordinates [x_min, y_min, x_max, y_max] where each value is between 0.0 and 1.0 (0,0 = top-left corner, 1,1 = bottom-right corner)"""


# ── JSON parser ───────────────────────────────────────────────────────────────

def parse_gemma_response(text: str) -> dict:
    """Extract JSON from Gemma output. Falls back to safe defaults on failure."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            raw_bbox = data.get("bbox")
            bbox = None
            if isinstance(raw_bbox, list) and len(raw_bbox) == 4:
                try:
                    bbox = [float(min(max(v, 0.0), 1.0)) for v in raw_bbox]
                    if bbox[2] <= bbox[0] or bbox[3] <= bbox[1]:
                        bbox = None
                except (ValueError, TypeError):
                    bbox = None
            return {
                "infection":      bool(data.get("infection", False)),
                "ischemia":       bool(data.get("ischemia", False)),
                "severity":       float(min(max(data.get("severity", 5.0), 0.0), 10.0)),
                "wound_area_cm2": float(data.get("wound_area_cm2", 2.0)) if data.get("wound_area_cm2") else None,
                "description":    str(data.get("description", "Analysis complete.")),
                "confidence":     float(min(max(data.get("confidence", 0.5), 0.0), 1.0)),
                "bbox":           bbox,
            }
        except (json.JSONDecodeError, ValueError, TypeError):
            pass
    # Fallback — return safe defaults so the API never crashes
    return {
        "infection":      False,
        "ischemia":       False,
        "severity":       5.0,
        "wound_area_cm2": None,
        "description":    "Analysis unavailable. Please ensure Ollama is running and try again.",
        "confidence":     0.0,
        "bbox":           None,
    }


# ── Ollama path ───────────────────────────────────────────────────────────────

def _analyze_ollama(image: Image.Image) -> dict:
    import ollama
    buf = BytesIO()
    image.save(buf, format="JPEG")
    # Gemma 4 multimodal: images must be passed as bytes list
    response = ollama.chat(
        model=settings.ollama_model,
        messages=[{
            "role":    "user",
            "content": SYSTEM_PROMPT,
            "images":  [buf.getvalue()],
        }],
    )
    raw_text = response["message"]["content"]
    return parse_gemma_response(raw_text)


# ── HuggingFace direct load path ──────────────────────────────────────────────

_hf_model     = None
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


def _analyze_hf(image: Image.Image) -> dict:
    import torch
    _load_hf_model()
    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text",  "text": SYSTEM_PROMPT},
        ],
    }]
    inputs = _hf_processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to("cuda" if torch.cuda.is_available() else "cpu")

    outputs = _hf_model.generate(**inputs, max_new_tokens=400, do_sample=False)
    raw_text = _hf_processor.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    )
    return parse_gemma_response(raw_text)


# ── Demo mode (no Ollama / GPU — for local UI testing only) ──────────────────

def _analyze_demo(image: Image.Image) -> dict:
    import numpy as np
    arr = np.array(image.convert("L"))
    brightness = arr.mean() / 255
    severity = round(10 * (1 - brightness * 0.6), 1)
    severity = max(2.0, min(9.0, severity))
    infection = severity > 5.5
    ischemia  = severity > 7.0
    return {
        "infection":      infection,
        "ischemia":       ischemia,
        "severity":       severity,
        "wound_area_cm2": round(1.5 + severity * 0.3, 1),
        "description": (
            f"{'Erythema and exudate detected suggesting bacterial infection. ' if infection else 'No clear signs of active infection. '}"
            f"{'Compromised perfusion indicated by pallor and dry wound bed. ' if ischemia else 'Adequate perfusion observed. '}"
            f"Severity assessed at {severity}/10. "
            "[DEMO MODE — connect Ollama (ollama pull gemma4:4b) for real Gemma 4 analysis]"
        ),
        "confidence": 0.0,
        "bbox": [0.25, 0.30, 0.75, 0.80],
    }


# ── Public interface ──────────────────────────────────────────────────────────

def analyze_image(image: Image.Image) -> dict:
    if settings.use_ollama:
        try:
            result = _analyze_ollama(image)
        except Exception:
            result = _analyze_demo(image)
    else:
        try:
            result = _analyze_hf(image)
        except (ImportError, Exception):
            result = _analyze_demo(image)

    result["risk_level"] = compute_risk_level(
        result["severity"], result["infection"], result["ischemia"]
    )
    return result
