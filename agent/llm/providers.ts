import { LLMProviderConfig } from './types'

export const providers: Record<string, LLMProviderConfig> = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7
  },
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    model: 'qwen2.5:7b',
    maxTokens: 4096,
    temperature: 0.7
  }
}
