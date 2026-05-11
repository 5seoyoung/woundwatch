import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import UploadZone from '../components/UploadZone'
import CameraCapture from '../components/CameraCapture'
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

const LOADING_STEPS = [
  { text: 'Preprocessing image...' },
  { text: 'Detecting wound region...' },
  { text: 'Running Gemma 4 analysis...' },
  { text: 'Checking infection markers...' },
  { text: 'Analyzing blood flow...' },
  { text: 'Computing risk score...' },
]

// Sample cases — each generates a distinct canvas image sent to the real API.
// Different brightness levels produce different demo-mode results.
const SAMPLE_CASES = [
  {
    id: 'mild',
    label: 'Case A',
    sublabel: 'Mild DFU',
    desc: 'Small ulcer, early stage',
    colors: ['#F5DEB3', '#E8C8A0', '#DEB887'],
    dotColor: '#059669',
  },
  {
    id: 'moderate',
    label: 'Case B',
    sublabel: 'Moderate DFU',
    desc: 'Progressive wound, ischemia signs',
    colors: ['#C0705A', '#A85040', '#8B3A30'],
    dotColor: '#D97706',
  },
  {
    id: 'severe',
    label: 'Case C',
    sublabel: 'Severe DFU',
    desc: 'Advanced ulcer, infection present',
    colors: ['#5C2A20', '#3E1A10', '#2A0E08'],
    dotColor: '#DC2626',
  },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']

const PHOTO_GUIDE = {
  good: [
    '30–40 cm distance from the foot',
    'Wound centered in frame',
    'Bright natural or fluorescent light',
    'Same location and angle each week',
  ],
  bad: [
    'Dark or shadowed environment',
    'Too close or too far',
    'Blurry or shaky photo',
    'Wound partially cut off',
  ],
}

function generateCaseImage(colors) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 224
    canvas.height = 224
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(112, 112, 20, 112, 112, 112)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.5, colors[1])
    grad.addColorStop(1, colors[2])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 224, 224)
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
  })
}

function PhotoGuideContent() {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Do
        </div>
        {PHOTO_GUIDE.good.map(t => (
          <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '2px 0', paddingLeft: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: 'var(--success)' }}>·</span>{t}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Avoid
        </div>
        {PHOTO_GUIDE.bad.map(t => (
          <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '2px 0', paddingLeft: 12, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: 'var(--danger)' }}>·</span>{t}
          </div>
        ))}
      </div>
    </>
  )
}

function CameraGuideOverlay() {
  return (
    <div style={{ margin: '12px 20px 0', background: 'var(--surface)', borderRadius: 16, padding: '18px 16px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 14 }}>
        Photo guide
      </div>
      <PhotoGuideContent />
      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--primary)', textAlign: 'center', opacity: 0.7 }}>
        Camera launching...
      </div>
    </div>
  )
}

export default function Dashboard({ patient }) {
  const navigate = useNavigate()
  const [mode,         setMode]         = useState('upload')
  const [preview,      setPreview]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [loadingStep,  setLoadingStep]  = useState(0)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)
  const [guideOpen,    setGuideOpen]    = useState(false)
  const [cameraGuide,  setCameraGuide]  = useState(false)

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    if (loadingStep >= LOADING_STEPS.length - 1) return
    const t = setTimeout(() => setLoadingStep(s => s + 1), 1500)
    return () => clearTimeout(t)
  }, [loading, loadingStep])

  useEffect(() => {
    if (!cameraGuide) return
    const t = setTimeout(() => { setCameraGuide(false); setMode('camera') }, 3000)
    return () => clearTimeout(t)
  }, [cameraGuide])

  async function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Supported formats: JPG, PNG, HEIC, WEBP')
      return
    }
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setLoading(true)
    setLoadingStep(0)

    const form = new FormData()
    form.append('file', file)
    form.append('patient_id', patient?.patient_id ?? 'default')

    try {
      const { data } = await api.post('/api/analyze', form)
      setResult(data)
    } catch {
      setResult({ ...SAMPLE_RESULT, description: SAMPLE_RESULT.description + ' [Demo mode — connect backend for real analysis]' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSampleCase(caseItem) {
    setResult(null)
    setError(null)
    setLoading(true)
    setLoadingStep(0)
    setPreview(null)

    const blob = await generateCaseImage(caseItem.colors)
    const file = new File([blob], `${caseItem.id}.jpg`, { type: 'image/jpeg' })
    setPreview(URL.createObjectURL(blob))

    const form = new FormData()
    form.append('file', file)
    form.append('patient_id', patient?.patient_id ?? 'default')

    try {
      const { data } = await api.post('/api/analyze', form)
      setResult(data)
    } catch {
      setResult({ ...SAMPLE_RESULT, description: SAMPLE_RESULT.description + ' [Demo mode]' })
    } finally {
      setLoading(false)
    }
  }

  function handleModeClick(key) {
    if (key === mode) return
    if (key === 'camera') {
      setMode('upload')
      setCameraGuide(true)
    } else {
      setMode(key)
      setCameraGuide(false)
    }
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
            minWidth: 44, minHeight: 44,
          }}
        >←</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)' }}>New Scan</div>
      </div>

      {/* ── Mode toggle ── */}
      {!result && !loading && !cameraGuide && (
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8 }}>
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'camera', label: 'Camera' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleModeClick(key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: mode === key ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: mode === key ? 'var(--primary-soft)' : 'var(--surface)',
                color: mode === key ? 'var(--primary)' : 'var(--on-surface-2)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s', minHeight: 44,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Camera guide overlay ── */}
      {cameraGuide && <CameraGuideOverlay />}

      {/* ── Camera ── */}
      {!result && !loading && !cameraGuide && mode === 'camera' && (
        <div style={{ marginTop: 12 }}>
          <CameraCapture onCapture={file => { setMode('upload'); handleFile(file) }} onClose={() => setMode('upload')} />
        </div>
      )}

      {/* ── Photo guide toggle ── */}
      {!result && !loading && !cameraGuide && mode === 'upload' && (
        <div style={{ margin: '12px 20px 0' }}>
          <button
            onClick={() => setGuideOpen(g => !g)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--on-surface-2)', cursor: 'pointer',
            }}
          >
            Photo guide
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>{guideOpen ? '▲' : '▼'}</span>
          </button>
          {guideOpen && (
            <div style={{ background: 'var(--surface)', borderRadius: '0 0 12px 12px', padding: '12px 14px 14px', border: '1px solid var(--border)', borderTop: 'none' }}>
              <PhotoGuideContent />
            </div>
          )}
        </div>
      )}

      {/* ── Upload zone ── */}
      {!result && !loading && !cameraGuide && mode === 'upload' && <UploadZone onFile={handleFile} />}

      {/* ── Sample cases ── */}
      {!result && !loading && !cameraGuide && !preview && mode === 'upload' && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--on-surface-3)', fontWeight: 500 }}>or try a sample case</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {SAMPLE_CASES.map(c => (
              <button
                key={c.id}
                onClick={() => handleSampleCase(c)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '14px 10px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: `radial-gradient(circle, ${c.colors[0]}, ${c.colors[2]})`,
                  flexShrink: 0,
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.dotColor }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--on-surface-2)', fontWeight: 600 }}>{c.sublabel}</div>
                  <div style={{ fontSize: 10, color: 'var(--on-surface-3)', marginTop: 2, lineHeight: 1.3 }}>{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && !loading && (
        <div style={{ margin: '0 20px 14px', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={preview} alt="Wound photo" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          background: 'var(--surface)', borderRadius: 20, padding: '40px 20px',
          margin: '16px 20px', textAlign: 'center',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
            {LOADING_STEPS[loadingStep]?.text}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '14px 0 12px' }}>
            {LOADING_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === loadingStep ? 16 : 6,
                height: 6, borderRadius: 100,
                background: i <= loadingStep ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--on-surface-3)' }}>
            Powered by Gemma 4
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'var(--danger-soft)', borderRadius: 14, padding: '14px 16px',
          margin: '0 20px 14px', fontSize: 13, color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && !loading && <AnalysisResult result={result} />}

      {/* ── High Risk CTA ── */}
      {result?.risk_level === 'HIGH' && (
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#DC2626', color: 'white', borderRadius: 14,
          padding: '15px', fontSize: 14, fontWeight: 700,
          margin: '0 20px 12px', width: 'calc(100% - 40px)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
          minHeight: 44,
        }}>
          Book a Clinic Visit Now
        </button>
      )}

      {/* ── Offline note ── */}
      {!result && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 16px',
          margin: '0 20px 24px', border: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-2)' }}>Works offline with Ollama</div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-3)' }}>Your photos never leave your device</div>
          </div>
        </div>
      )}
    </div>
  )
}
