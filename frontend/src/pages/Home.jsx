import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import TossEmoji from '../components/TossEmoji'
import { DEMO_RECORDS } from '../hooks/usePatient'

const RISK_PALETTE = {
  HIGH:   { color: '#D97B6C', soft: '#FFF4F3', border: 'rgba(217,123,108,0.25)', text: '#B85C4C', label: 'High Risk'   },
  MEDIUM: { color: '#E8963C', soft: '#FFF8EE', border: 'rgba(232,150,60,0.25)',  text: '#C07020', label: 'Medium Risk' },
  LOW:    { color: '#52B788', soft: '#F0F9F4', border: 'rgba(82,183,136,0.25)',  text: '#2E8A5E', label: 'Low Risk'    },
}

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

function RiskGauge({ score, level }) {
  const R = 52, CX = 68, CY = 68
  const CIRC = 2 * Math.PI * R
  const filled = Math.max(0, Math.min(1, score / 100)) * CIRC
  const pal = RISK_PALETTE[level] ?? RISK_PALETTE.LOW
  return (
    <svg width={CX * 2} height={CY * 2} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={pal.color} strokeWidth="14" opacity="0.12"
        strokeDasharray={`${filled} ${CIRC}`} transform={`rotate(-90 ${CX} ${CY})`} />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={pal.color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC}`} transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      <text x={CX} y={CY - 7} textAnchor="middle" fontSize="28" fontWeight="800"
        fill="var(--on-surface)" fontFamily="'Pretendard', -apple-system, sans-serif">{score}</text>
      <text x={CX} y={CY + 13} textAnchor="middle" fontSize="11" fontWeight="600"
        fill="var(--on-surface-3)" fontFamily="'Pretendard', -apple-system, sans-serif">/ 100</text>
    </svg>
  )
}

function MetricPill({ emoji, label, value, valueColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 10,
      background: 'var(--surface-dim)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TossEmoji emoji={emoji} size={14} />
        <span style={{ fontSize: 11, color: 'var(--on-surface-2)', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || 'var(--on-surface)' }}>{value}</span>
    </div>
  )
}

function ScanRow({ record, idx, total, trendAreas, isLast }) {
  const pal = RISK_PALETTE[record.risk_level] ?? RISK_PALETTE.LOW
  const max = Math.max(...trendAreas, 0.1)
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: pal.soft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TossEmoji emoji="🦶" size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Week {idx + 1}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pal.text,
            background: pal.soft, padding: '1px 7px', borderRadius: 99 }}>
            {pal.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--on-surface-3)' }}>
          {record.date} · {record.wound_area_cm2 ?? '—'} cm²
          {record.infection ? ' · Infection ⚠' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', height: 18, flexShrink: 0 }}>
        {trendAreas.map((v, i) => (
          <div key={i} style={{
            width: 4, height: `${Math.max((v / max) * 100, 14)}%`,
            borderRadius: 2,
            background: i === trendAreas.length - 1 ? pal.color : 'var(--border)',
          }} />
        ))}
      </div>
    </div>
  )
}

export default function Home({ patient }) {
  const navigate = useNavigate()
  const [records, setRecords] = useState(patient?.is_demo ? DEMO_RECORDS : [])

  useEffect(() => {
    if (!patient?.patient_id) return
    api.get(`/api/history?patient_id=${patient.patient_id}`)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) setRecords(data)
      })
      .catch(() => { if (patient.is_demo) setRecords(DEMO_RECORDS) })
  }, [patient?.patient_id])

  const latest = records[records.length - 1]
  const prev   = records[records.length - 2]
  const pal    = RISK_PALETTE[latest?.risk_level] ?? RISK_PALETTE.LOW
  const score  = latest ? Math.min(100, Math.round(latest.severity * 10)) : 0
  const areaChangePct = latest && prev && prev.wound_area_cm2
    ? Math.round(((latest.wound_area_cm2 - prev.wound_area_cm2) / prev.wound_area_cm2) * 100)
    : null
  const recentRecords = [...records].reverse().slice(0, 3)

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ background: 'var(--surface)', padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="WoundWatch"
              style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
                WoundWatch
              </div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-3)', fontWeight: 500 }}>
                {records.length > 0 ? `Week ${records.length} of monitoring` : 'No scans yet'}
              </div>
            </div>
          </div>
          {patient?.is_demo && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--purple)',
              background: 'var(--purple-soft)', padding: '4px 10px', borderRadius: 99,
              border: '1px solid rgba(155,123,232,0.2)',
            }}>DEMO</span>
          )}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px',
          }}>{initials(patient?.name)}</div>
        </div>

        {/* ── Risk card ── */}
        {records.length === 0 ? (
          <div style={{
            borderRadius: 20, border: '1.5px dashed var(--border)',
            padding: '32px 20px', textAlign: 'center',
          }}>
            <TossEmoji emoji="📷" size={36} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6 }}>
              No scans yet
            </div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-2)', marginBottom: 20, lineHeight: 1.5 }}>
              Take your first photo to start<br />tracking your wound progress.
            </div>
            <button
              onClick={() => navigate('/analyze')}
              style={{
                background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: 12, padding: '12px 28px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}
            >
              <TossEmoji emoji="📷" size={15} />
              Take First Scan
            </button>
          </div>
        ) : (
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            background: 'var(--surface)',
            border: `1.5px solid ${pal.border}`,
            boxShadow: `0 4px 20px ${pal.border}`,
          }}>
            <div style={{ height: 4, background: pal.color, opacity: 0.85 }} />
            <div style={{ padding: '18px 18px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: pal.soft, borderRadius: 99, padding: '4px 10px 4px 8px',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', background: pal.color,
                    animation: latest?.risk_level !== 'LOW' ? 'pulse-dot 2s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: pal.text, letterSpacing: '0.04em' }}>
                    {pal.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-3)', fontWeight: 500 }}>
                  Last scan: {latest?.date ?? '—'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0 }}>
                  <RiskGauge score={score} level={latest?.risk_level ?? 'LOW'} />
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-3)', marginTop: -2 }}>
                    Risk Score
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <MetricPill emoji="🦠" label="Infection"
                    value={latest?.infection ? 'Detected' : 'None'}
                    valueColor={latest?.infection ? 'var(--danger)' : 'var(--success)'} />
                  <MetricPill emoji="🩸" label="Ischemia"
                    value={latest?.ischemia ? 'Detected' : 'None'}
                    valueColor={latest?.ischemia ? 'var(--danger)' : 'var(--success)'} />
                  <MetricPill emoji="📐" label="Area"
                    value={latest?.wound_area_cm2 ? `${latest.wound_area_cm2} cm²` : '—'} />
                  {areaChangePct != null && (
                    <MetricPill emoji="📈" label="vs last week"
                      value={`${areaChangePct > 0 ? '+' : ''}${areaChangePct}%`}
                      valueColor={areaChangePct > 0 ? 'var(--warning)' : 'var(--success)'} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => navigate('/analyze')} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: latest?.risk_level === 'HIGH' ? pal.color : 'var(--primary)',
                  color: 'white', borderRadius: 12, padding: '12px',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  boxShadow: `0 3px 12px ${pal.border}`,
                }}>
                  <TossEmoji emoji={latest?.risk_level === 'HIGH' ? '🏥' : '📷'} size={16} />
                  {latest?.risk_level === 'HIGH' ? 'Book a Clinic Visit' : 'New Scan'}
                </button>
                <button onClick={() => navigate('/tracking')} style={{
                  padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)',
                  background: 'var(--surface-dim)', color: 'var(--on-surface-2)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <TossEmoji emoji="📊" size={15} />
                  History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 8, background: 'var(--surface-dim)' }} />

      {/* ── Quick Actions ── */}
      <div style={{ background: 'var(--surface)', padding: '18px 20px 22px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { emoji: '📷', label: 'New Scan', bg: 'var(--primary-soft)', to: '/analyze' },
            { emoji: '📊', label: 'Progress', bg: 'var(--success-soft)', to: '/tracking' },
            { emoji: '🩺', label: 'Risk',     bg: 'var(--warning-soft)', to: '/tracking' },
            { emoji: '📋', label: 'Profile',  bg: 'var(--purple-soft)',  to: '/profile' },
          ].map(({ emoji, label, bg, to }) => (
            <button key={label} onClick={() => navigate(to)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-1)' }}>
                <TossEmoji emoji={emoji} size={25} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--on-surface-2)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Scans ── */}
      {records.length > 0 && (
        <>
          <div style={{ height: 8, background: 'var(--surface-dim)' }} />
          <div style={{ padding: '18px 20px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Recent Scans
              </div>
              <button onClick={() => navigate('/tracking')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                See all →
              </button>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)' }}>
              {recentRecords.map((r, i) => {
                const origIdx = records.length - 1 - i
                const trendAreas = records.slice(0, origIdx + 1).map(rec => rec.wound_area_cm2 ?? 0)
                return (
                  <ScanRow key={r.id ?? r.date} record={r} idx={origIdx} total={records.length}
                    trendAreas={trendAreas} isLast={i === recentRecords.length - 1} />
                )
              })}
            </div>
          </div>
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
