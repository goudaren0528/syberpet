import { useEffect, useRef } from 'react'
import DesktopPet from './ui/DesktopPet'
import ChatPanel from './ui/ChatPanel'
import { useStore } from './store/state'
import { PetEngine } from './pet/engine'

export default function App() {
  const chatVisible = useStore(s => s.chatVisible)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PetEngine | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PetEngine(canvasRef.current)
      engineRef.current.init()
    }
    return () => {
      engineRef.current?.destroy()
    }
  }, [])

  return (
    <div className="w-full h-full relative">
      <DesktopPet />
      {chatVisible && <ChatPanel />}
    </div>
  )
}
