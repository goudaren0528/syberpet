import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../store/state'

const s = {
  panel: {
    position: 'absolute' as const, right: 8, top: 8, width: 280,
    bottom: 8,
    background: 'rgba(20,20,30,0.92)', borderRadius: 12,
    border: '1px solid rgba(100,100,120,0.4)',
    display: 'flex', flexDirection: 'column' as const,
    backdropFilter: 'blur(16px)', zIndex: 100, overflow: 'hidden'
  },
  header: {
    padding: '8px 12px', borderBottom: '1px solid rgba(100,100,120,0.2)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { color: '#e0e0e0', fontSize: 12, fontWeight: 500 },
  btn: { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 14, padding: '2px 4px' },
  msgs: { flex: 1, overflowY: 'auto' as const, padding: '8px 12px' },
  msgUser: { fontSize: 12, color: '#7dd3fc', marginBottom: 8 },
  msgBot: { fontSize: 12, color: '#e0e0e0', marginBottom: 8 },
  label: { opacity: 0.5, marginRight: 4 },
  input: {
    width: '100%', background: 'rgba(40,40,50,0.8)', borderRadius: 8,
    border: '1px solid rgba(100,100,120,0.3)', padding: '7px 10px',
    fontSize: 12, color: '#e0e0e0', outline: 'none'
  },
  inputArea: { padding: '8px 12px', borderTop: '1px solid rgba(100,100,120,0.2)' }
}

export default function ChatPanel() {
  const {
    messages, streaming, streamContent, showSettings,
    addMessage, setStreaming, appendStream, commitStream,
    toggleChat, toggleSettings, setApiKeyConfigured
  } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [modelInput, setModelInput] = useState('deepseek-v4-pro')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamContent])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    api?.getConfigStatus?.().then((st: any) => {
      if (st?.configured) setApiKeyConfigured(true)
      if (st?.model) setModelInput(st.model)
    })
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
        appendStream('你好呀主人~ (｡･ω･｡)ﾉ♡ 请在设置中填入DeepSeek API Key即可接入AI~')
        setTimeout(() => commitStream(), 100)
      }, 500)
    }
  }, [streaming, addMessage, setStreaming, appendStream, commitStream])

  const saveConfig = useCallback(async () => {
    if (!apiKeyInput.trim()) return
    setSaving(true)
    try {
      await (window as any).electronAPI?.saveConfig?.({
        apiKey: apiKeyInput.trim(),
        provider: 'deepseek',
        model: modelInput
      })
      setApiKeyConfigured(true)
      setApiKeyInput('')
      toggleSettings()
    } catch (e) { console.error(e) }
    setSaving(false)
  }, [apiKeyInput, modelInput, setApiKeyConfigured, toggleSettings])

  useEffect(() => {
    const api = (window as any).electronAPI
    api?.onAgentStream?.((chunk: string) => appendStream(chunk))
    api?.onAgentStreamEnd?.(() => commitStream())
  }, [appendStream, commitStream])

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>SyberPet</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button style={s.btn} onClick={toggleSettings} title="设置">⚙</button>
          <button style={s.btn} onClick={toggleChat}>✕</button>
        </div>
      </div>

      {showSettings ? (
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ color: '#ccc', fontSize: 12, marginBottom: 12 }}>API 配置</div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>DeepSeek API Key</div>
          <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                 placeholder="sk-..." style={s.input} />
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4, marginTop: 12 }}>模型</div>
          <select value={modelInput} onChange={e => setModelInput(e.target.value)}
            style={{
              width: '100%', background: 'rgba(40,40,50,0.8)', borderRadius: 8,
              border: '1px solid rgba(100,100,120,0.3)', padding: '7px 10px',
              fontSize: 12, color: '#e0e0e0', outline: 'none', cursor: 'pointer'
            }}>
            <option value="deepseek-v4-pro">deepseek-v4-pro (推荐)</option>
            <option value="deepseek-v4-flash">deepseek-v4-flash</option>
            <option value="deepseek-chat">deepseek-chat (即将弃用)</option>
            <option value="deepseek-reasoner">deepseek-reasoner (即将弃用)</option>
          </select>
          <button onClick={saveConfig} disabled={saving || !apiKeyInput.trim()}
            style={{
              width: '100%', marginTop: 12, padding: '8px', borderRadius: 8, border: 'none',
              background: apiKeyInput.trim() ? '#7c3aed' : '#444',
              color: '#fff', fontSize: 12, cursor: apiKeyInput.trim() ? 'pointer' : 'default'
            }}>{saving ? '保存中...' : '保存配置'}</button>
          <button onClick={toggleSettings}
            style={{
              width: '100%', marginTop: 8, padding: '8px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#aaa', fontSize: 12, cursor: 'pointer'
            }}>返回对话</button>
        </div>
      ) : (
        <>
          <div ref={scrollRef} style={s.msgs}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 40, color: '#555', fontSize: 12 }}>
                点击宠物开始对话 🐱
              </div>
            )}
            {messages.map((msg: { role: string; content: string; id: string }) => (
              <div key={msg.id} style={msg.role === 'user' ? s.msgUser : s.msgBot}>
                <span style={{ opacity: 0.4, marginRight: 4 }}>{msg.role === 'user' ? '你' : '🐱'}</span>
                {msg.content}
              </div>
            ))}
            {streaming && (
              <div style={s.msgBot}>
                <span style={{ opacity: 0.4, marginRight: 4 }}>🐱</span>
                {streamContent}<span className="animate-pulse">|</span>
              </div>
            )}
          </div>
          <div style={s.inputArea}>
            <input ref={inputRef} style={s.input} placeholder="输入消息..."
                   onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={streaming} />
          </div>
        </>
      )}
    </div>
  )
}
