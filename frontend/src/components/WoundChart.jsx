import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

export default function WoundChart({ data }) {
  if (!data?.length) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Wound Progression</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} label={{ value: 'Severity', angle: -90, position: 'insideLeft', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v, name) => [
              name === 'severity' ? `${v}/10` : `${v} cm²`,
              name === 'severity' ? 'Severity' : 'Wound Area',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={7} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'High Risk', fill: '#dc2626', fontSize: 11 }} />
          <Line type="monotone" dataKey="severity"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="area_cm2"  stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
