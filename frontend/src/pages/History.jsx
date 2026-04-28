import { useState, useEffect } from 'react'
import axios from 'axios'
import RiskBadge from '../components/RiskBadge'
import WoundChart from '../components/WoundChart'

export default function History() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/history?patient_id=demo-patient')
      .then(({ data }) => setRecords(data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading history...</div>

  if (!records.length) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>No records yet. Upload a photo on the Analyze tab to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>

      <WoundChart data={records} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Date', 'Severity', 'Area (cm²)', 'Infection', 'Ischemia', 'Risk'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{r.date}</td>
                <td className="px-4 py-3 font-medium">{r.severity}/10</td>
                <td className="px-4 py-3">{r.area_cm2 ?? '—'}</td>
                <td className="px-4 py-3">{r.infection ? <span className="text-red-600">Present</span> : <span className="text-green-600">Absent</span>}</td>
                <td className="px-4 py-3">{r.ischemia  ? <span className="text-red-600">Present</span> : <span className="text-green-600">Absent</span>}</td>
                <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
