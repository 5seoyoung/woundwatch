# WoundWatch 🩺

**Diabetic Foot Ulcer Time-Series Tracking + Amputation Risk Early Warning**

WoundWatch uses **Gemma 4 multimodal AI** to analyze weekly foot photos, track wound progression over time, and alert patients and clinicians before amputation risk becomes critical.

> Built for the [Kaggle Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon) — targeting Health & Sciences, Unsloth, and Ollama tracks.

---

## Demo

**Live Demo:** [Hugging Face Spaces](#) *(coming soon)*
**YouTube Walkthrough:** [YouTube](#) *(coming soon)*

---

## What It Does

1. **Upload** a photo of a diabetic foot wound
2. **Gemma 4** analyzes infection status, ischemia signs, and severity (0–10)
3. **OpenCV** estimates wound area in cm²
4. **Time-series engine** tracks weekly changes and computes a composite risk score
5. **Alert system** flags HIGH-risk cases for immediate clinical attention

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemma 4 E4B (multimodal), fine-tuned on diabetic foot ulcer images |
| Fine-tuning | [Unsloth](https://github.com/unslothai/unsloth) + QLoRA (4-bit) |
| Local Inference | [Ollama](https://ollama.com) |
| Backend | FastAPI (Python) |
| Frontend | React + TailwindCSS + Recharts |
| Database | SQLite (time-series records) |
| Area Estimation | OpenCV contour detection |
| Deployment | Hugging Face Spaces |

---

## Project Structure

```
woundwatch/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # Route handlers (/analyze, /history)
│   │   ├── core/          # Config, database connection
│   │   ├── models/        # SQLAlchemy models + Pydantic schemas
│   │   └── services/      # AI inference, area estimation, risk engine
│   └── requirements.txt
├── frontend/              # React dashboard
│   └── src/
│       ├── components/    # Upload, WoundChart, RiskBadge, etc.
│       └── pages/         # Dashboard, PatientHistory
├── notebooks/             # Fine-tuning notebooks
│   └── 02_finetune_gemma4_unsloth.ipynb   # Kaggle notebook (Unsloth + T4 x2)
└── scripts/               # Data prep utilities
```

---

## Gemma 4 Implementation

Fine-tuned `unsloth/gemma-4-E4B-it` on publicly available diabetic foot ulcer image datasets using QLoRA (4-bit quantization) with Unsloth on Kaggle (GPU T4 x2).

**Training datasets (Kaggle):**
- [`laithjj/diabetic-foot-ulcer-dfu`](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu) — 1,835 labeled wound images (ulcer / healthy)
- [`leoscode/wound-segmentation-images`](https://www.kaggle.com/datasets/leoscode/wound-segmentation-images) — segmentation masks for area ratio estimation

**Fine-tuning task:** Binary wound presence detection with severity estimation from wound coverage area. Infection and ischemia classification leverage Gemma 4's base multimodal medical knowledge.

**Training config:** `r=16`, `lora_alpha=16`, 3 epochs, `lr=2e-4`, cosine scheduler, batch size 2 + 4 gradient accumulation steps.

**Prompt format** (image must come before text per Gemma 4 spec):
```json
{
  "role": "user",
  "content": [
    {"type": "image", "image": "<wound photo>"},
    {"type": "text", "text": "Analyze this diabetic foot image. Determine: (1) infection status — present or absent, (2) ischemia status — present or absent, (3) severity score 0-10, (4) brief clinical description."}
  ]
}
```

Fine-tuned model: [5seoyoung/woundwatch-gemma4-e4b](https://huggingface.co/5seoyoung/woundwatch-gemma4-e4b)

---

## Running Locally with Ollama

```bash
# 1. Install Ollama: https://ollama.com
ollama pull gemma4:E4B
ollama serve

# 2. Clone and run backend
git clone https://github.com/5seoyoung/woundwatch
cd woundwatch/backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Run frontend
cd ../frontend
npm install && npm run dev
```

No GPU required — falls back to demo mode automatically when Ollama or GPU is unavailable.

---

## Running with HuggingFace Model (GPU)

```python
from unsloth import FastVisionModel
from PIL import Image

model, processor = FastVisionModel.from_pretrained(
    "5seoyoung/woundwatch-gemma4-e4b",
    load_in_4bit=True,
)
FastVisionModel.for_inference(model)
```

Set `USE_OLLAMA=false` and `HF_MODEL_REPO=5seoyoung/woundwatch-gemma4-e4b` in `backend/.env`.

---

## Risk Scoring

| Condition | Risk Level |
|-----------|-----------|
| Infection + Ischemia both present | 🔴 HIGH |
| Severity ≥ 7 | 🔴 HIGH |
| Infection or Ischemia (one) | 🟡 MEDIUM |
| Severity ≥ 4 | 🟡 MEDIUM |
| Otherwise | 🟢 LOW |

---

## Dataset

Training used two Kaggle public datasets:
- [`laithjj/diabetic-foot-ulcer-dfu`](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu)
- [`leoscode/wound-segmentation-images`](https://www.kaggle.com/datasets/leoscode/wound-segmentation-images)

Datasets are not included in this repo. See the Kaggle links above.

---

## License

CC-BY 4.0
