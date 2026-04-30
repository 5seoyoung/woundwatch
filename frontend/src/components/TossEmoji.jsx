import { useState } from 'react'

// Tossface → Twemoji → text emoji fallback chain
const TOSSFACE = 'https://static.toss.im/tossface/cdn/tossface'
const TWEMOJI  = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg'

function toCodepoint(emoji, keepFe0f) {
  return [...emoji]
    .map(c => c.codePointAt(0).toString(16).toLowerCase())
    .filter(cp => {
      const n = parseInt(cp, 16)
      if (n <= 0x20) return false
      if (!keepFe0f && n === 0xfe0f) return false
      return true
    })
    .join('-')
}

export default function TossEmoji({ emoji, size = 22, style = {} }) {
  const [idx, setIdx] = useState(0)

  const srcs = [
    `${TOSSFACE}/${toCodepoint(emoji, true)}.svg`,
    `${TWEMOJI}/${toCodepoint(emoji, false)}.svg`,
  ]

  if (idx >= srcs.length) {
    return (
      <span style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-block', ...style }}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={srcs[idx]}
      alt={emoji}
      width={size}
      height={size}
      draggable={false}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      onError={() => setIdx(i => i + 1)}
    />
  )
}
