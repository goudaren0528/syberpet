import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store/state'

export default function ChatPanel() {
  const { messages, streaming, streamContent, addMessage, setStreaming, appendStream, commitStream, toggleChat } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamContent])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = useCallback(() => {
    const input = inputRef.current
    if (!input?.value.trim() || streaming) return

    const content = input.value.trim()
    input.value = ''

    addMessage({ role: 'user', content, id: crypto.randomUUID() })
    setStreaming(true)

    const api = (window as any).electronAPI
    if (api?.sendToAgent) {
      api.sendToAgent({ type: 'user-chat', content })
    } else {
      setTimeout(() => {
        const response = '你好呀主人~ (｡･ω･｡)ﾉ♡ 我是SyberPet！目前后端还没连接，但对话面板已经就绪啦。等我接入LLM后就能真正聊天了~'
        appendStream(response)
        setTimeout(() => commitStream(), 100)
      }, 500)
    }
  }, [streaming, addMessage, setStreaming, appendStream, commitStream])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (api) {
      api.onAgentStream((chunk: string) => appendStream(chunk))
      api.onAgentStreamEnd(() => commitStream())
    }
  }, [appendStream, commitStream])

  return (
    <div className="absolute right-2 top-2 w-72 bg-gray-900/90 backdrop-blur rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden no-drag"
         style={{ height: 'calc(100% - 16px)' }}>
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white/80 text-xs font-medium">🐱 SyberPet</span>
        <button onClick={toggleChat}
                className="text-white/50 hover:text-white/90 text-xs px-1">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`text-xs ${msg.role === 'user' ? 'text-blue-300' : 'text-white/80'}`}>
            <span className="opacity-50 mr-1">{msg.role === 'user' ? '你' : '🐱'}</span>
            {msg.content}
          </div>
        ))}
        {streaming && (
          <div className="text-xs text-white/60">
            <span className="opacity-50 mr-1">🐱</span>
            {streamContent}
            <span className="animate-pulse">|</span>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-700">
        <input
          ref={inputRef}
          className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-xs text-white/90 outline-none border border-gray-600 focus:border-blue-500"
          placeholder="输入消息..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={streaming}
        />
      </div>
    </div>
  )
}
