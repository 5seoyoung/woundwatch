import { useState } from 'react'
import RiskBadge from './RiskBadge'

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--on-surface-2)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--on-surface)' }}>{value}</div>
    </div>
  )
}

const NEXT_STEPS = {
  HIGH: {
    dot: '#DC2626',
    title: 'Contact a diabetic foot clinic immediately',
    items: [
      'Avoid putting weight on the foot',
      'Cover the wound with clean gauze',
      'Visit or call a clinic today',
    ],
    bg: '#FEF2F2',
    border: 'rgba(220,38,38,0.2)',
    color: '#991B1B',
  },
  MEDIUM: {
    dot: '#D97706',
    title: 'Send wound photos to your doctor this week',
    items: [
      'Photograph daily to track changes',
      'Seek immediate care if swelling or heat develops',
      'Schedule a follow-up appointment',
    ],
    bg: '#FFFBEB',
    border: 'rgba(217,119,6,0.2)',
    color: '#92400E',
  },
  LOW: {
    dot: '#059669',
    title: 'Current status looks stable. Continue weekly monitoring.',
    items: [
      'Photograph from the same angle next week',
      'Maintain wound cleaning and moisturizing routine',
      'Re-analyze immediately if any changes appear',
    ],
    bg: '#ECFDF5',
    border: 'rgba(5,150,105,0.2)',
    color: '#065F46',
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
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
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
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: 20,
        boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)',
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

        {/* Gauge bar */}
        <div style={{ height: 6, background: 'var(--surface-dim)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 100, width: `${score}%`,
            background: 'linear-gradient(90deg, #059669 0%, #D97706 50%, #DC2626 100%)',
            transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-3)', marginBottom: 8, fontWeight: 500 }}>
          <span>Safe</span><span>Caution</span><span>Critical</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Area Δ', weight: '40%', color: '#1A73E8' },
            { label: 'Infection', weight: '35%', color: '#DC2626' },
            { label: 'Ischemia', weight: '25%', color: '#7C3AED' },
          ].map(({ label, weight, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface-dim)', borderRadius: 99,
              padding: '3px 8px', border: '1px solid var(--border)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--on-surface-3)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--on-surface-2)' }}>{weight}</span>
            </div>
          ))}
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <MetricCard label="Infection" value={infection ? 'Detected' : 'None'}
            color={infection ? 'var(--danger)' : 'var(--success)'} />
          <MetricCard label="Ischemia" value={ischemia ? 'Detected' : 'None'}
            color={ischemia ? 'var(--danger)' : 'var(--success)'} />
          <MetricCard label="Wound Area"
            value={wound_area_cm2 ? `${wound_area_cm2} cm²` : '—'} />
          <MetricCard label="Severity" value={`${severity}/10`}
            color={severity >= 7 ? 'var(--danger)' : severity >= 4 ? 'var(--warning)' : 'var(--success)'} />
        </div>

        {/* AI description */}
        {description && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC04, #EA4335)', height: 3 }} />
            <div style={{ background: 'var(--surface)', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em', marginBottom: 8 }}>
                Gemma 4 E2B Analysis
              </div>
              <p style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.65, margin: 0 }}>
                {description}
              </p>
            </div>
          </div>
        )}

        <NextSteps riskLevel={risk_level} />
      </div>
    </div>
  )
}
