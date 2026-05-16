import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/state'

export default function DesktopPet() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const { toggleChat, setPetState } = useStore()
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY }
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      ;(window as any).electronAPI?.moveWindow(dx, dy)
    }
  }

  const onMouseUp = () => {
    dragRef.current.dragging = false
  }

  const onClick = () => {
    toggleChat()
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <div
      className="w-full h-full drag-region relative"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-white/60 text-sm text-center">
          <div className="text-6xl mb-2">🐱</div>
          <div>SyberPet</div>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800/90 backdrop-blur rounded-lg shadow-xl border border-gray-600 py-1 min-w-[160px] no-drag"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button className="w-full px-4 py-2 text-left text-white/90 hover:bg-gray-700 text-sm" onClick={toggleChat}>
            💬 对话
          </button>
          <button className="w-full px-4 py-2 text-left text-white/90 hover:bg-gray-700 text-sm">
            🎯 切换模式
          </button>
          <hr className="border-gray-600 my-1" />
          <button className="w-full px-4 py-2 text-left text-white/90 hover:bg-gray-700 text-sm">
            ⚙️ 设置
          </button>
        </div>
      )}
    </div>
  )
}
