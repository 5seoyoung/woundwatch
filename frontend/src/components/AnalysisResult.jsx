import { useState } from 'react'
import RiskBadge from './RiskBadge'
import TossEmoji from './TossEmoji'

function MetricCard({ emoji, label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <TossEmoji emoji={emoji} size={14} />
        <span style={{ fontSize: 11, color: 'var(--on-surface-2)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--on-surface)' }}>{value}</div>
    </div>
  )
}

const NEXT_STEPS = {
  HIGH: {
    dot: '#D93025',
    title: '지금 즉시 당뇨발 전문 클리닉에 연락하세요',
    items: [
      '발에 체중을 싣지 마세요',
      '상처를 깨끗한 거즈로 덮어두세요',
      '오늘 안에 병원 방문 또는 응급 연락',
    ],
    bg: 'var(--danger-soft)',
    border: 'rgba(217,48,37,0.2)',
    color: 'var(--danger)',
  },
  MEDIUM: {
    dot: '#F9AB00',
    title: '이번 주 안에 담당 의사에게 상처 사진을 보내세요',
    items: [
      '매일 사진 찍어 변화 기록',
      '발이 붓거나 열감이 생기면 즉시 병원',
      '다음 주 재검사 예약',
    ],
    bg: '#FFFBF0',
    border: 'rgba(249,171,0,0.25)',
    color: '#B06000',
  },
  LOW: {
    dot: '#1E8E3E',
    title: '현재 상태 양호합니다. 주간 모니터링을 계속하세요',
    items: [
      '다음 주 같은 각도로 사진 촬영',
      '발 세척 및 보습 유지',
      '이상 징후 발생 시 즉시 재분석',
    ],
    bg: '#F0FAF3',
    border: 'rgba(30,142,62,0.2)',
    color: 'var(--success)',
  },
}

function NextSteps({ riskLevel }) {
  const [checked, setChecked] = useState({})
  const cfg = NEXT_STEPS[riskLevel] || NEXT_STEPS.LOW

  return (
    <div style={{
      marginTop: 14,
      background: cfg.bg,
      borderRadius: 14, padding: '14px 16px',
      border: `1px solid ${cfg.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, lineHeight: 1.4 }}>
          {cfg.title}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cfg.items.map((item, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: checked[i] ? 'none' : `1.5px solid ${cfg.dot}`,
                background: checked[i] ? cfg.dot : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {checked[i] && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 13, color: 'var(--on-surface)',
              textDecoration: checked[i] ? 'line-through' : 'none',
              opacity: checked[i] ? 0.5 : 1,
              transition: 'all 0.15s',
            }}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function AnalysisResult({ result }) {
  const { infection, ischemia, severity, wound_area_cm2, risk_level, description } = result
  const score = Math.min(Math.round(severity * 10), 100)

  return (
    <div className="fade-in" style={{ margin: '0 20px 12px' }}>
      {/* ── Score card ── */}
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: 20,
        boxShadow: 'var(--shadow-1)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Risk Score
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1, letterSpacing: '-1px' }}>
              {score}
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--on-surface-3)', marginLeft: 2 }}>/100</span>
            </div>
          </div>
          <RiskBadge level={risk_level} size="lg" />
        </div>

        {/* Gauge */}
        <div style={{ height: 6, background: 'var(--surface-dim)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 100, width: `${score}%`,
            background: 'linear-gradient(90deg, #1E8E3E 0%, #F9AB00 50%, #D93025 100%)',
            transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-3)', marginBottom: 20, fontWeight: 500 }}>
          <span>Safe</span><span>Caution</span><span>Critical</span>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <MetricCard
            emoji="🦠"
            label="Infection"
            value={infection ? 'Detected' : 'None'}
            color={infection ? 'var(--danger)' : 'var(--success)'}
          />
          <MetricCard
            emoji="🩸"
            label="Ischemia"
            value={ischemia ? 'Detected' : 'None'}
            color={ischemia ? 'var(--danger)' : 'var(--success)'}
          />
          <MetricCard
            emoji="📐"
            label="Wound Area"
            value={wound_area_cm2 ? `${wound_area_cm2} cm²` : '—'}
          />
          <MetricCard
            emoji="📊"
            label="Severity"
            value={`${severity}/10`}
            color={severity >= 7 ? 'var(--danger)' : severity >= 4 ? 'var(--warning)' : 'var(--success)'}
          />
        </div>

        {/* AI description */}
        {description && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC04, #EA4335)', height: 3 }} />
            <div style={{ background: 'var(--surface)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TossEmoji emoji="✨" size={14} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em' }}>
                  Gemma 4 AI Analysis
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.65, margin: 0 }}>
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <NextSteps riskLevel={risk_level} />
      </div>
    </div>
  )
}
