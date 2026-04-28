"""
Kaggle 공개 DFU 데이터셋 → Gemma 4 파인튜닝용 chat format 변환

사용 데이터셋:
  1. laithjj/diabetic-foot-ulcer-dfu   — 이진 분류 (healthy / ulcer)
  2. leoscode/wound-segmentation-images — 세그멘테이션 마스크 (면적 계산용)

실행 전 데이터 배치:
  data/raw/dfu-binary/
    <class_folder_1>/  (healthy, normal, non_dfu 등)
    <class_folder_2>/  (ulcer, dfu, wound 등)
  data/raw/wound-segmentation/
    images/*.jpg
    masks/*.png

출력:
  data/processed/train.json
  data/processed/validation.json
"""

import json
import random
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

random.seed(42)

RAW_DFU_DIR  = Path("data/raw/dfu-binary")
RAW_SEG_DIR  = Path("data/raw/wound-segmentation")
OUT_DIR      = Path("data/processed")

VAL_RATIO    = 0.15

# 폴더 이름으로 라벨 판별
ULCER_KEYWORDS   = {"ulcer", "dfu", "wound", "positive", "diabetic"}
HEALTHY_KEYWORDS = {"healthy", "normal", "non_dfu", "negative", "control"}


# ── 공통 유틸 ─────────────────────────────────────────────────────────────────

def classify_folder(folder_name: str) -> str | None:
    name = folder_name.lower()
    if any(k in name for k in ULCER_KEYWORDS):
        return "ulcer"
    if any(k in name for k in HEALTHY_KEYWORDS):
        return "healthy"
    return None


def build_message(image_path: str, is_ulcer: bool, wound_area_ratio: float = 0.0) -> dict:
    if is_ulcer:
        severity = _area_to_severity(wound_area_ratio)
        assistant = (
            f"Diabetic foot ulcer detected. "
            f"Wound present with visible tissue damage. "
            f"Estimated wound coverage: {wound_area_ratio:.1%} of image area. "
            f"Severity: {severity}/10. "
            f"Recommend clinical evaluation{'immediately' if severity >= 7 else ' within 48 hours'}."
        )
    else:
        assistant = (
            "No wound detected. "
            "Foot skin appears intact without signs of ulceration. "
            "Severity: 0/10. "
            "Continue regular monitoring schedule."
        )

    return {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": str(Path(image_path).resolve())},
                    {
                        "type": "text",
                        "text": (
                            "Analyze this diabetic foot image. "
                            "Determine: (1) wound presence, "
                            "(2) wound coverage percentage, "
                            "(3) severity score 0–10, "
                            "(4) recommended action."
                        ),
                    },
                ],
            },
            {"role": "assistant", "content": assistant},
        ]
    }


def _area_to_severity(ratio: float) -> int:
    """마스크 면적 비율 → severity 점수 (0–10)"""
    if ratio == 0:
        return 5   # 마스크 없이 울서 폴더인 경우 중간값
    if ratio < 0.02:
        return 3
    if ratio < 0.05:
        return 5
    if ratio < 0.10:
        return 7
    return 9


def split_dataset(items: list, val_ratio: float) -> tuple[list, list]:
    random.shuffle(items)
    split = int(len(items) * (1 - val_ratio))
    return items[:split], items[split:]


# ── Dataset 1: laithjj/diabetic-foot-ulcer-dfu (폴더 기반 이진 분류) ────────

def load_dfu_binary() -> list[dict]:
    if not RAW_DFU_DIR.exists():
        print(f"[SKIP] {RAW_DFU_DIR} 없음")
        return []

    samples = []
    for folder in RAW_DFU_DIR.iterdir():
        if not folder.is_dir():
            continue
        label = classify_folder(folder.name)
        if label is None:
            print(f"  [경고] 폴더 '{folder.name}' 라벨 판별 불가 — 스킵")
            continue
        for img_path in folder.glob("*.jpg"):
            samples.append(build_message(str(img_path), is_ulcer=(label == "ulcer")))
        for img_path in folder.glob("*.png"):
            samples.append(build_message(str(img_path), is_ulcer=(label == "ulcer")))

    print(f"[dfu-binary] {len(samples)}개 샘플 로드")
    return samples


# ── Dataset 2: leoscode/wound-segmentation-images (마스크 기반) ──────────────

def compute_wound_ratio(mask_path: Path) -> float:
    """이진 마스크에서 상처 면적 비율 계산"""
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        return 0.0
    _, binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    wound_pixels = np.count_nonzero(binary)
    total_pixels = binary.size
    return wound_pixels / total_pixels


def load_wound_segmentation() -> list[dict]:
    if not RAW_SEG_DIR.exists():
        print(f"[SKIP] {RAW_SEG_DIR} 없음")
        return []

    image_dir = RAW_SEG_DIR / "images"
    mask_dir  = RAW_SEG_DIR / "masks"

    if not image_dir.exists():
        # 하위 폴더 구조가 다를 경우 자동 탐지
        image_dir = next((d for d in RAW_SEG_DIR.rglob("images") if d.is_dir()), None)
        mask_dir  = next((d for d in RAW_SEG_DIR.rglob("masks")  if d.is_dir()), None)

    if not image_dir or not mask_dir:
        print(f"  [경고] images/ 또는 masks/ 폴더를 찾을 수 없음")
        return []

    samples = []
    missing_masks = 0

    for img_path in sorted(image_dir.glob("*.jpg")):
        stem = img_path.stem
        mask_path = mask_dir / f"{stem}.png"
        if not mask_path.exists():
            mask_path = mask_dir / f"{stem}.jpg"
        if not mask_path.exists():
            missing_masks += 1
            # 마스크 없으면 울서로 취급, 면적 불명
            samples.append(build_message(str(img_path), is_ulcer=True, wound_area_ratio=0.0))
            continue

        ratio = compute_wound_ratio(mask_path)
        is_ulcer = ratio > 0.005  # 마스크 면적 0.5% 이상이면 울서
        samples.append(build_message(str(img_path), is_ulcer=is_ulcer, wound_area_ratio=ratio))

    if missing_masks:
        print(f"  [경고] 마스크 없는 이미지 {missing_masks}개 → 면적 0으로 처리")
    print(f"[wound-segmentation] {len(samples)}개 샘플 로드")
    return samples


# ── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_samples = load_dfu_binary() + load_wound_segmentation()

    if not all_samples:
        print("\n[오류] 데이터셋 없음. data/raw/ 폴더 확인하세요.")
        return

    train, val = split_dataset(all_samples, VAL_RATIO)

    for split_name, data in [("train", train), ("validation", val)]:
        out_path = OUT_DIR / f"{split_name}.json"
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  → {split_name}: {len(data)}개 저장 ({out_path})")

    print(f"\n완료. 총 {len(all_samples)}개 (train {len(train)} / val {len(val)})")


if __name__ == "__main__":
    main()
