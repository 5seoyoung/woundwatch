import TossEmoji from '../components/TossEmoji'
import RiskBadge from '../components/RiskBadge'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { DEMO_RECORDS } from '../hooks/usePatient'

const HOW_IT_WORKS = [
  { emoji: '📷', step: '1', title: 'Take a weekly photo',    desc: 'Photograph your foot wound at the same angle each week.' },
  { emoji: '🤖', step: '2', title: 'AI analyzes the wound',  desc: 'Gemma 4 checks for infection, ischemia, and wound severity.' },
  { emoji: '📊', step: '3', title: 'Track changes over time', desc: 'See how your wound is healing — or worsening — week by week.' },
  { emoji: '🚨', step: '4', title: 'Get early warnings',     desc: 'Receive alerts before the wound reaches a critical stage.' },
]

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

export default function Profile({ patient, onReset }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ lastScan: '—', total: 0, riskLevel: null })
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!patient?.patient_id) return
    if (patient.is_demo) {
      const latest = DEMO_RECORDS[DEMO_RECORDS.length - 1]
      setStats({ lastScan: latest.date, total: DEMO_RECORDS.length, riskLevel: latest.risk_level })
      return
    }
    api.get(`/api/history?patient_id=${patient.patient_id}`)
      .then(({ data }) => {
        if (!Array.isArray(data) || data.length === 0) return
        const latest = data[data.length - 1]
        setStats({ lastScan: latest.date, total: data.length, riskLevel: latest.risk_level })
      })
      .catch(() => {})
  }, [patient?.patient_id])

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
          }}>{initials(patient?.name)}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
                {patient?.name ?? '—'}
              </span>
              {patient?.is_demo && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', background: 'var(--purple-soft)', padding: '2px 8px', borderRadius: 99 }}>DEMO</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-2)', marginTop: 2 }}>
              {patient?.diabetes_type} Diabetes · Since {patient?.since}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Last Scan',    value: stats.lastScan },
            { label: 'Total Scans',  value: String(stats.total) },
            { label: 'Current Risk', value: stats.riskLevel ? <RiskBadge level={stats.riskLevel} /> : '—' },
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
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TossEmoji emoji={emoji} size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-2)', lineHeight: 1.5 }}>{desc}</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'var(--surface-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)' }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Privacy ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Privacy</div>
        <div style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}>
          {[
            { emoji: '💻', title: 'Runs locally with Ollama',   desc: 'AI inference runs on your device — no cloud required.' },
            { emoji: '🔒', title: 'Photos stay on your device', desc: 'Your medical images are never sent to external servers.' },
            { emoji: '🏥', title: 'For monitoring only',        desc: 'WoundWatch is not a replacement for clinical diagnosis.' },
          ].map(({ emoji, title, desc }, i, arr) => (
            <div key={title} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
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
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, padding: '8px 16px', boxShadow: 'var(--shadow-1)' }}>
          {['#4285F4','#EA4335','#FBBC04','#34A853'].map(c => (
            <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)' }}>Powered by Google Gemma 4</span>
        </div>
      </div>

      {/* ── Run Locally ── */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={() => navigate('/local')}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--purple-soft)',
            border: '1.5px solid rgba(155,123,232,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer',
          }}
        >
          <TossEmoji emoji="💻" size={18} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>Run Locally with Ollama</div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-2)' }}>Setup guide for local AI inference</div>
          </div>
        </button>
      </div>

      {/* ── Reset profile ── */}
      <div style={{ padding: '20px 20px 36px' }}>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              fontSize: 13, fontWeight: 600, color: 'var(--on-surface-3)', cursor: 'pointer',
            }}
          >
            Reset profile &amp; data
          </button>
        ) : (
          <div style={{ background: 'var(--danger-soft)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>Are you sure?</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-2)', marginBottom: 14 }}>
              This will clear your profile from this device. Scan records on the server remain.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onReset} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--danger)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Yes, reset
              </button>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
