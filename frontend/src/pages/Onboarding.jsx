import { useState } from 'react'
import TossEmoji from '../components/TossEmoji'

const DIABETES_TYPES = [
  { key: 'Type 1',      desc: 'Autoimmune · insulin-dependent' },
  { key: 'Type 2',      desc: 'Insulin resistance · most common' },
  { key: 'Gestational', desc: 'Develops during pregnancy' },
  { key: 'Other',       desc: 'LADA, MODY, or secondary' },
]

export default function Onboarding({ onDemo, onComplete }) {
  const [step,         setStep]         = useState('choose')  // 'choose' | 'register'
  const [name,         setName]         = useState('')
  const [diabetesType, setDiabetesType] = useState('')
  const [loading,      setLoading]      = useState(false)

  const canSubmit = name.trim().length > 0 && diabetesType !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    await onComplete({ name: name.trim(), diabetes_type: diabetesType })
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-soft)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 24px 40px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="WoundWatch"
          style={{ width: 68, height: 68, objectFit: 'contain', marginBottom: 12 }}
        />
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.5px' }}>
          WoundWatch
        </div>
        <div style={{ fontSize: 13, color: 'var(--on-surface-2)', marginTop: 3 }}>
          AI-powered diabetic foot monitoring
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* ── STEP 1: Choose mode ── */}
        {step === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', textAlign: 'center', marginBottom: 4 }}>
              How would you like to start?
            </div>

            {/* Demo card */}
            <button
              onClick={onDemo}
              style={{
                background: 'var(--surface)', borderRadius: 20,
                padding: '20px', border: '1.5px solid var(--primary)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                boxShadow: '0 4px 16px rgba(92,142,229,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'var(--primary-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TossEmoji emoji="🔬" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>Try Demo</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                      background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 99,
                    }}>RECOMMENDED</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-2)', lineHeight: 1.55 }}>
                    Explore a pre-loaded case of Alex Henderson — a Type 2 diabetic patient with 3 weeks of wound history.
                  </div>
                </div>
              </div>
            </button>

            {/* Register card */}
            <button
              onClick={() => setStep('register')}
              style={{
                background: 'var(--surface)', borderRadius: 20,
                padding: '20px', border: '1.5px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'var(--success-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TossEmoji emoji="👤" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
                    My Profile
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-2)', lineHeight: 1.55 }}>
                    Create your own profile and start tracking your wound with real AI analysis.
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── STEP 2: Register form ── */}
        {step === 'register' && (
          <div style={{
            background: 'var(--surface)', borderRadius: 24,
            padding: 24, boxShadow: 'var(--shadow-2)',
            border: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setStep('choose')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--on-surface-2)', fontWeight: 600,
                padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ← Back
            </button>

            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
              Create your profile
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-2)', marginBottom: 24 }}>
              Your data stays on your device. No account needed.
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', display: 'block', marginBottom: 6 }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Henderson"
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 12, border: '1.5px solid var(--border)',
                    fontSize: 14, color: 'var(--on-surface)',
                    background: 'var(--surface)', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Diabetes type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', display: 'block', marginBottom: 8 }}>
                  Diabetes type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {DIABETES_TYPES.map(({ key, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDiabetesType(key)}
                      style={{
                        padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                        border: diabetesType === key ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        background: diabetesType === key ? 'var(--primary-soft)' : 'var(--surface)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: diabetesType === key ? 'var(--primary)' : 'var(--on-surface)',
                        marginBottom: 2,
                      }}>{key}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 500,
                        color: diabetesType === key ? 'var(--primary)' : 'var(--on-surface-3)',
                        lineHeight: 1.4,
                      }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                style={{
                  padding: '14px', borderRadius: 14, border: 'none',
                  background: canSubmit ? 'var(--primary)' : 'var(--border)',
                  color: canSubmit ? 'white' : 'var(--on-surface-3)',
                  fontSize: 14, fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                {loading ? (
                  <div style={{
                    width: 18, height: 18,
                    border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <>
                    <TossEmoji emoji="👟" size={16} />
                    Start monitoring
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Privacy note */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <TossEmoji emoji="🔒" size={13} />
        <span style={{ fontSize: 11, color: 'var(--on-surface-3)' }}>
          Photos and data never leave your device
        </span>
      </div>
    </div>
  )
}
