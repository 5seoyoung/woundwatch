from datetime import datetime, timezone


def compute_risk_level(severity: float, infection: bool, ischemia: bool) -> str:
    """Single-scan risk level from severity + flags."""
    if infection and ischemia:
        return "HIGH"
    if severity >= 7 or (infection and severity >= 5) or (ischemia and severity >= 5):
        return "HIGH"
    if severity >= 4 or infection or ischemia:
        return "MEDIUM"
    return "LOW"


def calculate_risk_score(records: list) -> dict:
    """
    Time-series composite risk score from wound history.

    Weights:
      - Area change rate  40 pts  (week-over-week growth)
      - Infection status  35 pts
      - Ischemia status   25 pts
    """
    if not records:
        return {
            "score": 0,
            "level": "LOW",
            "factors": {},
            "recommendation": "No scan records found. Please upload a wound photo to begin tracking.",
        }

    latest = records[-1]

    # ── Area change rate (40 pts) ─────────────────────────────────────────────
    area_change_rate = None
    area_score = 0
    if len(records) >= 2:
        prev = records[-2]
        prev_area  = getattr(prev,   "wound_area_cm2", None) or 0
        latest_area = getattr(latest, "wound_area_cm2", None) or 0
        if prev_area > 0:
            delta = (latest_area - prev_area) / prev_area
            area_score = min(delta * 100, 40)
            area_score = max(area_score, 0)
            sign = "+" if delta >= 0 else ""
            area_change_rate = f"{sign}{round(delta * 100)}%"

    # ── Infection (35 pts) ────────────────────────────────────────────────────
    infection_score = 35 if getattr(latest, "infection", False) else 0
    infection_days  = sum(1 for r in records if getattr(r, "infection", False)) * 7

    # ── Ischemia (25 pts) ─────────────────────────────────────────────────────
    ischemia_score   = 25 if getattr(latest, "ischemia", False) else 0
    ischemia_present = getattr(latest, "ischemia", False)

    # ── Trend ─────────────────────────────────────────────────────────────────
    if len(records) >= 3:
        severities = [getattr(r, "severity", 0) for r in records[-3:]]
        if severities[-1] > severities[0]:
            severity_trend = "worsening"
        elif severities[-1] < severities[0]:
            severity_trend = "improving"
        else:
            severity_trend = "stable"
    else:
        severity_trend = "insufficient data"

    total = round(area_score + infection_score + ischemia_score)
    total = min(total, 100)
    level = "LOW" if total < 40 else "MEDIUM" if total < 70 else "HIGH"

    recommendations = {
        "HIGH":   "Immediate clinical evaluation is strongly recommended. Do not delay treatment.",
        "MEDIUM": "Schedule a clinic visit within the next 1–2 weeks. Monitor closely.",
        "LOW":    "Continue regular monitoring. Maintain wound care routine.",
    }

    return {
        "score": total,
        "level": level,
        "factors": {
            "area_change_rate":  area_change_rate,
            "infection_days":    infection_days,
            "ischemia_present":  ischemia_present,
            "severity_trend":    severity_trend,
            "total_scans":       len(records),
        },
        "recommendation": recommendations[level],
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }
