import TossEmoji from './TossEmoji'

const CONFIG = {
  HIGH:   { label: 'High Risk',   emoji: '🔴', bg: 'var(--danger-soft)',  color: 'var(--danger)' },
  MEDIUM: { label: 'Medium Risk', emoji: '🟡', bg: 'var(--warning-soft)', color: 'var(--warning)' },
  LOW:    { label: 'Low Risk',    emoji: '🟢', bg: 'var(--success-soft)', color: 'var(--success)' },
}

export default function RiskBadge({ level, size = 'sm' }) {
  const c = CONFIG[level] ?? CONFIG.LOW
  const pad = size === 'lg' ? '6px 14px' : '3px 10px'
  const fs  = size === 'lg' ? 13 : 11

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.color,
      borderRadius: 100,
      padding: pad,
      fontSize: fs,
      fontWeight: 700,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <TossEmoji emoji={c.emoji} size={size === 'lg' ? 14 : 11} />
      {c.label}
    </span>
  )
}
