import { useState, useEffect, useRef } from 'react'
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
  confidence: 0.82,
  bbox: [0.18, 0.22, 0.76, 0.84],
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

const SAMPLE_CASES = [
  {
    id: 'case-a',
    label: 'Case A',
    sublabel: 'Mild DFU',
    desc: 'Small heel ulcer, early stage',
    dotColor: '#059669',
  },
  {
    id: 'case-b',
    label: 'Case B',
    sublabel: 'Moderate DFU',
    desc: 'Toe lesions, progression noted',
    dotColor: '#D97706',
  },
  {
    id: 'case-c',
    label: 'Case C',
    sublabel: 'Severe DFU',
    desc: 'Multiple necrotic ulcers',
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


const BBOX_COLORS = { HIGH: '#DC2626', MEDIUM: '#D97706', LOW: '#059669' }

function WoundOverlay({ src, result }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready || !result?.bbox) return
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    const W = img.clientWidth
    const H = img.clientHeight
    canvas.width = W
    canvas.height = H

    const [x0, y0, x1, y1] = result.bbox
    const px = x0 * W, py = y0 * H
    const bw = (x1 - x0) * W, bh = (y1 - y0) * H
    const color = BBOX_COLORS[result.risk_level] || BBOX_COLORS.LOW
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    // dim outside wound area
    ctx.fillStyle = 'rgba(0,0,0,0.38)'
    ctx.fillRect(0, 0, W, H)
    ctx.clearRect(px, py, bw, bh)

    // box border
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.strokeRect(px, py, bw, bh)

    // corner accents
    const cs = 14
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ;[[px,py,1,1],[px+bw,py,-1,1],[px,py+bh,1,-1],[px+bw,py+bh,-1,-1]].forEach(([cx,cy,dx,dy]) => {
      ctx.beginPath(); ctx.moveTo(cx+dx*cs, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy+dy*cs); ctx.stroke()
    })

    // label tag
    const label = 'AI Wound Detection'
    ctx.font = 'bold 10px -apple-system,BlinkMacSystemFont,sans-serif'
    const tw = ctx.measureText(label).width + 16
    const lx = px
    const ly = py > 26 ? py - 26 : py + bh + 6
    ctx.fillStyle = color
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(lx, ly, tw, 20, 4)
    else ctx.rect(lx, ly, tw, 20)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText(label, lx + 8, ly + 14)

    // infection marker
    if (result.infection) {
      const mx = px + bw * 0.22, my = py + bh * 0.38
      ctx.fillStyle = 'rgba(220,38,38,0.3)'; ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#DC2626'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fill()
      ctx.font = 'bold 9.5px -apple-system,sans-serif'; ctx.fillStyle = '#fff'
      ctx.fillText('Infection', mx + 14, my + 4)
    }

    // ischemia marker
    if (result.ischemia) {
      const mx = px + bw * 0.62, my = py + bh * 0.65
      ctx.fillStyle = 'rgba(124,58,237,0.3)'; ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#7C3AED'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI*2); ctx.fill()
      ctx.font = 'bold 9.5px -apple-system,sans-serif'; ctx.fillStyle = '#fff'
      ctx.fillText('Ischemia', mx + 14, my + 4)
    }

    // confidence badge bottom-right of box
    const conf = result.confidence != null ? Math.round(result.confidence * 100) : null
    if (conf != null) {
      const confLabel = `${conf}% conf.`
      ctx.font = 'bold 9.5px -apple-system,sans-serif'
      const cw = ctx.measureText(confLabel).width + 12
      const bx = px + bw - cw - 2
      const by = py + bh + 5
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(bx, by, cw, 17, 3)
      else ctx.rect(bx, by, cw, 17)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText(confLabel, bx + 6, by + 12)
    }
  }, [ready, result])

  return (
    <div style={{ position: 'relative' }}>
      <img
        ref={imgRef}
        src={src}
        alt="Wound photo"
        onLoad={() => setReady(true)}
        style={{ width: '100%', display: 'block' }}
      />
      {result?.bbox && ready && (
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      )}
    </div>
  )
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

    const resp = await fetch(`${import.meta.env.BASE_URL}samples/${caseItem.id}.jpg`)
    const blob = await resp.blob()
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
        background: 'var(--surface)', padding: '12px 20px',
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
            minWidth: 44, minHeight: 44, flexShrink: 0,
          }}
        >←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="WoundWatch"
            style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              WoundWatch
            </div>
            <div style={{ fontSize: 10, color: 'var(--on-surface-3)', fontWeight: 500 }}>New Scan</div>
          </div>
        </div>
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
                <img
                  src={`${import.meta.env.BASE_URL}samples/${c.id}.jpg`}
                  alt={c.sublabel}
                  style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
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
          <WoundOverlay src={preview} result={result} />
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

      {/* ── Privacy note ── */}
      {!result && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-dim)', borderRadius: 12, padding: '12px 16px',
          margin: '0 20px 24px', border: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-2)' }}>Powered by Gemma 4 · Private</div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-3)' }}>Images are used only for analysis and never shared</div>
          </div>
        </div>
      )}
    </div>
  )
}
