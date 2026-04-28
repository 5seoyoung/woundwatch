import { useState } from 'react'
import axios from 'axios'
import UploadZone from '../components/UploadZone'
import AnalysisResult from '../components/AnalysisResult'
import WoundChart from '../components/WoundChart'

export default function Dashboard() {
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [history, setHistory]   = useState([])
  const [error, setError]       = useState(null)

  async function handleFile(file) {
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setLoading(true)

    const form = new FormData()
    form.append('file', file)
    form.append('patient_id', 'demo-patient')

    try {
      const { data } = await axios.post('/api/analyze', form)
      setResult(data)
      setHistory(prev => [
        ...prev,
        { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ...data },
      ])
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wound Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a photo of the diabetic foot to get an AI-powered analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 왼쪽: 업로드 + 미리보기 */}
        <div className="space-y-4">
          <UploadZone onFile={handleFile} />
          {preview && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={preview} alt="Uploaded wound" className="w-full object-cover max-h-72" />
            </div>
          )}
        </div>

        {/* 오른쪽: 결과 */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Analyzing with Gemma 4...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
              {error}
            </div>
          )}
          {result && !loading && <AnalysisResult result={result} />}
          {!loading && !result && !error && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              Upload a photo to see analysis
            </div>
          )}
        </div>
      </div>

      {history.length > 1 && <WoundChart data={history} />}
    </div>
  )
}
