# WoundWatch
<img width="560" height="280" alt="image" src="https://github.com/user-attachments/assets/950c4e6a-96f6-434a-833e-5d08e45201d6" />

**Diabetic Foot Ulcer Weekly Tracking + Amputation Risk Early Warning**

Every 20 seconds, a lower limb is amputated somewhere in the world due to diabetic complications. 80% of these amputations are preceded by a foot ulcer — yet patients have no way of knowing how quickly their wound is deteriorating between hospital visits.

WoundWatch closes this gap. It uses **Gemma 4 E2B multimodal AI** to analyze weekly foot photos and answer the question that matters most: **Is this wound worse than last week?**

---

## Links

| | |
|---|---|
| **Live Demo** | https://5seoyoung.github.io/woundwatch |
| **Landing Page** | https://5seoyoung.github.io/woundwatch_landing/ |
| **Kaggle Writeup** | https://kaggle.com/competitions/gemma-4-good-hackathon/writeups/woundwatch |
| **Backend API** | https://huggingface.co/spaces/5seoyoung/woundwatch |
| **Fine-tuned Model** | https://huggingface.co/5seoyoung/woundwatch-gemma4-dfu |

> No sign-up required — click **Try Demo** to explore Alex Henderson's 3-week DFU case.

---

## The Problem

Existing wound apps classify a single photo. They cannot answer what matters most: *is this wound worse than last week?* Judging a wound from a single snapshot is like measuring blood pressure once and diagnosing hypertension.

- 80% of diabetic amputations are preceded by a foot ulcer (Armstrong et al., JAMA 2023)
- 5-year mortality for DFU patients: ~30% — exceeding 70% for those who undergo major amputation
- Most patients cannot visit a clinic weekly due to cost and mobility limitations

---

## What It Does

1. **Upload or photograph** a diabetic foot wound weekly (JPG / PNG / HEIC)
2. **Gemma 4 E2B** classifies infection, ischemia, severity (0–10), estimates wound area, and returns a bounding box around the primary wound region
3. **AI overlay** draws the detected wound region on the photo with labeled infection and ischemia markers
4. **OpenCV** estimates wound area in cm² via dual HSV masking (red channel for open wounds, dark channel for necrosis)
5. **Risk engine** computes a time-series composite score (0–100): area change rate (40%) + infection status (35%) + ischemia (25%)
6. **Weekly delta card** shows exactly what changed since last week — area, risk level, infection, ischemia
7. **Action checklist** gives risk-level-specific next steps; score ≥ 70 triggers HIGH alert

---

## Architecture

```
[Mobile Browser]
      │  photo upload
      ▼
[React 18 Frontend]           → GitHub Pages
  Onboarding / Home / Scan / Progress / Profile
      │  POST /api/analyze
      ▼
[FastAPI Backend]             → HuggingFace Spaces (Docker, port 7860)
  ├── AI inference:  Gemma 4 via Ollama      ← local / Ollama track
  │                  Gemma 4 via HF Hub      ← cloud GPU
  │                  brightness heuristic    ← demo fallback (no GPU)
  ├── OpenCV area estimation (dual HSV mask)
  ├── SQLite time-series storage
  └── Risk engine (single-scan + composite score)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemma 4 E2B (multimodal), fine-tuned on 1,560 DFU images |
| Fine-tuning | [Unsloth](https://github.com/unslothai/unsloth) + QLoRA (r=16, 4-bit) on Kaggle T4 ×2 |
| Local Inference | [Ollama](https://ollama.com) + GGUF Q4_K_M |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Frontend | React 18 + Vite + Canvas API overlay + custom SVG charts |
| Area Estimation | OpenCV dual HSV contour detection |
| Deployment | GitHub Pages (frontend) + HF Spaces Docker (backend) |

---

## Project Structure

```
woundwatch/
├── backend/
│   ├── app/
│   │   ├── api/              # /analyze, /history, /patients, /risk
│   │   ├── core/             # config, database (SQLAlchemy + SQLite)
│   │   ├── models/           # Pydantic schemas (incl. bbox, confidence)
│   │   └── services/
│   │       ├── ai_service.py       # Gemma 4 inference (3-path fallback)
│   │       ├── area_calculator.py  # OpenCV wound area estimation
│   │       └── risk_engine.py      # single-scan + time-series scoring
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/samples/       # Real DFU dataset sample images (case-a/b/c)
│   └── src/
│       ├── components/       # WoundOverlay (bbox canvas), AnalysisResult, WoundChart
│       ├── pages/            # Onboarding, Home, Dashboard, History, Profile
│       └── hooks/usePatient.js
├── notebooks/
│   └── 02_finetune_gemma4_unsloth.ipynb   # Unsloth fine-tuning notebook
└── DEVELOPMENT_LOG.md        # Full development log (Korean)
```

---

## Gemma 4 Fine-tuning

Fine-tuned `unsloth/gemma-4-E2B-it` on 1,560 DFU images using QLoRA (r=16, 4-bit) for 3 epochs on Kaggle T4 ×2. Trainable parameters: 0.58% of total.

**Training datasets:**
- [`laithjj/diabetic-foot-ulcer-dfu`](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu) — binary DFU/healthy labels
- [`leoscode/wound-segmentation-images`](https://www.kaggle.com/datasets/leoscode/wound-segmentation-images) — segmentation masks for area ratio

**Key challenge — Gemma 4 image token ordering:**  
Gemma 4 multimodal enforces a strict constraint: image tokens must precede text tokens. Mixing `str` vs `list[dict]` content across roles caused silent accuracy degradation via PyArrow serialization. Unifying all roles to `list[dict]` resolved this.

```python
{"role": "user", "content": [
    {"type": "image", "image": wound_image},   # image FIRST
    {"type": "text",  "text": SYSTEM_PROMPT},  # text after
]}
```

**Training signal without clinical labels:**  
The dataset provided only binary DFU/healthy labels — no infection or ischemia annotations. Label generation was grounded in clinical literature (IWGDF PEDIS classification; Lavery et al., AAFP 2021; Zhang et al., Frontiers in Endocrinology 2025): infection probability 35% for wounds <2 cm², 65% for 2–4 cm², 90% for >4 cm².

**Training config:** `r=16`, `lora_alpha=16`, 3 epochs, `lr=2e-4`, cosine scheduler, batch 2 + grad_accum 4 (effective batch 8)

---

## Risk Scoring

**Single-scan risk level:**

| Condition | Risk |
|-----------|------|
| Infection + Ischemia co-present | HIGH |
| Severity ≥ 7 | HIGH |
| Infection or Ischemia with severity ≥ 5 | HIGH |
| Severity ≥ 4, or any infection/ischemia | MEDIUM |
| Otherwise | LOW |

**Time-series composite score (0–100):**

| Factor | Weight |
|--------|--------|
| Week-over-week area change rate | 40 pts |
| Current infection status | 35 pts |
| Current ischemia status | 25 pts |

Score ≥ 70 → HIGH alert with immediate action checklist  
Score 40–69 → MEDIUM  
Score < 40 → LOW

---

## Running Locally with Ollama

```bash
# 1. Pull the fine-tuned model
ollama run hf.co/5seoyoung/woundwatch-gemma4-dfu:Q4_K_M

# 2. Run backend
git clone https://github.com/5seoyoung/woundwatch
cd woundwatch/backend
pip install -r requirements.txt
USE_OLLAMA=true uvicorn app.main:app --reload

# 3. Run frontend
cd ../frontend
npm install && npm run dev
```

No GPU required. Falls back to demo mode automatically if Ollama is unavailable.

---

## Running with HuggingFace Model

```python
from unsloth import FastVisionModel

model, processor = FastVisionModel.from_pretrained(
    "5seoyoung/woundwatch-gemma4-dfu",
    load_in_4bit=True,
)
FastVisionModel.for_inference(model)
```

Set `USE_OLLAMA=false` and `HF_MODEL_REPO=5seoyoung/woundwatch-gemma4-dfu` in `backend/.env`.

---

## References

- Armstrong DG et al. *Diabetic Foot Ulcers and Their Recurrence.* JAMA, 2023.
- Monteiro-Soares M et al. *IWGDF Guidelines on Diabetic Foot.* 2020.
- Lavery LA et al. *Diabetic Foot Ulcer Classification.* AAFP, 2021.
- Zhang Y et al. *Ulcer area as predictor of MDR infection.* Frontiers in Endocrinology, 2025.

---

## License

CC-BY 4.0
