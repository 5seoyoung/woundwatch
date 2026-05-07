import { useRef, useState } from 'react'
import TossEmoji from './TossEmoji'

export default function UploadZone({ onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files) {
    const file = files[0]
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      style={{
        margin: '16px 20px',
        border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 20,
        padding: '28px 20px',
        minHeight: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: dragging ? 'var(--primary-soft)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <TossEmoji emoji="📷" size={44} />
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>
        Upload a foot photo
      </div>
      <div style={{ fontSize: 13, color: 'var(--on-surface-2)', textAlign: 'center', lineHeight: 1.5 }}>
        Take weekly photos from the same angle<br />for the most accurate tracking
      </div>
      <div style={{
        background: 'var(--primary)', color: 'white', borderRadius: 100,
        padding: '10px 24px', fontSize: 13, fontWeight: 700, marginTop: 4,
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <TossEmoji emoji="📁" size={14} />
        Choose Photo
      </div>
    </div>
  )
}
