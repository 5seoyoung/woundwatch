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

        {/* AI description — Google Gemma branded */}
        {description && (
          <div style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            {/* gradient header bar */}
            <div style={{
              background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC04, #EA4335)',
              height: 3,
            }} />
            <div style={{ background: 'var(--surface)', padding: '12px 14px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
              }}>
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

        {/* High risk alert */}
        {risk_level === 'HIGH' && (
          <div style={{
            marginTop: 14,
            background: 'var(--danger-soft)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <TossEmoji emoji="⚠️" size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>
                Immediate care recommended
              </div>
              <div style={{ fontSize: 12, color: 'var(--danger)', opacity: 0.8 }}>
                Please visit a diabetic foot specialist as soon as possible.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
