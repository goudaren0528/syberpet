import { create } from 'zustand'

export type PetState = 'idle' | 'sleeping' | 'talking' | 'thinking' | 'working'
export type BubbleSource = 'preset' | 'ai' | 'need'

export interface ChatMessage {
  role: string
  content: string
  id: string
}

export interface PetBubble {
  text: string
  source: BubbleSource
  visible: boolean
  createdAt: number
}

export interface PetNeeds {
  hunger: number
  mood: number
  energy: number
  lastUpdatedAt: number
}

interface AppState {
  mode: 'free' | 'focus'
  petState: PetState
  chatVisible: boolean
  showSettings: boolean
  messages: ChatMessage[]
  streaming: boolean
  streamContent: string
  apiKeyConfigured: boolean
  petBubble: PetBubble | null
  petNeeds: PetNeeds

  setMode: (mode: 'free' | 'focus') => void
  setPetState: (state: PetState) => void
  toggleChat: () => void
  toggleSettings: () => void
  addMessage: (msg: ChatMessage) => void
  setStreaming: (v: boolean) => void
  appendStream: (chunk: string) => void
  commitStream: () => void
  commitStreamToBubble: () => void
  setApiKeyConfigured: (v: boolean) => void
  showPetBubble: (text: string, source?: BubbleSource) => void
  clearPetBubble: () => void
  hydratePetNeeds: (data?: Partial<PetNeeds> | null) => void
  tickPetNeeds: (now?: number) => void
  feedPet: () => void
  restPet: () => void
  improveMood: (amount: number) => void
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

const DEFAULT_PET_NEEDS: PetNeeds = {
  hunger: 80,
  mood: 80,
  energy: 80,
  lastUpdatedAt: Date.now()
}

export const useStore = create<AppState>((set) => ({
  mode: 'free',
  petState: 'idle',
  chatVisible: false,
  showSettings: false,
  messages: [],
  streaming: false,
  streamContent: '',
  apiKeyConfigured: false,
  petBubble: null,
  petNeeds: DEFAULT_PET_NEEDS,

  setMode: (mode) => set({ mode }),
  setPetState: (petState) => set({ petState }),
  toggleChat: () => set((s) => ({ chatVisible: !s.chatVisible })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStreaming: (streaming) => set({ streaming, streamContent: '' }),
  appendStream: (chunk) => set((s) => ({ streamContent: s.streamContent + chunk })),
  commitStream: () => set((s) => {
    if (s.streamContent.trim()) {
      return {
        messages: [...s.messages, { role: 'assistant', content: s.streamContent, id: crypto.randomUUID() }],
        streaming: false,
        streamContent: ''
      }
    }
    return { streaming: false, streamContent: '' }
  }),
  commitStreamToBubble: () => set((s) => {
    const text = s.streamContent.trim()
    if (!text) {
      return { streaming: false, streamContent: '' }
    }
    return {
      petBubble: {
        text,
        source: 'ai',
        visible: true,
        createdAt: Date.now()
      },
      streaming: false,
      streamContent: ''
    }
  }),
  setApiKeyConfigured: (v) => set({ apiKeyConfigured: v }),
  showPetBubble: (text, source = 'preset') => set({
    petBubble: {
      text,
      source,
      visible: true,
      createdAt: Date.now()
    }
  }),
  clearPetBubble: () => set({ petBubble: null }),
  hydratePetNeeds: (data) => set(() => ({
    petNeeds: {
      hunger: clamp(data?.hunger ?? DEFAULT_PET_NEEDS.hunger),
      mood: clamp(data?.mood ?? DEFAULT_PET_NEEDS.mood),
      energy: clamp(data?.energy ?? DEFAULT_PET_NEEDS.energy),
      lastUpdatedAt: data?.lastUpdatedAt ?? Date.now()
    }
  })),
  tickPetNeeds: (now = Date.now()) => set((s) => {
    const elapsedMs = Math.max(0, now - s.petNeeds.lastUpdatedAt)
    if (elapsedMs < 1000) return { petNeeds: { ...s.petNeeds, lastUpdatedAt: now } }

    const steps = elapsedMs / 30000
    const hunger = clamp(s.petNeeds.hunger - (0.8 * steps))
    const energyDelta = s.petState === 'sleeping' ? 1.1 * steps : -0.65 * steps
    const energy = clamp(s.petNeeds.energy + energyDelta)

    let moodDelta = 0
    if (hunger < 30) moodDelta -= 0.65 * steps
    if (energy < 25) moodDelta -= 0.6 * steps
    if (hunger > 60 && energy > 55) moodDelta += 0.18 * steps

    return {
      petNeeds: {
        hunger,
        energy,
        mood: clamp(s.petNeeds.mood + moodDelta),
        lastUpdatedAt: now
      }
    }
  }),
  feedPet: () => set((s) => ({
    petNeeds: {
      ...s.petNeeds,
      hunger: clamp(s.petNeeds.hunger + 18),
      mood: clamp(s.petNeeds.mood + 4),
      lastUpdatedAt: Date.now()
    }
  })),
  restPet: () => set((s) => ({
    petNeeds: {
      ...s.petNeeds,
      energy: clamp(s.petNeeds.energy + 16),
      mood: clamp(s.petNeeds.mood + 2),
      lastUpdatedAt: Date.now()
    }
  })),
  improveMood: (amount) => set((s) => ({
    petNeeds: {
      ...s.petNeeds,
      mood: clamp(s.petNeeds.mood + amount),
      lastUpdatedAt: Date.now()
    }
  }))
}))
