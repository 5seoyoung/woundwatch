---
title: WoundWatch API
emoji: 🩹
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
app_port: 7860
---

# WoundWatch Backend API

FastAPI backend for **WoundWatch** — AI-powered diabetic foot ulcer tracking app.

- **Frontend:** https://5seoyoung.github.io/woundwatch
- **Model:** https://huggingface.co/5seoyoung/woundwatch-gemma4-dfu
- **Source:** https://github.com/5seoyoung/woundwatch

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Upload wound photo → AI analysis + DB save |
| `GET` | `/api/history` | Fetch patient scan records (time-series) |
| `POST` | `/api/patients` | Register new patient |
| `GET` | `/api/patients/{id}` | Get patient info |
| `GET` | `/api/risk` | Time-series composite risk score (0–100) |
| `GET` | `/api/health` | Health check |

### POST /api/analyze

```
Content-Type: multipart/form-data
file:        image (JPG / PNG / HEIC / WEBP, max 10MB)
patient_id:  string (default: "default")
```

Response:
```json
{
  "infection": true,
  "ischemia": false,
  "severity": 6.5,
  "wound_area_cm2": 3.2,
  "risk_level": "MEDIUM",
  "description": "Moderate diabetic foot ulcer with...",
  "date": "May 10"
}
```

---

## AI Inference

Three inference paths (tried in order):

1. **Ollama** (`USE_OLLAMA=true`) — local GGUF model via `ollama.chat()`
2. **HuggingFace** (`USE_OLLAMA=false`) — `unsloth.FastVisionModel` loaded from HF Hub
3. **Demo fallback** — image brightness heuristic when neither is available

This Space runs in **demo fallback mode** by default (no GPU). Set `HF_MODEL_REPO` secret and a GPU-enabled Space for real inference.

---

## Environment Variables (Secrets)

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_OLLAMA` | `false` | `true` = Ollama path |
| `HF_MODEL_REPO` | `5seoyoung/woundwatch-gemma4-dfu` | HF model repo ID |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `DATABASE_URL` | `sqlite:///./woundwatch.db` | SQLite path |
| `MAX_IMAGE_MB` | `10` | Upload size limit |

---

## Risk Scoring

Single-scan: `infection + ischemia + severity` → LOW / MEDIUM / HIGH

Time-series (0–100 pts):
- Area growth rate: 40 pts
- Infection status: 35 pts
- Ischemia status: 25 pts
