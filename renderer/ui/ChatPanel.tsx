import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../store/state'

export default function ChatPanel() {
  const {
    messages, streaming, streamContent, showSettings,
    addMessage, setStreaming, appendStream, commitStream,
    toggleChat, toggleSettings, setApiKeyConfigured
  } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamContent])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (api) {
      api.getConfigStatus?.().then((s: any) => {
        if (s?.configured) setApiKeyConfigured(true)
      })
    }
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
        appendStream('你好呀主人~ (｡･ω･｡)ﾉ♡ 我是SyberPet！请在设置中填入API Key接入LLM后就能真正聊天啦~')
        setTimeout(() => commitStream(), 100)
      }, 500)
    }
  }, [streaming, addMessage, setStreaming, appendStream, commitStream])

  const saveApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) return
    setSaving(true)
    const api = (window as any).electronAPI
    try {
      await api?.saveConfig?.({ apiKey: apiKeyInput.trim(), provider: 'deepseek' })
      setApiKeyConfigured(true)
      setApiKeyInput('')
      toggleSettings()
    } catch (e) {
      console.error('Save config failed:', e)
    } finally {
      setSaving(false)
    }
  }, [apiKeyInput, setApiKeyConfigured, toggleSettings])

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
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-xs font-medium">SyberPet</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleSettings}
                  className="text-white/50 hover:text-white/90 text-xs px-1"
                  title="设置 API Key">⚙</button>
          <button onClick={toggleChat}
                  className="text-white/50 hover:text-white/90 text-xs px-1">✕</button>
        </div>
      </div>

      {showSettings ? (
        <div className="flex-1 px-3 py-3 space-y-3">
          <div className="text-xs text-white/70">API 配置</div>
          <div>
            <label className="text-[10px] text-white/40 block mb-1">DeepSeek API Key</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-xs text-white/90 outline-none border border-gray-600 focus:border-purple-500"
            />
          </div>
          <button
            onClick={saveApiKey}
            disabled={saving || !apiKeyInput.trim()}
            className="w-full py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={toggleSettings}
            className="w-full py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            返回对话
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <div className="text-xs text-white/30 text-center mt-8">
                点击宠物开始对话 🐱
              </div>
            )}
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

          {/* Input */}
          <div className="p-2 border-t border-gray-700">
            <input
              ref={inputRef}
              className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-xs text-white/90 outline-none border border-gray-600 focus:border-purple-500"
              placeholder="输入消息..."
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={streaming}
            />
          </div>
        </>
      )}
    </div>
  )
}
