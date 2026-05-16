import { ChatMessage } from '../../shared/types'

export class ShortTermMemory {
  private buffer: ChatMessage[] = []
  private maxRounds: number

  constructor(maxRounds = 50) {
    this.maxRounds = maxRounds
  }

  add(message: ChatMessage) {
    this.buffer.push(message)
    const userMsgs = this.buffer.filter(m => m.role === 'user')
    if (userMsgs.length > this.maxRounds) {
      const cutoff = userMsgs[userMsgs.length - this.maxRounds]
      const idx = this.buffer.findIndex(m => m.id === cutoff.id)
      if (idx > 0) this.buffer = this.buffer.slice(idx)
    }
  }

  getContext(): ChatMessage[] {
    return [...this.buffer]
  }

  clear() {
    this.buffer = []
  }
}
