def compute_risk_level(severity: float, infection: bool, ischemia: bool) -> str:
    """
    severity(0-10) + infection + ischemia 조합으로 위험도 판정.
    둘 다 있으면 무조건 HIGH.
    """
    if infection and ischemia:
        return "HIGH"
    if severity >= 7 or (infection and severity >= 5) or (ischemia and severity >= 5):
        return "HIGH"
    if severity >= 4 or infection or ischemia:
        return "MEDIUM"
    return "LOW"


def parse_gemma_output(text: str) -> dict:
    """
    Gemma 4 출력 텍스트에서 infection / ischemia / severity 파싱.
    명시적 키워드 탐지 방식.
    """
    text_lower = text.lower()

    infection = (
        "infection: present" in text_lower
        or "infection present" in text_lower
        or ("infect" in text_lower and "absent" not in text_lower.split("infect")[1][:30])
    )
    ischemia = (
        "ischemia: present" in text_lower
        or "ischemia present" in text_lower
        or ("ischem" in text_lower and "absent" not in text_lower.split("ischem")[1][:30])
    )

    # severity 숫자 추출
    severity = 5.0
    import re
    matches = re.findall(r"severity[:\s]*(\d+(?:\.\d+)?)\s*/\s*10", text_lower)
    if not matches:
        matches = re.findall(r"score[:\s]*(\d+(?:\.\d+)?)\s*/\s*10", text_lower)
    if matches:
        severity = min(float(matches[0]), 10.0)

    return {"infection": infection, "ischemia": ischemia, "severity": severity}
