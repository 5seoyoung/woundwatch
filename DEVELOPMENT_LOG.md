# WoundWatch 개발 전체 정리

> Kaggle Gemma 4 Good Hackathon 제출작 개발 로그  
> 마감: 2026-05-18 | 트랙: Gemma API · Unsloth · Ollama

---

## 1. 프로젝트 개요

### 문제 정의

당뇨발 궤양(Diabetic Foot Ulcer, DFU)은 당뇨 환자의 15~25%에서 발생하며, 당뇨 관련 절단의 85%를 차지하는 치명적 합병증이다. 대부분의 환자는 주 1회 병원 방문이 경제적·물리적으로 불가능하기 때문에, 병변이 악화되어도 수주간 방치되는 경우가 많다. WoundWatch는 스마트폰 사진 한 장으로 전문의 수준의 임상 평가를 수행하여, 환자가 집에서 주간 모니터링을 할 수 있도록 한다.

### 핵심 가치

- **조기 경보**: 감염/허혈 징후를 AI가 분석해 HIGH 위험 시 즉각 행동 가이드 제공
- **시계열 추적**: 주차별 상처 면적, 위험도, 감염 여부 변화를 시각화
- **프라이버시 보호**: Ollama 기반 로컬 추론으로 사진이 기기 밖으로 나가지 않음
- **오프라인 동작**: GPU 없이도 demo 모드로 즉시 실행 가능

### 대회 트랙

| 트랙 | 구현 내용 |
|------|-----------|
| Gemma API | Gemma 4 E2B 멀티모달 모델로 감염·허혈·중증도 분류 |
| Unsloth | QLoRA 4-bit 파인튜닝 (T4 x2 GPU, Kaggle Notebook) |
| Ollama | GGUF 변환 후 `ollama run hf.co/5seoyoung/woundwatch-gemma4-dfu:Q4_K_M` |

---

## 2. 시스템 아키텍처

```
[모바일 브라우저]
      │  사진 업로드
      ▼
[Frontend - React]              GitHub Pages
  Onboarding / Home / Scan / Progress / Profile
      │  POST /api/analyze
      ▼
[Backend - FastAPI]             HuggingFace Spaces (Docker)
  ├── /api/analyze     이미지 수신 → AI 추론 → DB 저장
  ├── /api/history     환자 기록 조회
  ├── /api/patients    환자 등록/조회
  └── /api/risk        시계열 복합 위험도 계산
      │
      ├── [AI 추론 경로 1] USE_OLLAMA=true
      │       Ollama (로컬) ← GGUF 모델
      │
      ├── [AI 추론 경로 2] USE_OLLAMA=false
      │       unsloth.FastVisionModel ← HF Hub
      │
      └── [AI 추론 경로 3] Demo fallback
              이미지 밝기 기반 휴리스틱
      │
      ├── OpenCV 면적 추정 (HSV 마스킹)
      └── SQLite (시계열 WoundRecord 저장)
```

### 배포 URL

| 구성 요소 | URL |
|-----------|-----|
| 프론트엔드 | https://5seoyoung.github.io/woundwatch |
| 백엔드 API | https://huggingface.co/spaces/5seoyoung/woundwatch |
| 파인튜닝 모델 | https://huggingface.co/5seoyoung/woundwatch-gemma4-dfu |
| 소스코드 | https://github.com/5seoyoung/woundwatch |

---

## 3. 기술 스택

| 레이어 | 기술 | 선택 이유 |
|--------|------|-----------|
| AI 모델 | Gemma 4 E2B (멀티모달) | 이미지+텍스트 동시 처리, 경량 |
| 파인튜닝 | Unsloth + QLoRA 4-bit | 메모리 효율, T4 GPU 2장에서 동작 |
| 로컬 추론 | Ollama + GGUF Q4_K_M | GPU 없이 CPU 추론 가능 |
| 백엔드 | FastAPI (Python 3.11) | 비동기 처리, Pydantic 스키마 |
| 프론트엔드 | React 18 + Vite | SPA, 모바일 최적화 |
| 차트 | SVG 커스텀 (Recharts 미사용) | 디자인 자유도, 번들 크기 절감 |
| DB | SQLite + SQLAlchemy | 파일 기반, 배포 간편 |
| 면적 추정 | OpenCV (HSV 마스킹) | 별도 모델 없이 실시간 처리 |
| 배포 | GitHub Pages + HF Spaces | 무료, 즉시 공개 |

---

## 4. 백엔드 개발

### 4-1. 프로젝트 구조

```
backend/
├── Dockerfile
├── requirements.txt
└── app/
    ├── main.py              FastAPI 앱, CORS, 라우터 등록
    ├── core/
    │   ├── config.py        pydantic-settings 환경변수
    │   └── database.py      SQLAlchemy 모델, init_db
    ├── models/
    │   └── schemas.py       Pydantic 요청/응답 스키마
    ├── api/
    │   ├── analyze.py       POST /api/analyze
    │   ├── history.py       GET  /api/history
    │   ├── patients.py      POST/GET /api/patients
    │   └── risk.py          GET  /api/risk
    └── services/
        ├── ai_service.py    Gemma 4 추론 (Ollama / HF / Demo)
        ├── area_calculator.py  OpenCV 면적 추정
        └── risk_engine.py   단일/시계열 위험도 계산
```

### 4-2. 데이터베이스 모델

**Patient** 테이블:
- `id` (UUID), `name`, `diabetes_type` (Type 1/2/Gestational/Other), `created_at`

**WoundRecord** 테이블:
- `id` (Integer PK), `patient_id`, `image_path`
- `date` (표시용 문자열, e.g. "Apr 17")
- `infection` (bool), `ischemia` (bool)
- `severity` (0.0–10.0 float)
- `wound_area_cm2` (nullable float)
- `risk_level` (LOW/MEDIUM/HIGH)
- `description` (Gemma 4 생성 임상 설명)
- `created_at` (UTC)

### 4-3. AI 추론 서비스 (ai_service.py)

세 가지 추론 경로를 순서대로 시도:

```python
def analyze_image(image):
    if settings.use_ollama:
        try:    return _analyze_ollama(image)   # Ollama GGUF
        except: return _analyze_demo(image)     # 폴백
    else:
        try:    return _analyze_hf(image)       # unsloth 직접 로드
        except: return _analyze_demo(image)     # 폴백
```

**Ollama 경로**: `ollama.chat()` — 이미지를 bytes로 전달, Gemma 4 멀티모달 스펙에 따라 이미지가 텍스트보다 앞에 위치해야 함

**HF 경로**: `unsloth.FastVisionModel.from_pretrained()` — 4-bit 로드, GPU/CPU 자동 선택

**Demo 폴백**: 이미지 평균 밝기(grayscale mean)를 역산해 severity 추정. GPU/Ollama 없이도 API가 동작하도록 보장

**JSON 파서**: Gemma 출력에서 정규식으로 `{}` 블록 추출 → `json.loads()` → 필드 검증. 파싱 실패 시 safe default 반환 (API 크래시 방지)

### 4-4. 위험도 계산 엔진 (risk_engine.py)

**단일 스캔 위험도** (`compute_risk_level`):

| 조건 | 위험도 |
|------|--------|
| 감염 + 허혈 동시 | HIGH |
| severity ≥ 7 | HIGH |
| 감염/허혈 + severity ≥ 5 | HIGH |
| severity ≥ 4 또는 감염/허혈 하나 | MEDIUM |
| 나머지 | LOW |

**시계열 복합 위험 점수** (`calculate_risk_score`):

| 항목 | 가중치 |
|------|--------|
| 면적 변화율 (주간 증감%) | 40점 |
| 감염 상태 | 35점 |
| 허혈 상태 | 25점 |

총점 0–100: 40 미만 LOW, 40–69 MEDIUM, 70 이상 HIGH  
추가 출력: `severity_trend` (improving/stable/worsening, 최근 3회 기준)

### 4-5. OpenCV 면적 추정 (area_calculator.py)

HSV 색공간에서 두 가지 마스크를 합산:
- **붉은 영역** (감염/개방 상처): H 0–10°, 165–180°
- **어두운 영역** (괴사/eschar): V 0–60

모폴로지 처리(close → open, 7×7 커널)로 노이즈 제거 후, 상처 픽셀 비율을 발 전체 면적(9cm × 20cm = 180cm²)으로 환산. Gemma 4가 면적을 반환하지 않는 경우 폴백으로 사용.

### 4-6. CORS 설정

`allow_origins=["*"]` — 개발 편의상 전체 허용. 프로덕션에서는 GitHub Pages 도메인으로 제한 필요.

---

## 5. 프론트엔드 개발

### 5-1. 프로젝트 구조

```
frontend/src/
├── App.jsx              라우터, NavBar, DemoBanner
├── lib/
│   └── api.js           axios 인스턴스 (VITE_API_URL 기반)
├── hooks/
│   └── usePatient.js    환자 상태 관리 (localStorage)
├── pages/
│   ├── Onboarding.jsx   최초 진입 (데모 모드 or 환자 등록)
│   ├── Home.jsx         홈 대시보드 (위험도 게이지, 기록 목록)
│   ├── Dashboard.jsx    새 스캔 (업로드/카메라, AI 분석)
│   ├── History.jsx      시계열 그래프 + 주간 비교
│   ├── Profile.jsx      환자 정보, 리셋
│   └── Local.jsx        Ollama 로컬 추론 가이드
└── components/
    ├── TossEmoji.jsx    Tossface CDN → Twemoji → 텍스트 폴백 체인
    ├── UploadZone.jsx   드래그&드롭 / 파일 선택
    ├── CameraCapture.jsx  브라우저 카메라 (MediaDevices API)
    ├── AnalysisResult.jsx  분석 결과 카드 + NextSteps 체크리스트
    ├── WoundChart.jsx   SVG 시계열 차트 (이벤트 마커 포함)
    └── RiskBadge.jsx    위험도 뱃지 (HIGH/MEDIUM/LOW 색상)
```

### 5-2. 온보딩 플로우 (Onboarding.jsx)

두 가지 진입 경로:
1. **데모 모드**: 미리 정의된 Alex Henderson 환자 데이터 (3주간 LOW→MEDIUM→HIGH 진행) 즉시 로드
2. **환자 등록**: 이름 + 당뇨 타입 입력 → `POST /api/patients` → localStorage 저장

환자 데이터는 `localStorage`에 JSON으로 저장되며, `is_demo` 플래그로 구분. 앱 재진입 시 자동 복원 (구형 스키마는 자동 초기화).

### 5-3. 홈 (Home.jsx)

- **RiskGauge**: SVG 원형 게이지, 복합 위험 점수(0–100) 표시. 애니메이션 포함 (cubic-bezier spring)
- **MetricPill**: 최근 스캔의 severity, 면적, 감염/허혈 여부 요약 표시
- **ScanRow**: 스캔 기록 목록 (주차별 미니 막대 스파크차트 포함)
- 데모 모드: DEMO_RECORDS 3개 즉시 표시
- 실제 모드: `GET /api/history?patient_id=...` → `GET /api/risk` 결과 표시

### 5-4. 새 스캔 (Dashboard.jsx)

**주요 UX 구현:**

1. **모드 전환**: Upload / Camera 탭. Camera 선택 시 3초 가이드 오버레이 후 카메라 실행
2. **촬영 가이드 토글**: "정확한 촬영 방법" 접기/펼치기 (Good/Bad 항목 안내)
3. **AI 로딩 단계 (6단계)**:
   - 📸 이미지 전처리 중... → 🔍 궤양 영역 감지 중... → 🧠 Gemma 4 AI 분석 중...
   - → 🦠 감염 징후 확인 중... → 🩸 혈류 상태 분석 중... → 📊 위험도 점수 계산 중...
   - 1.5초 간격 자동 전환, 점 인디케이터(현재 위치 강조)
4. **파일 타입 검증**: JPG/PNG/HEIC/WEBP만 허용
5. **모든 버튼 minHeight: 44px** (모바일 터치 영역 기준)
6. **API 실패 폴백**: SAMPLE_RESULT + "[Demo mode — connect backend]" 메시지
7. **HIGH 위험 CTA**: "Book a Clinic Visit Now" 버튼 (red, shadow)

**분석 플로우:**
```
파일 선택 → FormData(file, patient_id) → POST /api/analyze
→ AI 추론 (Gemma 4 or Demo) → risk_engine → DB 저장 → AnalysisResult 렌더
```

### 5-5. 분석 결과 (AnalysisResult.jsx)

- **Score Ring**: severity × 10 = 0–100점, 색상 코딩
- **MetricCard 4개**: 감염 여부, 허혈 여부, severity, 면적(cm²)
- **Gemma 설명문**: 임상 서술 텍스트
- **NextSteps 체크리스트**: 위험도별 맞춤 행동 항목 (클릭하면 체크 + 취소선)
  - HIGH: 즉시 클리닉 연락, 체중 금지, 거즈 처치
  - MEDIUM: 이번 주 내 의사 연락, 매일 촬영
  - LOW: 다음 주 재촬영, 발 세척/보습

### 5-6. 시계열 추적 (History.jsx)

- **WeeklyDelta**: 이번 주 vs 지난 주 비교 카드
  - 궤양 면적, 위험도, 감염, 허혈 항목별 화살표+색상 변화 표시
  - 악화 → 빨강(▲), 개선 → 초록(▼), 유지 → 회색(→)
  - 첫 번째 기록이면 "다음 주 촬영하면 변화 추이를 확인할 수 있어요" 안내
- **WoundChart (SVG)**: 커스텀 라인+에어리어 차트
  - 그라디언트 fill, 데이터 포인트 dot
  - 이벤트 마커 링: 첫 기록(회색 점선 링), 신규 감염/HIGH 전환(빨간 점선 링)
- **날짜별 기록 카드**: 각 스캔마다 RiskBadge + 주요 수치 표시
  - 이벤트 이모지 마커: 📍 첫 기록, 🔴 HIGH, ⚠️ 신규 감염

### 5-7. TossEmoji 컴포넌트

모든 이모지는 `<TossEmoji emoji="..." size={n} />` 사용. 렌더링 우선순위:
1. Tossface CDN (`static.toss.im/tossface/...`)
2. Twemoji 폴백
3. 텍스트 문자 폴백

raw 이모지 텍스트 사용 금지 (플랫폼별 렌더링 불일치 방지).

### 5-8. 환경변수 및 API 설정

```
frontend/.env.production
VITE_API_URL=https://5seoyoung-woundwatch.hf.space
```

`src/lib/api.js`: axios 인스턴스, baseURL = `VITE_API_URL || ''`. 개발 시 Vite proxy(`/api` → `localhost:8000`), 프로덕션 시 HF Spaces 직접 호출.

---

## 6. Gemma 4 파인튜닝 (Unsloth)

### 6-1. 노트북 파일

`notebooks/02_finetune_gemma4_unsloth.ipynb` — Kaggle에서 실행 (GPU T4 x2)

### 6-2. 학습 데이터셋

| 데이터셋 | 내용 | 샘플 수 |
|----------|------|--------|
| `laithjj/diabetic-foot-ulcer-dfu` | DFU/정상 이진 분류 이미지 | 1,835장 |
| `leoscode/wound-segmentation-images` | 상처 세그멘테이션 마스크 | 면적 비율 추출용 |

최종 학습 샘플: **1,560개** (ulcer/healthy 균형 샘플링)

### 6-3. 데이터 전처리 (make_conversation)

Gemma 4 멀티모달 대화 포맷으로 변환. **핵심 제약**: PyArrow `Dataset.from_list()` 직렬화 시 `content` 필드는 모든 메시지에서 동일한 타입이어야 함 → 전부 `list[dict]`로 통일:

```python
[
  {"role": "system",    "content": [{"type": "text", "text": SYSTEM_PROMPT}]},
  {"role": "user",      "content": [
      {"type": "image", "image": f"file://{abs_path}"},
      {"type": "text",  "text": USER_PROMPT}
  ]},
  {"role": "assistant", "content": [{"type": "text", "text": build_json_response(...)}]},
]
```

### 6-4. JSON 응답 생성 (build_json_response)

학습 레이블로 사용하는 구조화된 JSON:
```json
{
  "infection": true/false,
  "ischemia": true/false,
  "severity": 0.0–10.0,
  "wound_area_cm2": float,
  "description": "임상 서술",
  "confidence": 0.0–1.0
}
```

면적 비율에 따라 severity 범위 자동 결정:
- < 2%: severity 2–4 (소형), 감염 확률 35%
- 2–5%: severity 4–6.5 (중형), 감염 확률 65%, 허혈 30%
- ≥ 5%: severity 6.5–9.5 (대형), 감염 확률 90%, 허혈 70%

### 6-5. 모델 설정

```python
MODEL_ID = "unsloth/gemma-4-E2B-it"   # 5B 파라미터 멀티모달
model, tokenizer = FastVisionModel.from_pretrained(
    MODEL_ID, load_in_4bit=True, max_seq_length=2048
)
model = FastVisionModel.get_peft_model(
    model, r=16, lora_alpha=16,
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
)
```

학습 가능 파라미터: **전체의 0.58%** (LoRA 어댑터만 학습)

### 6-6. 학습 설정

```python
trainer = SFTTrainer(
    max_seq_length=2048,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,   # 실질 배치 8
    num_train_epochs=3,
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_steps=10,
    fp16=True,
)
```

### 6-7. 저장 및 변환

1. **LoRA 저장**: `/tmp/woundwatch-lora` (Kaggle `/kaggle/working`은 20GB 제한으로 부족)
2. **체크포인트 삭제**: `shutil.rmtree` 후 저장
3. **GGUF 변환**: `os.chdir("/tmp")` 후 llama.cpp 변환 실행
   - Q4_K_M (양자화 모델): `woundwatch-lora_gguf/woundwatch-gemma4-Q4_K_M.gguf`
   - F16-mmproj (비전 프로젝터): `woundwatch-lora_gguf/woundwatch-gemma4-F16-mmproj.gguf`
4. **Modelfile 생성**: SYSTEM_PROMPT 포함
5. **HF 업로드**: `HfApi.upload_file()` 직접 업로드 (파일 4개)

### 6-8. Ollama 사용법

```bash
ollama run hf.co/5seoyoung/woundwatch-gemma4-dfu:Q4_K_M
```

---

## 7. 개발 중 발생한 주요 에러 및 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `ArrowInvalid: cannot mix list and non-list` | `content` 필드가 일부는 `str`, 일부는 `list[dict]` | 모든 role의 `content`를 `list[dict]`로 통일 |
| `TypeError: 'NoneType' is not subscriptable` | PyArrow가 누락 키를 `None`으로 채움; `.get("text", default)`가 `None` 반환 | `(first.get("text") or first.get("image") or "")[:60]`로 변경 |
| `RuntimeError: No config file found` | `unsloth/gemma-4-4b-it` 모델 ID 오류 | 실제 ID: `unsloth/gemma-4-E2B-it` (5B) / `unsloth/gemma-4-E4B-it` (8B) |
| `TypeError: string indices must be integers` | 추론 시 system content가 여전히 `str` | `[{"type":"text","text":SYSTEM_PROMPT}]`로 변경 |
| `SafetensorError: No space left on device` | `/kaggle/working` 20GB 초과 (체크포인트 누적) | 체크포인트 `shutil.rmtree` 후 `/tmp`에 저장 |
| GGUF 변환 실패 | `--outfile`이 CWD 기준 상대경로 → `/kaggle/working` 디스크 풀 | `os.chdir("/tmp")` 후 변환 |
| `push_to_hub_gguf` 실패 | 재변환 시도 + `_gguf` suffix 자동 추가로 경로 불일치 | `HfApi.upload_file()`로 이미 변환된 파일 직접 업로드 |

---

## 8. 배포

### 프론트엔드 (GitHub Pages)

```bash
cd frontend
npm run deploy   # vite build → gh-pages -d dist
```

- `vite.config.js`: `base: '/woundwatch/'`
- `package.json`: `homepage: "https://5seoyoung.github.io/woundwatch"`

### 백엔드 (HuggingFace Spaces)

Docker Space — `backend/README.md`에 Space 메타데이터 포함:
```yaml
---
title: WoundWatch API
sdk: docker
app_port: 7860
---
```

업로드:
```python
from huggingface_hub import HfApi
api = HfApi()
api.upload_folder(
    folder_path='backend',
    repo_id='5seoyoung/woundwatch',
    repo_type='space',
    ignore_patterns=['venv/', '__pycache__/', '*.db', 'uploads/'],
)
```

### 환경변수 (HF Space Secrets)

HF Spaces 설정에서 추가 필요:
- `USE_OLLAMA=false` (HF Space는 Ollama 없음, HF 모델 직접 로드)
- `HF_MODEL_REPO=5seoyoung/woundwatch-gemma4-dfu`

---

## 9. 모델 성능 및 한계

### 파인튜닝이 실제로 가르친 것

Gemma 4의 베이스 멀티모달 능력은 그대로 유지하면서, **출력 포맷(JSON)**과 **도메인 용어(DFU 특화)**를 학습시킴. 즉:
- `infection`, `ischemia`, `severity`, `wound_area_cm2`, `confidence` 필드를 항상 올바른 타입으로 출력
- 당뇨발 궤양 맥락의 임상 서술 생성

### 한계

- 학습 데이터의 감염/허혈 레이블은 **규칙 기반 생성** (실제 임상가 판독 없음)
- confidence score는 학습 목적이므로 실제 불확실성을 반영하지 않음
- 실제 임상 배포 전 의료기기 검증 필요

### 프로젝트의 실제 가치

세 트랙을 통합한 **엔드투엔드 애플리케이션**이 핵심:
1. 환자가 집에서 사진을 찍으면 → Gemma 4가 분석하고 → 주간 추이를 추적해 → 위험도가 올라가면 즉각 행동 지침 제공
2. 오프라인 동작 (Ollama) + 클라우드 배포 + 파인튜닝 모델 세 가지를 모두 구현한 완성도

---

## 10. 남은 작업 (마감 2026-05-18)

- [ ] YouTube 데모 영상 (3분)
- [ ] Kaggle 제출 writeup (1,500자)
- [ ] Kaggle 커버 이미지
- [ ] HF Spaces 빌드 완료 확인 + API 연결 테스트
- [ ] HF Spaces Secrets 설정 (`USE_OLLAMA`, `HF_MODEL_REPO`)
