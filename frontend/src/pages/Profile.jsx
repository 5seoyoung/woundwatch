import TossEmoji from '../components/TossEmoji'
import RiskBadge from '../components/RiskBadge'

const HOW_IT_WORKS = [
  { emoji: '📷', step: '1', title: 'Take a weekly photo',  desc: 'Photograph your foot wound at the same angle each week.' },
  { emoji: '🤖', step: '2', title: 'AI analyzes the wound', desc: 'Gemma 4 checks for infection, ischemia, and wound severity.' },
  { emoji: '📊', step: '3', title: 'Track changes over time', desc: 'See how your wound is healing — or worsening — week by week.' },
  { emoji: '🚨', step: '4', title: 'Get early warnings',  desc: 'Receive alerts before the wound reaches a critical stage.' },
]

export default function Profile() {
  return (
    <div>
      {/* ── Patient Header ── */}
      <div style={{ background: 'var(--surface)', padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.5px',
          }}>AH</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
              Alex Henderson
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-2)', marginTop: 2 }}>
              Type 2 Diabetes · Monitoring since Apr 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Last Scan',    value: 'Apr 17' },
            { label: 'Total Scans',  value: '3' },
            { label: 'Current Risk', value: <RiskBadge level="HIGH" /> },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 10px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--on-surface-3)', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          How WoundWatch Works
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HOW_IT_WORKS.map(({ emoji, step, title, desc }) => (
            <div key={step} style={{
              background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TossEmoji emoji={emoji} size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 3 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-2)', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface-dim)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)',
              }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Privacy card ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Privacy
        </div>
        <div style={{
          background: 'var(--surface)', borderRadius: 14, overflow: 'hidden',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)',
        }}>
          {[
            { emoji: '💻', title: 'Runs locally with Ollama', desc: 'AI inference runs on your device — no cloud required.' },
            { emoji: '🔒', title: 'Photos stay on your device', desc: 'Your medical images are never sent to external servers.' },
            { emoji: '🏥', title: 'For monitoring only',       desc: 'WoundWatch is not a replacement for clinical diagnosis.' },
          ].map(({ emoji, title, desc }, i, arr) => (
            <div key={title} style={{
              display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <TossEmoji emoji={emoji} size={18} style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-2)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Powered by ── */}
      <div style={{ padding: '20px 20px 32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 100, padding: '8px 16px',
          boxShadow: 'var(--shadow-1)',
        }}>
          {/* Google 4-color dots */}
          {['#4285F4','#EA4335','#FBBC04','#34A853'].map(c => (
            <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)' }}>Powered by Google Gemma 4</span>
        </div>
      </div>
    </div>
  )
}
