// 消息总线消息类型
export interface BusMessage {
  id: string
  type: 'user-chat' | 'system-event' | 'monitor-alert' | 'scheduled-task' | 'internal'
  priority: 0 | 1 | 2 | 3  // P0-P3
  payload: Record<string, any>
  timestamp: number
}

// 对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
}

// LLM 配置
export interface LLMConfig {
  provider: string
  model: string
  apiKey: string
  baseURL: string
  maxTokens: number
  temperature: number
  maxConcurrent: number
}

// Agent 状态
export type PetState = 'idle' | 'sleeping' | 'talking' | 'thinking' | 'working'
export type PetMode = 'free' | 'focus'
