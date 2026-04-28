"""
전처리된 데이터셋 검증 스크립트
- 샘플 수 확인
- 라벨 분포 확인
- 이미지 파일 실제 존재 여부 확인
"""

import json
from pathlib import Path
from collections import Counter


def verify(json_path: Path):
    with open(json_path) as f:
        data = json.load(f)

    print(f"\n{'='*40}")
    print(f"파일: {json_path}")
    print(f"총 샘플: {len(data)}")

    infection_counts = Counter()
    ischemia_counts = Counter()
    missing_images = 0

    for item in data:
        assistant_text = item["messages"][1]["content"]
        infection = "Infection: present" in assistant_text
        ischemia  = "Ischemia: present"  in assistant_text
        infection_counts[infection] += 1
        ischemia_counts[ischemia]   += 1

        image_path = item["messages"][0]["content"][0]["image"]
        if not Path(image_path).exists():
            missing_images += 1

    print(f"\n[라벨 분포]")
    print(f"  Infection present : {infection_counts[True]}")
    print(f"  Infection absent  : {infection_counts[False]}")
    print(f"  Ischemia  present : {ischemia_counts[True]}")
    print(f"  Ischemia  absent  : {ischemia_counts[False]}")

    if missing_images:
        print(f"\n[경고] 이미지 파일 없음: {missing_images}개")
    else:
        print(f"\n[OK] 모든 이미지 파일 존재 확인")


if __name__ == "__main__":
    processed_dir = Path("data/processed")
    for json_file in sorted(processed_dir.glob("*.json")):
        verify(json_file)
