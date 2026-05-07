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
  { emoji: '📸', text: '이미지 전처리 중...' },
  { emoji: '🔍', text: '궤양 영역 감지 중...' },
  { emoji: '🧠', text: 'Gemma 4 AI 분석 중...' },
  { emoji: '🦠', text: '감염 징후 확인 중...' },
  { emoji: '🩸', text: '혈류 상태 분석 중...' },
  { emoji: '📊', text: '위험도 점수 계산 중...' },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']

const PHOTO_GUIDE = {
  good: [
    '발에서 30~40cm 거리 유지',
    '상처가 화면 중앙에 오도록',
    '밝은 자연광 또는 형광등 아래',
    '매주 같은 장소, 같은 각도',
  ],
  bad: [
    '어두운 환경',
    '너무 가깝거나 먼 거리',
    '흔들린 사진',
    '상처가 잘린 사진',
  ],
}

function CameraGuideOverlay() {
  return (
    <div style={{ margin: '12px 20px 0', background: 'var(--surface)', borderRadius: 16, padding: '18px 16px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 14 }}>
        📸 정확한 촬영 방법
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>✅ 이렇게 찍으세요</div>
        {PHOTO_GUIDE.good.map(t => (
          <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '3px 0', paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>·</span>{t}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>❌ 이런 사진은 정확도가 낮아요</div>
        {PHOTO_GUIDE.bad.map(t => (
          <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '3px 0', paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>·</span>{t}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--primary)', textAlign: 'center', opacity: 0.7 }}>
        잠시 후 카메라가 실행됩니다...
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

  // Auto-advance loading steps
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    if (loadingStep >= LOADING_STEPS.length - 1) return
    const t = setTimeout(() => setLoadingStep(s => s + 1), 1500)
    return () => clearTimeout(t)
  }, [loading, loadingStep])

  // Camera guide: show for 3s then launch camera
  useEffect(() => {
    if (!cameraGuide) return
    const t = setTimeout(() => { setCameraGuide(false); setMode('camera') }, 3000)
    return () => clearTimeout(t)
  }, [cameraGuide])

  async function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('JPG, PNG, HEIC 형식만 지원됩니다.')
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

  function loadSample() {
    setPreview(null)
    setResult(null)
    setError(null)
    setLoading(true)
    setLoadingStep(0)
    setTimeout(() => {
      setResult(SAMPLE_RESULT)
      setLoading(false)
    }, 1200 + LOADING_STEPS.length * 150)
  }

  function handleModeClick(key) {
    if (key === mode) return
    if (key === 'camera') {
      setMode('upload')  // temporarily back to upload while guide shows
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
            { key: 'upload', emoji: '📁', label: 'Upload' },
            { key: 'camera', emoji: '📷', label: 'Camera' },
          ].map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => handleModeClick(key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 0', borderRadius: 12,
                border: mode === key ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: mode === key ? 'var(--primary-soft)' : 'var(--surface)',
                color: mode === key ? 'var(--primary)' : 'var(--on-surface-2)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                minHeight: 44,
              }}
            >
              <TossEmoji emoji={emoji} size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Camera guide overlay (3s) ── */}
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
            <TossEmoji emoji="📸" size={15} />
            정확한 촬영 방법 보기
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>{guideOpen ? '▲' : '▼'}</span>
          </button>
          {guideOpen && (
            <div style={{ background: 'var(--surface)', borderRadius: '0 0 12px 12px', padding: '12px 14px 14px', border: '1px solid var(--border)', borderTop: 'none' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>✅ 이렇게 찍으세요</div>
                {PHOTO_GUIDE.good.map(t => (
                  <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '2px 0', paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--success)' }}>·</span>{t}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>❌ 이런 사진은 정확도가 낮아요</div>
                {PHOTO_GUIDE.bad.map(t => (
                  <div key={t} style={{ fontSize: 12, color: 'var(--on-surface)', padding: '2px 0', paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--danger)' }}>·</span>{t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Upload ── */}
      {!result && !loading && !cameraGuide && mode === 'upload' && <UploadZone onFile={handleFile} />}

      {/* ── Try Sample button ── */}
      {!result && !loading && !cameraGuide && !preview && mode === 'upload' && (
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
              minHeight: 44,
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
            margin: '0 auto 20px',
          }} />
          <div style={{ fontSize: 22, marginBottom: 8 }}>
            {LOADING_STEPS[loadingStep]?.emoji}
          </div>
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
            Powered by Gemma 4 · On-device analysis
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
          minHeight: 44,
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
