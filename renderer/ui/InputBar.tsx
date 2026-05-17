import { useCallback, useEffect, useRef, useState } from 'react'
import { detectInteractionReward } from '../pet/interactionRewards'
import { useStore } from '../store/state'

const shell = {
  position: 'absolute' as const,
  left: 12,
  right: 12,
  bottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 999,
  background: 'rgba(20,20,30,0.58)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 10px 28px rgba(0,0,0,0.16)',
  zIndex: 130
}

const inputStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#f5f5f7',
  fontSize: 12,
  lineHeight: 1.2,
  outline: 'none'
}

const buttonStyle = {
  border: 'none',
  background: 'rgba(255,255,255,0.12)',
  color: '#f5f5f7',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer' as const,
  flexShrink: 0
}

export default function InputBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [modelInput, setModelInput] = useState('deepseek-v4-pro')
  const [saving, setSaving] = useState(false)

  const streaming = useStore((s) => s.streaming)
  const dialoguePhase = useStore((s) => s.dialoguePhase)
  const showSettings = useStore((s) => s.showSettings)
  const toggleSettings = useStore((s) => s.toggleSettings)
  const setStreaming = useStore((s) => s.setStreaming)
  const appendStream = useStore((s) => s.appendStream)
  const commitStreamToBubble = useStore((s) => s.commitStreamToBubble)
  const setApiKeyConfigured = useStore((s) => s.setApiKeyConfigured)
  const addMessage = useStore((s) => s.addMessage)
  const applyInteractionReward = useStore((s) => s.applyInteractionReward)
  const setDialoguePhase = useStore((s) => s.setDialoguePhase)

  const isBusy = dialoguePhase !== 'idle'
  const isThinking = dialoguePhase === 'thinking'
  const isStreaming = dialoguePhase === 'streaming'

  const chatPlaceholder = isThinking
    ? 'SyberPet 正在思考…'
    : isStreaming
      ? 'SyberPet 正在回复…'
      : '和 SyberPet 说点什么…'

  const loadingLabel = isThinking ? '思考中' : '发送'

  const createMessageId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  const normalizeAfterReply = () => {
    window.setTimeout(() => setDialoguePhase('idle'), 0)
  }

  const handleSendFailure = (error: unknown) => {
    console.error('[InputBar] sendToAgent failed:', error)
    setDialoguePhase('idle')
    commitStreamToBubble()
  }

  const handleFallbackReply = () => {
    window.setTimeout(() => {
      appendStream('你好呀主人~ (｡･ω･｡)ﾉ♡ 请在设置中填入DeepSeek API Key即可接入AI~')
      window.setTimeout(() => {
        commitStreamToBubble()
        normalizeAfterReply()
      }, 100)
    }, 500)
  }

  const stop = useCallback((e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (dialoguePhase === 'streaming') {
      return
    }

    if (!streaming && dialoguePhase === 'thinking') {
      setDialoguePhase('idle')
    }
  }, [dialoguePhase, setDialoguePhase, streaming])

  useEffect(() => {
    if (!isBusy) return

    const api = window.electronAPI
    const offStream = api?.onAgentStream?.((chunk: string) => appendStream(chunk))
    const offStreamEnd = api?.onAgentStreamEnd?.(() => {
      commitStreamToBubble()
      normalizeAfterReply()
    })

    return () => {
      offStream?.()
      offStreamEnd?.()
    }
  }, [appendStream, commitStreamToBubble, isBusy, setDialoguePhase])

  useEffect(() => {
    if (dialoguePhase === 'thinking') {
      inputRef.current?.blur()
    }
  }, [dialoguePhase])

  useEffect(() => {
    const api = window.electronAPI
    api?.getConfigStatus?.().then((st) => {
      if (st?.configured) setApiKeyConfigured(true)
      if (st?.model) setModelInput(st.model)
    })
  }, [setApiKeyConfigured])

  const saveConfig = useCallback(async () => {
    if (!apiKeyInput.trim()) return
    setSaving(true)
    try {
      await window.electronAPI?.saveConfig?.({
        apiKey: apiKeyInput.trim(),
        provider: 'deepseek',
        model: modelInput
      })
      setApiKeyConfigured(true)
      setApiKeyInput('')
      toggleSettings()
    } catch (error) {
      console.error('[InputBar] saveConfig failed:', error)
    }
    setSaving(false)
  }, [apiKeyInput, modelInput, setApiKeyConfigured, toggleSettings])

  const sendMessage = useCallback(() => {
    const input = inputRef.current
    if (!input?.value.trim() || isBusy) return

    const content = input.value.trim()
    input.value = ''

    addMessage({ role: 'user', content, id: createMessageId() })
    applyInteractionReward(detectInteractionReward(content))
    setStreaming(true)

    if (window.electronAPI?.sendToAgent) {
      void window.electronAPI.sendToAgent({ type: 'user-chat', content }).catch(handleSendFailure)
      return
    }

    handleFallbackReply()
  }, [addMessage, applyInteractionReward, handleFallbackReply, handleSendFailure, isBusy, setStreaming])

  if (showSettings) {
    return (
      <div key="settings" style={shell} onMouseDown={stop} onClick={stop}>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="sk-..."
          style={{ ...inputStyle, minWidth: 120 }}
        />
        <select
          value={modelInput}
          onChange={(e) => setModelInput(e.target.value)}
          onMouseDown={stop}
          style={{
            background: 'rgba(40,40,50,0.8)',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '6px 10px',
            fontSize: 11,
            color: '#f5f5f7',
            outline: 'none'
          }}
        >
          <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          <option value="deepseek-v4-flash">deepseek-v4-flash</option>
          <option value="deepseek-chat">deepseek-chat</option>
          <option value="deepseek-reasoner">deepseek-reasoner</option>
        </select>
        <button style={buttonStyle} onClick={saveConfig} disabled={saving || !apiKeyInput.trim()}>
          {saving ? '保存中...' : '保存'}
        </button>
        <button style={buttonStyle} onClick={toggleSettings}>返回</button>
      </div>
    )
  }

  return (
    <div key="chat" style={shell} onMouseDown={stop} onClick={stop}>
      <input
        ref={inputRef}
        style={inputStyle}
        placeholder={chatPlaceholder}
        onFocus={stop}
        onKeyDown={(e) => {
          stop(e)
          if (e.key === 'Enter') sendMessage()
        }}
        disabled={isBusy}
      />
      <button style={buttonStyle} onClick={sendMessage} disabled={isBusy}>
        {loadingLabel}
      </button>
      <button style={buttonStyle} onClick={toggleSettings}>
        设置
      </button>
    </div>
  )
}
