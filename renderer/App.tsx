import React, { useEffect, useRef, useState } from 'react'
import ChatPanel from './ui/ChatPanel'
import { useStore } from './store/state'

function PetView() {
  const [pixiOk, setPixiOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('[PetView] initializing...')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('[PetView] no canvas element')
      setError('no canvas')
      return
    }

    canvas.width = 400
    canvas.height = 500
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    import('./pet/engine').then(({ PetEngine }) => {
      try {
        const engine = new PetEngine(canvas)
        engine.init().then(() => {
          console.log('[PetView] PixiJS OK')
          setPixiOk(true)
        }).catch((e: any) => {
          console.error('[PetView] engine.init failed:', e)
          setError(`engine: ${e.message}`)
        })
      } catch (e: any) {
        console.error('[PetView] engine construct failed:', e)
        setError(`construct: ${e.message}`)
      }
    }).catch((e: any) => {
      console.error('[PetView] import failed:', e)
      setError(`import: ${e.message}`)
    })
  }, [])

  return (
    <div ref={bodyRef} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {!pixiOk && (
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          boxShadow: '0 0 40px rgba(124,58,237,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2, pointerEvents: 'none',
          animation: 'pet-breathe 3s ease-in-out infinite'
        }}>
          <span style={{ fontSize: 72 }}>🐱</span>
        </div>
      )}

      {error && (
        <div style={{ zIndex: 2, color: '#f87171', fontSize: 10, marginTop: 8 }}>
          PixiJS: {error}
        </div>
      )}

      <style>{`
        @keyframes pet-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function InteractionLayer({ onPetState }: { onPetState: (s: string) => void }) {
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0 })
  const { toggleChat } = useStore()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const onDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY }
    }
  }
  const onMove = (e: React.MouseEvent) => {
    const d = dragRef.current
    if (d.dragging) {
      ;(window as any).electronAPI?.moveWindow(e.clientX - d.sx, e.clientY - d.sy)
      d.sx = e.clientX
      d.sy = e.clientY
    }
  }
  const onUp = () => { dragRef.current.dragging = false }
  const onClick = () => toggleChat()
  const onCtx = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}
         onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
         onClick={onClick} onContextMenu={onCtx}>
      {menu && (
        <div style={{
          position: 'fixed', left: menu.x, top: menu.y, zIndex: 999,
          background: 'rgba(30,30,40,0.95)', borderRadius: 8, padding: '4px 0',
          border: '1px solid rgba(100,100,120,0.5)', minWidth: 150,
          backdropFilter: 'blur(12px)', fontSize: 12, color: '#e0e0e0'
        }} onClick={() => setMenu(null)}>
           {([
            ['对话', toggleChat],
            ['切换模式', () => {}],
            ['设置', () => {}],
            ['退出', () => {}]
          ] as [string, () => void][]).map(([label, fn], i) => (
            <div key={i} style={{
              padding: '6px 14px', cursor: 'pointer',
            }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
               onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
               onClick={() => fn()}>{label}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const chatVisible = useStore(s => s.chatVisible)
  const setPetState = useStore(s => s.setPetState)

  useEffect(() => {
    console.log('[App] mounted')
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <PetView />
      <InteractionLayer onPetState={setPetState} />
      {chatVisible && <ChatPanel />}
    </div>
  )
}
