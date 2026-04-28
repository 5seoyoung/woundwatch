"""
DFUC 2021 데이터셋 → Gemma 4 파인튜닝용 chat format 변환 스크립트

DFUC 2021 폴더 구조 가정:
  data/raw/DFUC2021/
    train/
      images/   ← .jpg 상처 사진
      labels/   ← .csv 또는 .json (infection, ischemia 라벨)
    validation/
      images/
      labels/

출력:
  data/processed/train.json
  data/processed/validation.json
"""

import json
import csv
import os
from pathlib import Path


RAW_DIR = Path("data/raw/DFUC2021")
OUT_DIR = Path("data/processed")

# DFUC 2021 severity 매핑 (infection x ischemia 조합)
# 논문 기준: infection=1, ischemia=1 이 가장 위험
SEVERITY_MAP = {
    (False, False): (2, "No signs of infection or ischemia. Wound appears clean."),
    (True,  False): (6, "Infection present. Erythema and exudate observed around wound margins."),
    (False, True ): (7, "Ischemia present. Poor perfusion signs with pale or necrotic tissue."),
    (True,  True ): (9, "Both infection and ischemia present. High amputation risk. Immediate clinical attention required."),
}


def build_message(image_path: str, infection: bool, ischemia: bool) -> dict:
    severity_score, description = SEVERITY_MAP[(infection, ischemia)]
    return {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_path},
                    {
                        "type": "text",
                        "text": (
                            "Analyze this diabetic foot wound image. "
                            "Classify: (1) infection status — present or absent, "
                            "(2) ischemia status — present or absent, "
                            "(3) severity score 0-10, "
                            "(4) brief clinical description."
                        ),
                    },
                ],
            },
            {
                "role": "assistant",
                "content": (
                    f"Infection: {'present' if infection else 'absent'}. "
                    f"Ischemia: {'present' if ischemia else 'absent'}. "
                    f"Severity: {severity_score}/10. "
                    f"{description}"
                ),
            },
        ]
    }


def load_labels_csv(label_path: Path) -> dict:
    """CSV 라벨 파일 로드 → {filename: {infection, ischemia}} 딕셔너리"""
    labels = {}
    with open(label_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["image_name"].strip()
            labels[name] = {
                "infection": row["infection"].strip().lower() in ("1", "true", "yes"),
                "ischemia":  row["ischemia"].strip().lower()  in ("1", "true", "yes"),
            }
    return labels


def load_labels_json(label_path: Path) -> dict:
    """JSON 라벨 파일 로드"""
    with open(label_path) as f:
        raw = json.load(f)
    return {
        item["image_name"]: {
            "infection": bool(item["infection"]),
            "ischemia":  bool(item["ischemia"]),
        }
        for item in raw
    }


def process_split(split: str) -> list[dict]:
    image_dir = RAW_DIR / split / "images"
    label_dir = RAW_DIR / split / "labels"

    # CSV 또는 JSON 라벨 파일 자동 탐지
    csv_files  = list(label_dir.glob("*.csv"))
    json_files = list(label_dir.glob("*.json"))

    if csv_files:
        labels = load_labels_csv(csv_files[0])
    elif json_files:
        labels = load_labels_json(json_files[0])
    else:
        raise FileNotFoundError(f"No label file found in {label_dir}")

    dataset = []
    missing = 0

    for img_file in sorted(image_dir.glob("*.jpg")):
        name = img_file.name
        if name not in labels:
            missing += 1
            continue
        label = labels[name]
        dataset.append(
            build_message(
                image_path=str(img_file.resolve()),
                infection=label["infection"],
                ischemia=label["ischemia"],
            )
        )

    if missing:
        print(f"  [{split}] 라벨 없는 이미지 {missing}개 스킵")

    return dataset


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for split in ("train", "validation"):
        split_dir = RAW_DIR / split
        if not split_dir.exists():
            print(f"[SKIP] {split_dir} 폴더 없음")
            continue

        print(f"[{split}] 처리 중...")
        dataset = process_split(split)

        out_path = OUT_DIR / f"{split}.json"
        with open(out_path, "w") as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)

        print(f"  → {len(dataset)}개 샘플 저장: {out_path}")

    print("\n완료. data/processed/ 확인하세요.")


if __name__ == "__main__":
    main()
