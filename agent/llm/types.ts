export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: {
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }[]
}

export interface LLMResponse {
  id: string
  choices: {
    index: number
    delta?: { content?: string; tool_calls?: any[] }
    message?: { content: string; tool_calls?: any[] }
    finish_reason: 'stop' | 'tool_calls' | 'length' | null
  }[]
}

export interface LLMProviderConfig {
  baseURL: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}
