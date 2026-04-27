# WoundWatch 🩺

**Diabetic Foot Ulcer Time-Series Tracking + Amputation Risk Early Warning**

WoundWatch uses **Gemma 4 multimodal AI** to analyze weekly foot photos, track wound progression over time, and alert patients and clinicians before amputation risk becomes critical.

> Built for the [Kaggle Gemma 3 Worldwide Hackathon](https://www.kaggle.com/competitions/gemma-3-worldwide-hackathon) — targeting Health & Sciences, Unsloth, and Ollama tracks.

---

## Demo

**Live Demo:** [Hugging Face Spaces](#) *(coming Week 3)*
**YouTube Walkthrough:** [YouTube](#) *(coming Week 4)*

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
| AI Model | Gemma 4 E4B (multimodal), fine-tuned on DFUC 2021 |
| Fine-tuning | [Unsloth](https://github.com/unslothai/unsloth) + QLoRA |
| Local Inference | [Ollama](https://ollama.com) |
| Backend | FastAPI (Python) |
| Frontend | React + TailwindCSS |
| Database | SQLite (time-series records) |
| Area Estimation | OpenCV contour detection |
| Deployment | Hugging Face Spaces |

---

## Project Structure

```
woundwatch/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # Route handlers (/analyze, /history, /risk-score)
│   │   ├── core/          # Config, database connection
│   │   ├── models/        # SQLAlchemy models + Pydantic schemas
│   │   └── services/      # AI inference, area calc, risk engine
│   └── requirements.txt
├── frontend/              # React dashboard
│   └── src/
│       ├── components/    # Upload, Chart, RiskBadge, etc.
│       └── pages/         # Dashboard, PatientHistory
├── notebooks/             # Kaggle fine-tuning notebooks
│   ├── 01_data_preprocessing.ipynb
│   └── 02_finetune_gemma4_unsloth.ipynb
├── scripts/               # Data prep utilities
│   └── prepare_dfuc.py
├── data/                  # Dataset placeholder (not committed)
└── models/                # Model weights placeholder (not committed)
```

---

## Gemma 4 Implementation

Fine-tuned `unsloth/gemma-4-E4B-it` on the [DFUC 2021 dataset](https://dfu-challenge.github.io/) using QLoRA (4-bit quantization).

**Prompt format** (image must come before text):
```json
{
  "role": "user",
  "content": [
    {"type": "image", "image": "<wound photo>"},
    {"type": "text", "text": "Analyze this diabetic foot wound. Classify infection status, ischemia status, and severity score (0-10)."}
  ]
}
```

Fine-tuned model: [HuggingFace](#) *(uploading after training)*

---

## Running Locally with Ollama

```bash
# 1. Install Ollama: https://ollama.com
ollama pull gemma4:E4B
ollama serve

# 2. Clone and run backend
git clone https://github.com/your-username/woundwatch
cd woundwatch/backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Run frontend
cd ../frontend
npm install && npm run dev
```

---

## Dataset

- **DFUC 2021** (Diabetic Foot Ulcer Challenge) — wound images with infection/ischemia labels
- **DFUC 2020** — additional segmentation masks for area estimation

Dataset not included in this repo. Download from [dfu-challenge.github.io](https://dfu-challenge.github.io/).

---

## License

Apache 2.0
