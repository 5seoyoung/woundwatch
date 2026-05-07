export default function WoundChart({ data, color = '#D93025' }) {
  if (!data || data.length < 2) return null

  const W = 300, H = 80
  const values = data.map(d => d.wound_area_cm2 ?? d.severity ?? 0)
  const min = Math.min(...values) * 0.8
  const max = Math.max(...values) * 1.12 || 1

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / (max - min)) * (H - 14) - 5,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const gradId = `wg-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', height: 98, overflow: 'visible' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Event marker rings */}
      {data.map((d, i) => {
        const isFirst = i === 0
        const isNewInfection = i > 0 && d.infection && !data[i - 1].infection
        const isNewHigh = i > 0 && d.risk_level === 'HIGH' && data[i - 1].risk_level !== 'HIGH'
        if (!isFirst && !isNewInfection && !isNewHigh) return null
        const ringColor = isFirst ? '#888' : '#D93025'
        return (
          <circle
            key={`ring-${i}`}
            cx={pts[i].x} cy={pts[i].y}
            r={9}
            fill="none"
            stroke={ringColor}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.7"
          />
        )
      })}

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? color : 'var(--surface)'}
          stroke={color} strokeWidth="2"
        />
      ))}
    </svg>
  )
}
