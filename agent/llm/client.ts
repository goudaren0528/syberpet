import { LLMMessage, LLMProviderConfig } from './types'
import { providers } from './providers'

export interface LLMClientConfig {
  provider: string
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export class LLMClient {
  private config: LLMProviderConfig

  constructor(cfg: string | LLMClientConfig = 'deepseek') {
    if (typeof cfg === 'string') {
      const preset = providers[cfg]
      if (!preset) throw new Error(`Unknown provider: ${cfg}`)
      this.config = { ...preset }
    } else {
      const preset = providers[cfg.provider]
      if (!preset) throw new Error(`Unknown provider: ${cfg.provider}`)
      this.config = {
        baseURL: preset.baseURL,
        apiKey: cfg.apiKey || preset.apiKey,
        model: cfg.model || preset.model,
        maxTokens: cfg.maxTokens || preset.maxTokens,
        temperature: cfg.temperature ?? preset.temperature
      }
    }
  }

  async *chat(messages: LLMMessage[], tools?: any[]): AsyncGenerator<string, string, unknown> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        tools,
        stream: true
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`LLM API error: ${response.status} ${err}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta
          if (delta?.content) {
            fullContent += delta.content
            yield delta.content
          }
        } catch { /* skip malformed chunk */ }
      }
    }

    return fullContent
  }
}
