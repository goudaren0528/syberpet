import React, { useEffect, useRef, useState, useCallback } from 'react'
import ChatPanel from './ui/ChatPanel'
import { useStore } from './store/state'
import { PetEngine } from './pet/engine'

export default function App() {
  const chatVisible = useStore(s => s.chatVisible)
  const streaming = useStore(s => s.streaming)
  const petState = useStore(s => s.petState)
  const setPetState = useStore(s => s.setPetState)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PetEngine | null>(null)
  const winRef = useRef<HTMLDivElement>(null)

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0 })
  const toggleChat = useStore(s => s.toggleChat)

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 400
    canvas.height = 500
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    const engine = new PetEngine(canvas)
    engine.init().then(() => {
      engineRef.current = engine
      console.log('[App] PetEngine ready')
    }).catch(e => console.error('[App] engine init failed:', e))

    return () => { engine.destroy() }
  }, [])

  // Wire petState → engine.setAnimation
  useEffect(() => {
    engineRef.current?.setAnimation(petState)
  }, [petState])

  // Wire streaming → talking state
  const prevStreaming = useRef(false)
  useEffect(() => {
    if (streaming && !prevStreaming.current) {
      setPetState('talking')
    }
    if (!streaming && prevStreaming.current) {
      setPetState('idle')
    }
    prevStreaming.current = streaming
  }, [streaming, setPetState])

  // Mouse tracking for eye follow
  const onMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current
    if (d.dragging) {
      ;(window as any).electronAPI?.moveWindow(e.clientX - d.sx, e.clientY - d.sy)
      d.sx = e.clientX
      d.sy = e.clientY
    }
    if (winRef.current) {
      const rect = winRef.current.getBoundingClientRect()
      engineRef.current?.trackMouse(e.clientX - rect.left, e.clientY - rect.top)
    }
  }, [])

  // Mouse down and up for drag
  const onDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY }
    }
  }, [])

  const onUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  // Click → bounce then open chat
  const onClick = useCallback(() => {
    engineRef.current?.bounce()
    setTimeout(() => toggleChat(), 200)
  }, [toggleChat])

  const onCtx = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // Streaming chunks → keep talking
  useEffect(() => {
    const api = (window as any).electronAPI
    if (api?.onAgentStream) {
      const origStream = api.onAgentStream
      api.onAgentStream = (chunk: string) => {
        engineRef.current?.updateStreaming(chunk)
        origStream(chunk)
      }
    }
    if (api?.onAgentStreamEnd) {
      const origEnd = api.onAgentStreamEnd
      api.onAgentStreamEnd = () => {
        engineRef.current?.endStreaming()
        origEnd()
      }
    }
  }, [])

  return (
    <div ref={winRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
      onClick={onClick} onContextMenu={onCtx}>

      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* Debug overlay */}
      <div style={{
        position: 'absolute', top: 4, left: 6, zIndex: 999,
        fontSize: 9, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        {petState}
      </div>

      {/* Context menu */}
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
            <div key={i} style={{ padding: '6px 14px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => fn()}>{label}</div>
          ))}
        </div>
      )}

      {chatVisible && <ChatPanel />}
    </div>
  )
}
