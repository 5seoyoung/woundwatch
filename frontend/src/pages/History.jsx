import { useState, useEffect } from 'react'
import axios from 'axios'
import RiskBadge from '../components/RiskBadge'
import WoundChart from '../components/WoundChart'
import TossEmoji from '../components/TossEmoji'

const SAMPLE = [
  { date: '2026-04-03', weekLabel: 'Week 1', infection: false, ischemia: false, severity: 3.0, wound_area_cm2: 1.8, risk_level: 'LOW' },
  { date: '2026-04-10', weekLabel: 'Week 2', infection: false, ischemia: true,  severity: 5.5, wound_area_cm2: 2.6, risk_level: 'MEDIUM' },
  { date: '2026-04-17', weekLabel: 'Week 3', infection: true,  ischemia: true,  severity: 8.0, wound_area_cm2: 4.1, risk_level: 'HIGH' },
]

function formatDate(d) {
  const dt = new Date(d)
  return `${dt.toLocaleString('en', { month: 'short' })} ${dt.getDate()}`
}

function WeekRow({ label, area, maxArea, riskLevel, isLast }) {
  const pct = maxArea > 0 ? (area / maxArea) * 100 : 0
  const barColor = riskLevel === 'HIGH' ? 'var(--danger)' : riskLevel === 'MEDIUM' ? 'var(--warning)' : 'var(--success)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--on-surface-2)', width: 52, flexShrink: 0, fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--surface-dim)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: barColor,
          borderRadius: 100, transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? barColor : 'var(--on-surface)', width: 48, textAlign: 'right', flexShrink: 0 }}>
        {area} cm²
      </div>
    </div>
  )
}

export default function History() {
  const [records, setRecords] = useState(SAMPLE)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('patient') // 'patient' | 'clinical'

  useEffect(() => {
    axios.get('/api/history?patient_id=demo-patient')
      .then(({ data }) => {
        const recs = Array.isArray(data) ? data : (data.records || [])
        if (recs.length > 0) setRecords(recs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const latest  = records[records.length - 1]
  const first   = records[0]
  const maxArea = Math.max(...records.map(r => r.wound_area_cm2 ?? 0))
  const alertCount = records.filter(r => r.risk_level !== 'LOW').length

  const totalChangePct = latest && first && first.wound_area_cm2
    ? Math.round(((latest.wound_area_cm2 - first.wound_area_cm2) / first.wound_area_cm2) * 100)
    : null

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ background: 'var(--surface)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>
              Wound Progress
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>
              {records.length}-week tracking
            </div>
          </div>

          {/* View toggle */}
          <div style={{
            display: 'flex', background: 'var(--surface-dim)',
            borderRadius: 100, padding: 3, border: '1px solid var(--border)',
          }}>
            {['patient', 'clinical'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 12px', borderRadius: 100, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: view === v ? 'var(--surface)' : 'transparent',
                  color: view === v ? 'var(--primary)' : 'var(--on-surface-3)',
                  boxShadow: view === v ? 'var(--shadow-1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {v === 'patient' ? 'Simple' : 'Clinical'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { emoji: '📐', val: `${latest?.wound_area_cm2 ?? '—'}`, label: 'Area (cm²)', color: latest?.risk_level === 'HIGH' ? 'var(--danger)' : 'var(--on-surface)' },
            { emoji: '📅', val: `${records.length} wks`, label: 'Tracked', color: 'var(--on-surface)' },
            { emoji: '⚠️', val: `${alertCount}`, label: 'Alerts', color: alertCount > 0 ? 'var(--warning)' : 'var(--success)' },
          ].map(({ emoji, val, label, color }) => (
            <div key={label} style={{
              background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 10px', textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <TossEmoji emoji={emoji} size={20} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 2, letterSpacing: '-0.5px' }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--on-surface-3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Area chart ── */}
      <div style={{ background: 'var(--surface)', margin: '8px 20px 0', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Wound Area
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.5px' }}>
            {latest?.wound_area_cm2 ?? '—'} cm²
          </div>
          {totalChangePct != null && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: totalChangePct > 0 ? 'var(--danger)' : 'var(--success)',
            }}>
              {totalChangePct > 0 ? '▲' : '▼'} {Math.abs(totalChangePct)}% ({records.length} weeks)
            </span>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <WoundChart data={records} color={latest?.risk_level === 'HIGH' ? '#D93025' : '#1A73E8'} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-3)', marginTop: 8, fontWeight: 500 }}>
          {records.map(r => <span key={r.date}>{formatDate(r.date)}</span>)}
        </div>
      </div>

      {/* ── Weekly bars ── */}
      <div style={{ background: 'var(--surface)', margin: '10px 20px 0', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 16px 10px', fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>
          Weekly Comparison
        </div>
        {records.map((r, i) => (
          <WeekRow
            key={r.date}
            label={r.weekLabel || `Week ${i + 1}`}
            area={r.wound_area_cm2 ?? 0}
            maxArea={maxArea}
            riskLevel={r.risk_level}
            isLast={i === records.length - 1}
          />
        ))}
      </div>

      {/* ── Clinical view: full table ── */}
      {view === 'clinical' && (
        <div style={{ margin: '10px 20px 0', background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-1)', border: '1px solid var(--border)' }}>
          <div style={{ padding: '14px 16px 10px', fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>
            All Records
          </div>
          {[...records].reverse().map((r, i) => (
            <div key={r.date} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px',
              borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                  {r.weekLabel || `Week ${records.length - i}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-3)', marginTop: 2 }}>
                  {r.date} · {r.wound_area_cm2} cm² · Sev {r.severity}/10 ·{' '}
                  {r.infection ? 'Inf ✓' : 'Inf ✗'} ·{' '}
                  {r.ischemia  ? 'Isch ✓' : 'Isch ✗'}
                </div>
              </div>
              <RiskBadge level={r.risk_level} />
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
