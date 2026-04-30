import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import TossEmoji from '../components/TossEmoji'

const SAMPLE = [
  { date: '2026-04-03', weekLabel: 'Week 1', infection: false, ischemia: false, severity: 3.0, wound_area_cm2: 1.8, risk_level: 'LOW' },
  { date: '2026-04-10', weekLabel: 'Week 2', infection: false, ischemia: true,  severity: 5.5, wound_area_cm2: 2.6, risk_level: 'MEDIUM' },
  { date: '2026-04-17', weekLabel: 'Week 3', infection: true,  ischemia: true,  severity: 8.0, wound_area_cm2: 4.1, risk_level: 'HIGH' },
]

const RISK_COLOR = {
  HIGH:   { bg: 'var(--danger-soft)',  color: 'var(--danger)',  dot: '#D93025' },
  MEDIUM: { bg: 'var(--warning-soft)', color: 'var(--warning)', dot: '#E37400' },
  LOW:    { bg: 'var(--success-soft)', color: 'var(--success)', dot: '#1E8E3E' },
}

function TrendBar({ values }) {
  const max = Math.max(...values, 0.1)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20, flexShrink: 0 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 5,
          height: `${Math.max((v / max) * 100, 12)}%`,
          borderRadius: 2,
          background: i === values.length - 1 ? 'var(--primary)' : 'var(--primary-soft)',
        }} />
      ))}
    </div>
  )
}

function formatDate(d) {
  const dt = new Date(d)
  return `${dt.toLocaleString('en', { month: 'short' })} ${dt.getDate()}, ${dt.getFullYear()}`
}

function ScanRow({ record, areasTrend, isLast }) {
  const rc = RISK_COLOR[record.risk_level] ?? RISK_COLOR.LOW
  const chips = []
  if (record.infection) chips.push({ label: 'Infection', bg: 'var(--danger-soft)', color: 'var(--danger)' })
  if (record.ischemia)  chips.push({ label: 'Ischemia',  bg: 'var(--warning-soft)', color: 'var(--warning)' })
  if (!record.infection && !record.ischemia) chips.push({ label: 'No infection', bg: 'var(--surface-dim)', color: 'var(--on-surface-2)' })

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: rc.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TossEmoji emoji="🦶" size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{record.weekLabel}</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: rc.dot, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: rc.color }}>{record.risk_level}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--on-surface-3)', marginBottom: 4 }}>{formatDate(record.date)}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {chips.map((c, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
              background: c.bg, color: c.color,
            }}>{c.label}</span>
          ))}
        </div>
      </div>

      <TrendBar values={areasTrend} />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [records, setRecords] = useState(SAMPLE)

  useEffect(() => {
    axios.get('/api/history?patient_id=demo-patient')
      .then(({ data }) => {
        const recs = Array.isArray(data) ? data : (data.records || [])
        if (recs.length > 0) setRecords(recs)
      })
      .catch(() => {})
  }, [])

  const latest = records[records.length - 1]
  const prev   = records[records.length - 2]
  const isHigh = latest?.risk_level === 'HIGH'
  const isMed  = latest?.risk_level === 'MEDIUM'

  const areaChangePct = latest && prev && prev.wound_area_cm2
    ? Math.round(((latest.wound_area_cm2 - prev.wound_area_cm2) / prev.wound_area_cm2) * 100)
    : null

  const recentRecords = [...records].reverse().slice(0, 3)

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ background: 'var(--surface)', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-2)', marginBottom: 2, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              WoundWatch
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
              Good morning, <span style={{ color: 'var(--primary)' }}>Alex</span>
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--primary)',
            letterSpacing: '-0.5px',
          }}>AH</div>
        </div>

        {/* ── Status Card ── */}
        {(isHigh || isMed) ? (
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 0,
            border: `1px solid ${isHigh ? 'rgba(217,48,37,0.2)' : 'rgba(227,116,0,0.2)'}`,
          }}>
            {/* colored top strip */}
            <div style={{
              background: isHigh
                ? 'linear-gradient(135deg, #D93025 0%, #E8622F 100%)'
                : 'linear-gradient(135deg, #E37400 0%, #F9AB00 100%)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <TossEmoji emoji={isHigh ? '🚨' : '⚠️'} size={20} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                {isHigh ? 'High Risk — Action Required' : 'Moderate Risk — Monitor Closely'}
              </span>
            </div>
            {/* white content */}
            <div style={{ background: 'var(--surface)', padding: '16px 18px' }}>
              <p style={{ fontSize: 13, color: 'var(--on-surface-2)', lineHeight: 1.6, marginBottom: 14 }}>
                {isHigh
                  ? `Wound area grew ${areaChangePct != null ? `${areaChangePct}%` : 'significantly'} this week. Infection detected. Please visit a clinic soon.`
                  : `Wound area is growing. Signs of ischemia detected. Keep monitoring and consult your doctor.`}
              </p>
              <button
                onClick={() => navigate('/analyze')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: isHigh ? 'var(--danger)' : 'var(--warning)',
                  color: 'white', borderRadius: 100,
                  padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                }}
              >
                <TossEmoji emoji="🏥" size={14} />
                Book a Clinic Visit
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(30,142,62,0.2)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1E8E3E 0%, #34A853 100%)',
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <TossEmoji emoji="✅" size={20} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                Looking Good — Keep it Up
              </span>
            </div>
            <div style={{ background: 'var(--surface)', padding: '16px 18px' }}>
              <p style={{ fontSize: 13, color: 'var(--on-surface-2)', lineHeight: 1.6, marginBottom: 14 }}>
                Your wound is stable. Continue weekly photo check-ins to stay ahead of any changes.
              </p>
              <button
                onClick={() => navigate('/analyze')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--success)', color: 'white', borderRadius: 100,
                  padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                }}
              >
                <TossEmoji emoji="📷" size={14} />
                Take Today's Photo
              </button>
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      <div style={{ height: 8, background: 'var(--surface-dim)' }} />

      {/* ── Quick Actions ── */}
      <div style={{ background: 'var(--surface)', padding: '20px 20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 14, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { emoji: '📷', label: 'New Scan',    bg: 'var(--primary-soft)',  to: '/analyze' },
            { emoji: '📊', label: 'Progress',    bg: 'var(--success-soft)',  to: '/tracking' },
            { emoji: '🩺', label: 'Risk Score',  bg: 'var(--warning-soft)',  to: '/tracking' },
            { emoji: '📋', label: 'Report',      bg: 'var(--purple-soft)',   to: '/profile' },
          ].map(({ emoji, label, bg, to }) => (
            <button key={label} onClick={() => navigate(to)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: 14, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-1)',
              }}>
                <TossEmoji emoji={emoji} size={26} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--on-surface-2)', textAlign: 'center', lineHeight: 1.3 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 8, background: 'var(--surface-dim)' }} />

      {/* ── Recent Scans ── */}
      <div style={{ padding: '20px 20px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Recent Scans
          </div>
          <button onClick={() => navigate('/tracking')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
            See all →
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
          {recentRecords.map((r, i) => {
            const origIdx = records.length - 1 - i
            const areasTrend = records.slice(0, origIdx + 1).map(rec => rec.wound_area_cm2 ?? 0)
            return (
              <ScanRow
                key={r.date}
                record={r}
                areasTrend={areasTrend}
                isLast={i === recentRecords.length - 1}
              />
            )
          })}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}
