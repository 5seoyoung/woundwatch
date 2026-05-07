import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TossEmoji from '../components/TossEmoji'
import api from '../lib/api'

const STEPS = [
  {
    step: '1',
    emoji: '💾',
    title: 'Install Ollama',
    desc: 'Download and install Ollama for your platform.',
    code: '# macOS\nbrew install ollama\n\n# Linux\ncurl -fsSL https://ollama.com/install.sh | sh\n\n# Windows: download installer from ollama.com',
  },
  {
    step: '2',
    emoji: '🤖',
    title: 'Pull Gemma 4 model',
    desc: 'Download the Gemma 4 multimodal model (~3 GB).',
    code: 'ollama pull gemma4:4b',
  },
  {
    step: '3',
    emoji: '🖥️',
    title: 'Start the WoundWatch backend',
    desc: 'Run the FastAPI server locally.',
    code: 'cd backend\npip install -r requirements.txt\n\n# Set Ollama mode\nexport USE_OLLAMA=true\nexport OLLAMA_MODEL=gemma4:4b\n\nuvicorn app.main:app --reload --port 8000',
  },
  {
    step: '4',
    emoji: '🌐',
    title: 'Open the app',
    desc: 'Visit the demo app — analysis runs entirely on your device.',
    code: 'open http://localhost:5173/woundwatch/',
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} style={{
      background: copied ? 'var(--success-soft)' : 'var(--surface-dim)',
      border: '1px solid var(--border)', borderRadius: 8,
      padding: '4px 10px', fontSize: 11, fontWeight: 700,
      color: copied ? 'var(--success)' : 'var(--on-surface-2)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function Local() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // null | 'checking' | 'online' | 'offline'

  async function checkHealth() {
    setStatus('checking')
    try {
      await api.get('/api/health')
      setStatus('online')
    } catch {
      setStatus('offline')
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
        <button onClick={() => navigate('/profile')} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--surface-dim)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--on-surface)',
        }}>←</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)' }}>Run Locally with Ollama</div>
      </div>

      {/* ── Intro ── */}
      <div style={{ background: 'var(--surface)', padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--purple-soft)', borderRadius: 14,
          padding: '14px 16px', border: '1px solid rgba(155,123,232,0.2)',
        }}>
          <TossEmoji emoji="💻" size={22} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', marginBottom: 2 }}>
              100% Local — Zero Cloud
            </div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-2)', lineHeight: 1.5 }}>
              WoundWatch runs Gemma 4 entirely on your device via Ollama.
              Your medical images never leave your machine.
            </div>
          </div>
        </div>
      </div>

      {/* ── Steps ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Setup Guide
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map(({ step, emoji, title, desc, code }) => (
            <div key={step} style={{
              background: 'var(--surface)', borderRadius: 16,
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'var(--purple-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TossEmoji emoji={emoji} size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 2 }}>
                    {step}. {title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-2)' }}>{desc}</div>
                </div>
              </div>
              {/* Code block */}
              <div style={{ margin: '0 12px 12px', background: '#1E2330', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 0' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>TERMINAL</span>
                  <CopyButton text={code} />
                </div>
                <pre style={{
                  margin: 0, padding: '8px 14px 14px',
                  fontSize: 11, color: '#A8B8D0', fontFamily: 'monospace',
                  lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>{code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Health check ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          Check Connection
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--on-surface-2)', marginBottom: 12, lineHeight: 1.5 }}>
            After starting the backend, verify the connection:
          </div>
          <button onClick={checkHealth} style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'var(--primary)', color: 'white',
            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {status === 'checking' ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <TossEmoji emoji="🔌" size={15} />
            )}
            {status === 'checking' ? 'Checking...' : 'Check Backend Status'}
          </button>

          {status === 'online' && (
            <div style={{ marginTop: 10, background: 'var(--success-soft)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TossEmoji emoji="✅" size={16} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>Backend is online! Ready for real AI analysis.</span>
            </div>
          )}
          {status === 'offline' && (
            <div style={{ marginTop: 10, background: 'var(--danger-soft)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TossEmoji emoji="❌" size={16} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>Backend not reachable. Check step 3 above.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Spec ── */}
      <div style={{ padding: '20px 20px 32px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
            Requirements
          </div>
          {[
            { emoji: '🧠', label: 'Model',  value: 'Gemma 4 E4B (gemma4:4b) — ~3 GB' },
            { emoji: '💾', label: 'RAM',    value: '8 GB minimum, 16 GB recommended' },
            { emoji: '⚡', label: 'GPU',    value: 'Optional — CPU inference supported' },
            { emoji: '🖥️', label: 'OS',     value: 'macOS, Linux, Windows (WSL2)' },
          ].map(({ emoji, label, value }, i, arr) => (
            <div key={label} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <TossEmoji emoji={emoji} size={16} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-2)', width: 44 }}>{label}</span>
              <span style={{ fontSize: 12, color: 'var(--on-surface)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
