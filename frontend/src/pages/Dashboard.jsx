import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import UploadZone from '../components/UploadZone'
import AnalysisResult from '../components/AnalysisResult'
import TossEmoji from '../components/TossEmoji'

const SAMPLE_RESULT = {
  infection: true,
  ischemia: true,
  severity: 8.0,
  wound_area_cm2: 4.1,
  risk_level: 'HIGH',
  description: 'Moderate to severe diabetic foot ulcer observed. Erythema and exudate around the wound margins suggest possible bacterial colonization. Compromised blood flow also noted. Immediate medical attention is strongly recommended.',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

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
    } catch {
      setResult({ ...SAMPLE_RESULT, description: SAMPLE_RESULT.description + ' [Demo mode — connect backend for real analysis]' })
    } finally {
      setLoading(false)
    }
  }

  function loadSample() {
    setPreview(null)
    setResult(null)
    setError(null)
    setLoading(true)
    setTimeout(() => {
      setResult(SAMPLE_RESULT)
      setLoading(false)
    }, 1200)
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        background: 'var(--surface)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--surface-dim)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--on-surface)',
          }}
        >←</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)' }}>New Scan</div>
      </div>

      {/* ── Upload ── */}
      <UploadZone onFile={handleFile} />

      {/* ── Try Sample button ── */}
      {!result && !loading && !preview && (
        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--on-surface-3)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <button
            onClick={loadSample}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface-dim)',
              border: '1.5px solid var(--border)',
              borderRadius: 100, padding: '10px 24px',
              fontSize: 13, fontWeight: 700, color: 'var(--on-surface-2)',
              cursor: 'pointer', width: '100%', justifyContent: 'center',
            }}
          >
            <TossEmoji emoji="🔬" size={16} />
            Try with sample patient data
          </button>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && (
        <div style={{ margin: '0 20px 14px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={preview} alt="Uploaded photo" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          background: 'var(--surface)', borderRadius: 20, padding: '40px 20px',
          margin: '0 20px 14px', textAlign: 'center',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>
            Analyzing with Gemma 4...
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-3)' }}>
            Checking for infection, ischemia, and severity
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'var(--danger-soft)', borderRadius: 14, padding: '14px 16px',
          margin: '0 20px 14px', fontSize: 13, color: 'var(--danger)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <TossEmoji emoji="⚠️" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && !loading && <AnalysisResult result={result} />}

      {/* ── High Risk CTA ── */}
      {result?.risk_level === 'HIGH' && (
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--danger)', color: 'white', borderRadius: 14,
          padding: '15px', fontSize: 14, fontWeight: 700,
          margin: '0 20px 12px', width: 'calc(100% - 40px)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(217,48,37,0.3)',
        }}>
          <TossEmoji emoji="🏥" size={18} />
          Book a Clinic Visit Now
        </button>
      )}

      {/* ── Offline badge ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--purple-soft)', borderRadius: 12, padding: '12px 16px',
        margin: '0 20px 24px',
      }}>
        <TossEmoji emoji="💻" size={22} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>Works offline with Ollama</div>
          <div style={{ fontSize: 11, color: 'var(--on-surface-2)' }}>Your photos never leave your device</div>
        </div>
      </div>
    </div>
  )
}
