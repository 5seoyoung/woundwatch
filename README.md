# WoundWatch 🩺

**Diabetic Foot Ulcer Time-Series Tracking + Amputation Risk Early Warning**

WoundWatch uses **Gemma 4 multimodal AI** to analyze weekly foot photos, track wound progression over time, and alert patients and clinicians before amputation risk becomes critical.

> Built for the [Kaggle Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) — targeting **Health & Sciences**, **Unsloth**, and **Ollama** tracks.

---

## Live Demo

| | |
|---|---|
| **Web App** | https://5seoyoung.github.io/woundwatch |
| **Backend API** | https://huggingface.co/spaces/5seoyoung/woundwatch |
| **Fine-tuned Model** | https://huggingface.co/5seoyoung/woundwatch-gemma4-dfu |

> No sign-up required — click **Try Demo** on the web app to explore with sample patient data.

---

## What It Does

1. **Upload or photograph** a diabetic foot wound (JPG / PNG / HEIC)
2. **Gemma 4** analyzes infection status, ischemia signs, severity (0–10), and generates a clinical description
3. **OpenCV** estimates wound area in cm² via HSV color masking
4. **Risk engine** computes a single-scan risk level and a time-series composite score (0–100)
5. **Weekly comparison** shows whether the wound is healing or deteriorating
6. **Action checklist** gives risk-level-specific next steps (HIGH → call clinic today, MEDIUM → photo daily, LOW → continue routine)

---

## Architecture

```
[Mobile Browser]
      │  photo upload
      ▼
[React Frontend]          → GitHub Pages
  Onboarding / Home / Scan / Progress / Profile
      │  POST /api/analyze
      ▼
[FastAPI Backend]         → Hugging Face Spaces (Docker)
  ├── AI inference:  Gemma 4 via Ollama  ←──┐  local / offline
  │                  Gemma 4 via HF Hub  ←──┤  cloud GPU
  │                  brightness heuristic ←──┘  demo fallback
  ├── OpenCV area estimation (HSV masking)
  └── SQLite time-series records
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemma 4 E2B (multimodal), fine-tuned on DFU images |
| Fine-tuning | [Unsloth](https://github.com/unslothai/unsloth) + QLoRA (4-bit) on Kaggle T4 x2 |
| Local Inference | [Ollama](https://ollama.com) + GGUF Q4_K_M |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Frontend | React 18 + Vite + custom SVG charts |
| Area Estimation | OpenCV HSV contour detection |
| Deployment | GitHub Pages (frontend) + HF Spaces Docker (backend) |

---

## Project Structure

```
woundwatch/
├── backend/                      # FastAPI backend (Docker → HF Spaces)
│   ├── app/
│   │   ├── api/                  # /analyze, /history, /patients, /risk
│   │   ├── core/                 # config, database (SQLAlchemy)
│   │   ├── models/               # Pydantic schemas
│   │   └── services/
│   │       ├── ai_service.py     # Gemma 4 inference (Ollama / HF / Demo)
│   │       ├── area_calculator.py# OpenCV wound area estimation
│   │       └── risk_engine.py    # single-scan + time-series risk scoring
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                     # React SPA (→ GitHub Pages)
│   └── src/
│       ├── components/           # TossEmoji, WoundChart, AnalysisResult, ...
│       ├── pages/                # Onboarding, Home, Dashboard, History, Profile
│       └── hooks/usePatient.js   # patient state + localStorage
├── notebooks/
│   └── 02_finetune_gemma4_unsloth.ipynb  # Unsloth fine-tuning (Kaggle T4 x2)
└── DEVELOPMENT_LOG.md            # Full technical development log (Korean)
```

---

## Gemma 4 Fine-tuning (Unsloth Track)

Fine-tuned `unsloth/gemma-4-E2B-it` on 1,560 DFU images using QLoRA (r=16, 4-bit) for 3 epochs on Kaggle GPU T4 x2.

**Training datasets:**
- [`laithjj/diabetic-foot-ulcer-dfu`](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu) — 1,835 labeled wound images
- [`leoscode/wound-segmentation-images`](https://www.kaggle.com/datasets/leoscode/wound-segmentation-images) — segmentation masks for area ratio

**Conversation format** (Gemma 4 multimodal — image token must precede text):
```python
[
  {"role": "system",    "content": [{"type": "text", "text": SYSTEM_PROMPT}]},
  {"role": "user",      "content": [
      {"type": "image", "image": "file:///path/to/wound.jpg"},
      {"type": "text",  "text": "Analyze this diabetic foot image..."}
  ]},
  {"role": "assistant", "content": [{"type": "text", "text": '{"infection":true,...}'}]},
]
```

All `content` fields use `list[dict]` — required for consistent PyArrow serialization in `Dataset.from_list()`.

**Training config:** `r=16`, `lora_alpha=16`, 3 epochs, `lr=2e-4`, cosine scheduler, batch 2 + grad_accum 4

---

## Running Locally with Ollama (Ollama Track)

```bash
# 1. Pull the fine-tuned model
ollama run hf.co/5seoyoung/woundwatch-gemma4-dfu:Q4_K_M

# 2. Clone and run backend
git clone https://github.com/5seoyoung/woundwatch
cd woundwatch/backend
pip install -r requirements.txt
USE_OLLAMA=true uvicorn app.main:app --reload

# 3. Run frontend
cd ../frontend
npm install && npm run dev
```

No GPU required. Falls back to demo mode automatically when Ollama is unavailable.

---

## Running with HuggingFace Model (GPU)

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

## Risk Scoring

**Single-scan risk level:**

| Condition | Risk Level |
|-----------|-----------|
| Infection + Ischemia both present | 🔴 HIGH |
| Severity ≥ 7 | 🔴 HIGH |
| Infection or Ischemia (one present) | 🟡 MEDIUM |
| Severity ≥ 4 | 🟡 MEDIUM |
| Otherwise | 🟢 LOW |

**Time-series composite score (0–100):**

| Factor | Weight |
|--------|--------|
| Week-over-week area growth rate | 40 pts |
| Current infection status | 35 pts |
| Current ischemia status | 25 pts |

---

## License

CC-BY 4.0
