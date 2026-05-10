---
language:
- en
license: apache-2.0
tags:
- gemma4
- unsloth
- medical
- diabetic-foot-ulcer
- wound-assessment
- multimodal
- gguf
- ollama
base_model: unsloth/gemma-4-e2b-it-unsloth-bnb-4bit
datasets:
- laithjj/diabetic-foot-ulcer-dfu
pipeline_tag: image-text-to-text
---

# WoundWatch — Gemma 4 DFU Assessment Model

Fine-tuned **Gemma 4 E2B** multimodal model for diabetic foot ulcer (DFU) clinical assessment. Given a wound photo, the model returns a structured JSON with infection status, ischemia signs, severity score, wound area estimate, and a clinical description.

Built for the **[Kaggle Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon)** as part of the [WoundWatch](https://github.com/5seoyoung/woundwatch) application.

---

## Model Details

| | |
|---|---|
| **Base model** | `unsloth/gemma-4-e2b-it` (5B parameters) |
| **Fine-tuning method** | QLoRA (r=16, 4-bit quantization) via [Unsloth](https://github.com/unslothai/unsloth) |
| **Training hardware** | Kaggle T4 x2 GPU |
| **Training data** | 1,560 DFU images ([laithjj/diabetic-foot-ulcer-dfu](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu)) |
| **Epochs** | 3 |
| **Trainable parameters** | 0.58% (LoRA adapter only) |

---

## Files

| File | Description |
|------|-------------|
| `woundwatch-gemma4-Q4_K_M.gguf` | Quantized model (3.43 GB) — use with Ollama |
| `woundwatch-gemma4-F16-mmproj.gguf` | Vision projector (F16) — required for multimodal |
| `Modelfile` | Ollama Modelfile with system prompt |

---

## Quick Start with Ollama

```bash
ollama run hf.co/5seoyoung/woundwatch-gemma4-dfu:Q4_K_M
```

No GPU required. Runs on CPU with ~3.5 GB RAM.

---

## Quick Start with Python (GPU)

```python
from unsloth import FastVisionModel
from PIL import Image

model, processor = FastVisionModel.from_pretrained(
    "5seoyoung/woundwatch-gemma4-dfu",
    load_in_4bit=True,
)
FastVisionModel.for_inference(model)

image = Image.open("wound.jpg")

messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text",  "text": "Analyze this diabetic foot image and return a JSON assessment."},
        ],
    }
]

inputs = processor.apply_chat_template(
    messages,
    add_generation_prompt=True,
    tokenize=True,
    return_dict=True,
    return_tensors="pt",
).to(model.device)

outputs = model.generate(**inputs, max_new_tokens=400, do_sample=False)
print(processor.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))
```

---

## Output Format

The model always returns a JSON object:

```json
{
  "infection": true,
  "ischemia": false,
  "severity": 6.5,
  "wound_area_cm2": 3.2,
  "description": "Moderate diabetic foot ulcer with perilesional erythema suggesting early bacterial colonization. Wound bed shows partial granulation. Severity assessed at 6.5/10.",
  "confidence": 0.81
}
```

| Field | Type | Description |
|-------|------|-------------|
| `infection` | bool | Signs of bacterial infection (erythema, exudate, necrosis) |
| `ischemia` | bool | Signs of compromised blood flow (pallor, dry wound bed) |
| `severity` | float 0–10 | 0 = minimal/healing, 10 = critical/limb-threatening |
| `wound_area_cm2` | float | Estimated wound area (adult foot ≈ 180 cm²) |
| `description` | string | One-paragraph clinical description in English |
| `confidence` | float 0–1 | Model confidence in the assessment |

---

## System Prompt

```
You are a clinical AI assistant specialized in diabetic foot ulcer assessment.
Analyze the wound image and respond ONLY with a valid JSON object. No explanation, no markdown, no code fences.

Assessment criteria:
- infection: Look for erythema, purulent discharge, warmth indicators, tissue necrosis, perilesional inflammation
- ischemia: Look for pallor, cyanosis, lack of granulation tissue, dry necrosis, pale wound bed
- severity: 0=minimal/healing, 5=moderate progression, 10=critical/limb-threatening
- wound_area_cm2: estimate based on proportion of visible foot area (average adult foot ~180 cm²)
- confidence: your confidence in the assessment (0=very uncertain, 1=highly confident)
```

---

## Training Details

**Dataset:** 1,560 DFU images from [`laithjj/diabetic-foot-ulcer-dfu`](https://www.kaggle.com/datasets/laithjj/diabetic-foot-ulcer-dfu) (ulcer / healthy binary labels). Wound area ratios from [`leoscode/wound-segmentation-images`](https://www.kaggle.com/datasets/leoscode/wound-segmentation-images) used to generate structured severity labels.

**Conversation format** (Gemma 4 multimodal — image must precede text):
```python
[
  {"role": "system",    "content": [{"type": "text",  "text": SYSTEM_PROMPT}]},
  {"role": "user",      "content": [{"type": "image", "image": "file:///wound.jpg"},
                                    {"type": "text",  "text": USER_PROMPT}]},
  {"role": "assistant", "content": [{"type": "text",  "text": '{"infection":true,...}'}]},
]
```

**LoRA config:** `r=16`, `lora_alpha=16`, targets all attention + MLP projection layers

**Training config:**
```
learning_rate:              2e-4
lr_scheduler:               cosine
warmup_steps:               10
per_device_train_batch_size: 2
gradient_accumulation_steps: 4  (effective batch: 8)
num_train_epochs:           3
precision:                  fp16
```

---

## Limitations

- Infection/ischemia labels in training data are **rule-based** (not verified by clinicians)
- Not validated for clinical use — for research and demonstration only
- Performance on non-DFU wound types is untested
- `confidence` field reflects training-time label, not calibrated uncertainty

---

## Citation

```bibtex
@misc{woundwatch2026,
  author    = {Seoyoung Oh},
  title     = {WoundWatch: AI-Powered Diabetic Foot Ulcer Tracking},
  year      = {2026},
  url       = {https://github.com/5seoyoung/woundwatch},
  note      = {Kaggle Gemma 4 Good Hackathon submission}
}
```

---

Made with [Unsloth](https://github.com/unslothai/unsloth) 🦥
