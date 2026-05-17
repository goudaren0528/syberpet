import { useEffect, useRef } from 'react'
import { useStore } from '../store/state'

const s = {
  panel: {
    position: 'absolute' as const,
    right: 8,
    top: 8,
    width: 280,
    height: 420,
    background: 'rgba(20,20,30,0.92)',
    borderRadius: 12,
    border: '1px solid rgba(100,100,120,0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    backdropFilter: 'blur(16px)',
    zIndex: 140,
    overflow: 'hidden',
    boxShadow: '0 14px 40px rgba(0,0,0,0.22)'
  },
  header: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(100,100,120,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: '#e8e8ee', fontSize: 12, fontWeight: 600 },
  subtitle: { color: 'rgba(255,255,255,0.42)', fontSize: 10, marginTop: 2 },
  btn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer' as const,
    fontSize: 14,
    padding: '2px 4px'
  },
  msgs: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '10px 12px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8
  },
  empty: {
    textAlign: 'center' as const,
    marginTop: 64,
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    lineHeight: 1.5
  },
  row: {
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  rowUser: {
    alignSelf: 'flex-end' as const,
    background: 'rgba(125,211,252,0.10)',
    border: '1px solid rgba(125,211,252,0.16)'
  },
  rowBot: {
    alignSelf: 'flex-start' as const,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  label: {
    fontSize: 10,
    opacity: 0.5,
    marginBottom: 4
  },
  text: {
    fontSize: 12,
    color: '#ececf2',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const
  },
  footer: {
    padding: '8px 12px',
    borderTop: '1px solid rgba(100,100,120,0.2)',
    fontSize: 10,
    color: 'rgba(255,255,255,0.36)'
  }
}

export default function HistoryPanel() {
  const chatVisible = useStore(s => s.chatVisible)
  const toggleChat = useStore(s => s.toggleChat)
  const messages = useStore(s => s.messages)
  const streaming = useStore(s => s.streaming)
  const streamContent = useStore(s => s.streamContent)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatVisible) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatVisible, messages, streamContent])

  if (!chatVisible) return null

  return (
    <div style={s.panel} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      <div style={s.header}>
        <div>
          <div style={s.title}>对话记录</div>
          <div style={s.subtitle}>只读回看最近互动</div>
        </div>
        <button style={s.btn} onClick={toggleChat} title="关闭">✕</button>
      </div>

      <div ref={scrollRef} style={s.msgs}>
        {messages.length === 0 && !streaming && (
          <div style={s.empty}>
            这里会显示你和 SyberPet 的最近对话。
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              style={{
                ...s.row,
                ...(isUser ? s.rowUser : s.rowBot),
                maxWidth: isUser ? '88%' : '92%'
              }}
            >
              <div style={s.label}>{isUser ? '你' : 'SyberPet'}</div>
              <div style={s.text}>{msg.content}</div>
            </div>
          )
        })}

        {streaming && streamContent.trim() && (
          <div style={{ ...s.row, ...s.rowBot, maxWidth: '92%' }}>
            <div style={s.label}>SyberPet</div>
            <div style={s.text}>{streamContent}</div>
          </div>
        )}
      </div>

      <div style={s.footer}>主交互仍以底部输入条和宠物气泡为主。</div>
    </div>
  )
}
