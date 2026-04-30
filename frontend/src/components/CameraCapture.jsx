import { useRef, useState, useEffect } from 'react'
import TossEmoji from './TossEmoji'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const [facing, setFacing]   = useState('environment')
  const [ready, setReady]     = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    startStream()
    return () => killStream()
  }, [facing]) // eslint-disable-line

  async function startStream() {
    killStream()
    setReady(false)
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
      })
      streamRef.current = s
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  function killStream() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function capture() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' })
      killStream()
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div style={{ margin: '0 20px 16px', position: 'relative' }}>
      {error ? (
        <div style={{
          background: 'var(--danger-soft)', borderRadius: 16, padding: 24,
          textAlign: 'center', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
          <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>
            Camera unavailable
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-2)', marginBottom: 16, lineHeight: 1.5 }}>
            {error}
          </div>
          <button onClick={onClose} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 100, padding: '8px 20px', fontSize: 13, fontWeight: 600,
            color: 'var(--on-surface-2)', cursor: 'pointer',
          }}>Use Photo Upload Instead</button>
        </div>
      ) : (
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: '#0A0A0F',
          position: 'relative',
          aspectRatio: '3/4',
        }}>
          {/* Live feed */}
          <video
            ref={videoRef}
            autoPlay playsInline muted
            onLoadedMetadata={() => setReady(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Alignment guide */}
          {ready && (
            <>
              {/* Corner brackets */}
              {[
                { top: '12%', left: '12%',  borderTop: '2px solid rgba(255,255,255,0.7)', borderLeft: '2px solid rgba(255,255,255,0.7)', borderRadius: '4px 0 0 0' },
                { top: '12%', right: '12%', borderTop: '2px solid rgba(255,255,255,0.7)', borderRight: '2px solid rgba(255,255,255,0.7)', borderRadius: '0 4px 0 0' },
                { bottom: '22%', left: '12%',  borderBottom: '2px solid rgba(255,255,255,0.7)', borderLeft: '2px solid rgba(255,255,255,0.7)', borderRadius: '0 0 0 4px' },
                { bottom: '22%', right: '12%', borderBottom: '2px solid rgba(255,255,255,0.7)', borderRight: '2px solid rgba(255,255,255,0.7)', borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
              ))}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -62%)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 11, fontWeight: 500, lineHeight: 1.4,
                pointerEvents: 'none',
              }}>
                Align foot within frame
              </div>
            </>
          )}

          {/* Loading overlay */}
          {!ready && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 28, height: 28,
                border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Starting camera…</span>
            </div>
          )}

          {/* Bottom controls */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 24px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36,
          }}>
            {/* Close */}
            <button onClick={() => { killStream(); onClose() }} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'white', fontSize: 17, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>

            {/* Shutter */}
            <button
              onClick={capture}
              disabled={!ready}
              style={{
                width: 68, height: 68, borderRadius: '50%',
                background: ready ? 'white' : 'rgba(255,255,255,0.4)',
                border: '4px solid rgba(255,255,255,0.6)',
                cursor: ready ? 'pointer' : 'default',
                boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            />

            {/* Flip camera */}
            <button onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'white', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TossEmoji emoji="🔄" size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
