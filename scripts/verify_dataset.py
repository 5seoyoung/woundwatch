"""
전처리된 데이터셋 검증 스크립트 — JSON 응답 포맷용
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
    ischemia_counts  = Counter()
    missing_images   = 0
    parse_errors     = 0

    for item in data:
        msgs = item["messages"]
        # assistant content is JSON string
        assistant_content = msgs[-1]["content"]
        try:
            resp = json.loads(assistant_content)
            infection_counts[resp.get("infection", False)] += 1
            ischemia_counts[resp.get("ischemia", False)]   += 1
        except (json.JSONDecodeError, TypeError):
            parse_errors += 1

        # image path from user content
        user_content = msgs[1]["content"]
        if isinstance(user_content, list):
            img_uri = user_content[0].get("image", "")
            img_path = img_uri.replace("file://", "")
            if img_path and not Path(img_path).exists():
                missing_images += 1

    print(f"\n[라벨 분포]")
    print(f"  infection=True  : {infection_counts[True]}")
    print(f"  infection=False : {infection_counts[False]}")
    print(f"  ischemia=True   : {ischemia_counts[True]}")
    print(f"  ischemia=False  : {ischemia_counts[False]}")

    if parse_errors:
        print(f"\n[경고] JSON 파싱 실패: {parse_errors}개")
    if missing_images:
        print(f"[경고] 이미지 파일 없음: {missing_images}개")
    else:
        print(f"\n[OK] 모든 이미지 파일 존재 확인")


if __name__ == "__main__":
    processed_dir = Path("data/processed")
    if not processed_dir.exists():
        print("data/processed/ 폴더 없음. prepare_kaggle.py를 먼저 실행하세요.")
    else:
        for json_file in sorted(processed_dir.glob("*.json")):
            verify(json_file)
