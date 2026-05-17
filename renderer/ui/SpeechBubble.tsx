import { useEffect, useState } from 'react'
import { useStore } from '../store/state'

const bubbleBase = {
  position: 'absolute' as const,
  left: '50%',
  top: 86,
  maxWidth: 250,
  padding: '10px 12px',
  borderRadius: 16,
  background: 'rgba(24, 24, 34, 0.88)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#f5f5f7',
  fontSize: 12,
  lineHeight: 1.45,
  backdropFilter: 'blur(14px)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  zIndex: 120,
  pointerEvents: 'none' as const,
  transformOrigin: 'bottom center'
}

export default function SpeechBubble() {
  const bubble = useStore((s) => s.petBubble)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!bubble) {
      setVisible(false)
      return
    }

    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [bubble?.createdAt, bubble])

  if (!bubble) return null

  return (
    <div
      style={{
        ...bubbleBase,
        maxWidth: bubble.source === 'ai' ? 270 : bubbleBase.maxWidth,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(-50%, 0px) scale(1)' : 'translate(-50%, 10px) scale(0.96)',
        transition: 'opacity 220ms ease, transform 220ms ease'
      }}
    >
      <div>{bubble.text}</div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -8,
          width: 14,
          height: 14,
          background: 'rgba(24, 24, 34, 0.88)',
          borderRight: '1px solid rgba(255,255,255,0.14)',
          borderBottom: '1px solid rgba(255,255,255,0.14)',
          transform: 'translateX(-50%) rotate(45deg)'
        }}
      />
    </div>
  )
}
