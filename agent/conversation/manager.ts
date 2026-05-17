import { randomUUID } from 'crypto'
import { LLMClient, LLMClientConfig } from '../llm/client'
import { ShortTermMemory } from '../memory/short-term'
import { ChatMessage } from '../../shared/types'
import { LLMMessage } from '../llm/types'

const SYSTEM_PROMPT = `你是一个桌面AI宠物助手，名字叫SyberPet。你是一个二次元角色，可爱、活泼、乐于助人。
你的职责：
1. 与主人聊天互动，提供陪伴
2. 帮助执行命令行任务
3. 监控和提醒重要事项
请用中文回答，语气亲切友好，适当使用颜文字。回复简洁（通常不超过200字），除非主人需要详细解释。`

export class ConversationManager {
  private llm: LLMClient
  private memory: ShortTermMemory

  constructor(cfg: string | LLMClientConfig) {
    this.llm = new LLMClient(cfg)
    this.memory = new ShortTermMemory()
  }

  async *chat(userInput: string): AsyncGenerator<string, string, unknown> {
    const userMsg: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    }
    this.memory.add(userMsg)

    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.memory.getContext().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]

    let fullContent = ''
    for await (const chunk of this.llm.chat(messages)) {
      fullContent += chunk
      yield chunk
    }

    const assistantMsg: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: fullContent,
      timestamp: Date.now()
    }
    this.memory.add(assistantMsg)

    return fullContent
  }
}
