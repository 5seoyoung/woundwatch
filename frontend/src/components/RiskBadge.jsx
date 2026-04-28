const CONFIG = {
  LOW:    { label: 'LOW RISK',    bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  MEDIUM: { label: 'MEDIUM RISK', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  HIGH:   { label: 'HIGH RISK',   bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
}

export default function RiskBadge({ level }) {
  const c = CONFIG[level] ?? CONFIG.LOW
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
