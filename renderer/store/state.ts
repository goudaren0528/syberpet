import { create } from 'zustand'

interface AppState {
  mode: 'free' | 'focus'
  petState: string
  chatVisible: boolean
  messages: { role: string; content: string; id: string }[]
  streaming: boolean
  streamContent: string

  setMode: (mode: 'free' | 'focus') => void
  setPetState: (state: string) => void
  toggleChat: () => void
  addMessage: (msg: { role: string; content: string; id: string }) => void
  setStreaming: (v: boolean) => void
  appendStream: (chunk: string) => void
  commitStream: () => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'free',
  petState: 'idle',
  chatVisible: false,
  messages: [],
  streaming: false,
  streamContent: '',

  setMode: (mode) => set({ mode }),
  setPetState: (petState) => set({ petState }),
  toggleChat: () => set(s => ({ chatVisible: !s.chatVisible })),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  setStreaming: (streaming) => set({ streaming, streamContent: '' }),
  appendStream: (chunk) => set(s => ({ streamContent: s.streamContent + chunk })),
  commitStream: () => set(s => {
    if (s.streamContent.trim()) {
      return {
        messages: [...s.messages, { role: 'assistant', content: s.streamContent, id: crypto.randomUUID() }],
        streaming: false,
        streamContent: ''
      }
    }
    return { streaming: false, streamContent: '' }
  })
}))
