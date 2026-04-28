import RiskBadge from './RiskBadge'

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

export default function AnalysisResult({ result }) {
  const { infection, ischemia, severity, area_cm2, risk_level, description } = result

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Analysis Result</h3>
        <RiskBadge level={risk_level} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Severity"  value={`${severity}/10`} />
        <Stat label="Wound Area" value={area_cm2 ? `${area_cm2} cm²` : '—'} />
        <Stat label="Infection"  value={infection ? '⚠ Present' : '✓ Absent'} />
        <Stat label="Ischemia"   value={ischemia  ? '⚠ Present' : '✓ Absent'} />
      </div>

      {description && (
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900 leading-relaxed">
          {description}
        </div>
      )}

      {risk_level === 'HIGH' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 font-medium">
          ⚠ Immediate clinical evaluation recommended. Contact your healthcare provider.
        </div>
      )}
    </div>
  )
}
