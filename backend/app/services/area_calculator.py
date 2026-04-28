import cv2
import numpy as np
from PIL import Image

# 발 사진 평균 크기 가정: 약 20cm x 25cm
# 이미지 픽셀 → cm² 환산 (rough estimate)
ASSUMED_FOOT_WIDTH_CM = 9.0
ASSUMED_FOOT_HEIGHT_CM = 20.0


def estimate_wound_area(image: Image.Image) -> float | None:
    """
    OpenCV contour detection으로 궤양 면적(cm²) 추정.
    붉은/어두운 상처 영역을 검출해 전체 이미지 대비 비율로 환산.
    """
    img = np.array(image.convert("RGB"))
    h, w = img.shape[:2]

    # HSV 색공간에서 붉은/어두운 상처 영역 마스킹
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)

    # 붉은 영역 (infection/open wound)
    mask_red1 = cv2.inRange(hsv, (0,  60, 40), (10,  255, 255))
    mask_red2 = cv2.inRange(hsv, (165, 60, 40), (180, 255, 255))
    # 어두운 영역 (necrosis/eschar)
    mask_dark = cv2.inRange(hsv, (0, 0, 0), (180, 255, 60))

    mask = cv2.bitwise_or(mask_red1, cv2.bitwise_or(mask_red2, mask_dark))

    # 노이즈 제거
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)

    wound_pixels = int(np.count_nonzero(mask))
    total_pixels = h * w

    if wound_pixels == 0:
        return None

    wound_ratio = wound_pixels / total_pixels

    # 픽셀 비율 → cm² (발 전체 면적 기준)
    foot_area_cm2 = ASSUMED_FOOT_WIDTH_CM * ASSUMED_FOOT_HEIGHT_CM
    area_cm2 = round(wound_ratio * foot_area_cm2, 2)

    return area_cm2 if area_cm2 > 0.1 else None
