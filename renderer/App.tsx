import React, { useEffect, useRef, useState, useCallback } from 'react'
import InputBar from './ui/InputBar'
import SpeechBubble from './ui/SpeechBubble'
import PetNeedsHUD from './ui/PetNeedsHUD'
import HistoryPanel from './ui/HistoryPanel'
import { pickPetBubble } from './pet/phrases'
import { useStore } from './store/state'
import { PetEngine } from './pet/engine'

const DRAG_THRESHOLD = 5
const PET_STATE_SAVE_DEBOUNCE_MS = 1500

export default function App() {
  const streaming = useStore(s => s.streaming)
  const dialoguePhase = useStore(s => s.dialoguePhase)
  const petState = useStore(s => s.petState)
  const setPetState = useStore(s => s.setPetState)
  const apiKeyConfigured = useStore(s => s.apiKeyConfigured)
  const petBubble = useStore(s => s.petBubble)
  const petNeeds = useStore(s => s.petNeeds)
  const showPetBubble = useStore(s => s.showPetBubble)
  const clearPetBubble = useStore(s => s.clearPetBubble)
  const hydratePetNeeds = useStore(s => s.hydratePetNeeds)
  const tickPetNeeds = useStore(s => s.tickPetNeeds)
  const improveMood = useStore(s => s.improveMood)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PetEngine | null>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const bubbleTimerRef = useRef<number | null>(null)
  const speechScheduleRef = useRef<number | null>(null)
  const needsReminderCooldownRef = useRef(0)
  const petStateHydratedRef = useRef(false)

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef({
    dragging: false,
    didDrag: false,
    sx: 0,
    sy: 0
  })

  const toggleSettings = useStore(s => s.toggleSettings)
  const toggleChat = useStore(s => s.toggleChat)
  const showSettings = useStore(s => s.showSettings)
  const chatVisible = useStore(s => s.chatVisible)

  const clearDragState = useCallback(() => {
    dragRef.current = {
      dragging: false,
      didDrag: false,
      sx: 0,
      sy: 0
    }
  }, [])

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 400
    canvas.height = 500
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    let disposed = false
    const engine = new PetEngine(canvas)
    engine.init().then((ready) => {
      if (!ready || disposed) return
      engineRef.current = engine
      console.log('[App] PetEngine ready')
    }).catch(e => console.error('[App] engine init failed:', e))

    return () => {
      disposed = true
      if (engineRef.current === engine) {
        engineRef.current = null
      }
      engine.destroy()
    }
  }, [])

  useEffect(() => {
    const api = window.electronAPI
    api?.loadPetState?.()
      .then((saved) => {
        if (saved) hydratePetNeeds(saved)
      })
      .catch((error) => console.error('[App] loadPetState failed:', error))
      .finally(() => {
        petStateHydratedRef.current = true
      })
  }, [hydratePetNeeds])

  // Wire petState → engine.setAnimation
  useEffect(() => {
    engineRef.current?.setAnimation(petState)
  }, [petState])

  // Wire dialogue phase → pet animation state
  useEffect(() => {
    if (dialoguePhase === 'thinking') {
      setPetState('thinking')
      return
    }

    if (dialoguePhase === 'streaming') {
      setPetState('talking')
      return
    }

    setPetState(petNeeds.energy < 25 ? 'sleeping' : 'idle')
  }, [dialoguePhase, petNeeds.energy, setPetState])

  useEffect(() => {
    const onWindowMouseUp = () => {
      clearDragState()
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [clearDragState])

  // Mouse tracking for eye follow + drag
  const onMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current
    if (d.dragging) {
      const dx = e.screenX - d.sx
      const dy = e.screenY - d.sy
      if (!d.didDrag && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        d.didDrag = true
      }
      if (d.didDrag) {
        window.electronAPI?.moveWindow(dx, dy)
      }
      d.sx = e.screenX
      d.sy = e.screenY
    }
    if (winRef.current) {
      const rect = winRef.current.getBoundingClientRect()
      engineRef.current?.trackMouse(e.clientX - rect.left, e.clientY - rect.top)
    }
  }, [])

  const onDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = {
      dragging: true,
      didDrag: false,
      sx: e.screenX,
      sy: e.screenY
    }
  }, [])

  const onUp = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current.dragging = false
  }, [])

  const onClick = useCallback(() => {
    if (dragRef.current.didDrag) {
      dragRef.current.didDrag = false
      return
    }

    engineRef.current?.bounce()
    improveMood(2)
  }, [improveMood])

  const onCtx = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const openHistory = useCallback(() => {
    if (!chatVisible) {
      toggleChat()
    }
    if (showSettings) {
      toggleSettings()
    }
    setMenu(null)
  }, [chatVisible, showSettings, toggleChat, toggleSettings])

  const closeMenu = useCallback(() => {
    setMenu(null)
  }, [])

  const openSettings = useCallback(() => {
    if (!showSettings) {
      toggleSettings()
    }
    setMenu(null)
  }, [showSettings, toggleSettings])

  const closeHistory = useCallback(() => {
    if (chatVisible) {
      toggleChat()
    }
  }, [chatVisible, toggleChat])

  useEffect(() => {
    if (!chatVisible && showSettings) {
      toggleSettings()
    }
  }, [chatVisible, showSettings, toggleSettings])

  useEffect(() => {
    if (!chatVisible) return

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHistory()
      }
    }

    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [chatVisible, closeHistory])

  useEffect(() => {
    if (!menu) return

    const onWindowPointerDown = () => {
      closeMenu()
    }

    window.addEventListener('mousedown', onWindowPointerDown)
    return () => window.removeEventListener('mousedown', onWindowPointerDown)
  }, [menu, closeMenu])

  const menuItems: [string, () => void][] = [
    ['对话记录', openHistory],
    ['设置', openSettings],
    ['退出', () => { closeMenu(); void window.electronAPI?.quitApp?.() }]
  ]

  const stopMenuEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const onMenuClick = useCallback((action: () => void) => {
    action()
  }, [])

  const canRenderHistory = chatVisible && !showSettings

  // Streaming chunks → keep talking
  useEffect(() => {
    const api = window.electronAPI
    const offStream = api?.onAgentStream?.((chunk: string) => {
      engineRef.current?.updateStreaming(chunk)
    })
    const offStreamEnd = api?.onAgentStreamEnd?.(() => {
      engineRef.current?.endStreaming()
    })

    return () => {
      offStream?.()
      offStreamEnd?.()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      tickPetNeeds(Date.now())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [tickPetNeeds])

  useEffect(() => {
    if (petNeeds.energy < 25 && !streaming) {
      setPetState('sleeping')
      return
    }
    if (petState === 'sleeping' && petNeeds.energy > 45 && !streaming) {
      setPetState('idle')
    }
  }, [petNeeds.energy, petState, setPetState, streaming])

  useEffect(() => {
    if (!petStateHydratedRef.current) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)

    saveTimerRef.current = window.setTimeout(() => {
      window.electronAPI?.savePetState?.(petNeeds)
        .catch((error) => console.error('[App] savePetState failed:', error))
    }, PET_STATE_SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [petNeeds])

  useEffect(() => {
    if (!petBubble) return

    const baseDuration = petBubble.source === 'ai' ? 8000 : 4200
    const extraDuration = petBubble.source === 'ai'
      ? Math.min(4000, Math.max(0, petBubble.text.length - 24) * 90)
      : 0

    if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = window.setTimeout(() => {
      clearPetBubble()
    }, baseDuration + extraDuration)

    return () => {
      if (bubbleTimerRef.current) {
        window.clearTimeout(bubbleTimerRef.current)
      }
    }
  }, [petBubble, clearPetBubble])

  useEffect(() => {
    let cancelled = false

    const schedule = () => {
      const baseDelay = 30000 + Math.floor(Math.random() * 60000)
      const moodBoost = petNeeds.mood > 75 ? -10000 : 0
      const delay = Math.max(18000, baseDelay + moodBoost)

      speechScheduleRef.current = window.setTimeout(async () => {
        if (cancelled) return

        if (!streaming && !petBubble) {
          const fallback = pickPetBubble(petNeeds)
          let text = fallback.text
          let source = fallback.source

          if (apiKeyConfigured && Math.random() < 0.2) {
            try {
              const aiBubble = await window.electronAPI?.generatePetBubble?.()
              if (aiBubble?.text?.trim()) {
                text = aiBubble.text.trim()
                source = 'ai'
              }
            } catch (error) {
              console.error('[App] generatePetBubble failed:', error)
            }
          }

          showPetBubble(text, source)
        }

        schedule()
      }, delay)
    }

    schedule()

    return () => {
      cancelled = true
      if (speechScheduleRef.current) {
        window.clearTimeout(speechScheduleRef.current)
      }
    }
  }, [apiKeyConfigured, petBubble, petNeeds, showPetBubble, streaming])

  useEffect(() => {
    if (streaming || petBubble) return

    const now = Date.now()
    if (now - needsReminderCooldownRef.current < 45000) return

    if (petNeeds.hunger < 30) {
      needsReminderCooldownRef.current = now
      showPetBubble(pickPetBubble(petNeeds).text, 'need')
      return
    }

    if (petNeeds.energy < 25) {
      needsReminderCooldownRef.current = now
      showPetBubble(pickPetBubble(petNeeds).text, 'need')
    }
  }, [petNeeds.hunger, petNeeds.energy, petNeeds, petBubble, showPetBubble, streaming])

  return (
    <div
      ref={winRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onClick={onClick}
      onContextMenu={onCtx}
    >
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      <PetNeedsHUD />
      <SpeechBubble />
      {canRenderHistory && <HistoryPanel />}

      <div style={{
        position: 'absolute', top: 4, left: 156, zIndex: 999,
        fontSize: 9, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        {petState}
      </div>

      {menu && (
        <div
          style={{
            position: 'fixed', left: menu.x, top: menu.y, zIndex: 999,
            background: 'rgba(30,30,40,0.95)', borderRadius: 8, padding: '4px 0',
            border: '1px solid rgba(100,100,120,0.5)', minWidth: 150,
            backdropFilter: 'blur(12px)', fontSize: 12, color: '#e0e0e0'
          }}
          onMouseDown={stopMenuEvent}
          onClick={stopMenuEvent}
        >
          {menuItems.map(([label, fn], i) => (
            <div
              key={i}
              style={{ padding: '6px 14px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onMenuClick(fn)}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <InputBar />
    </div>
  )
}
