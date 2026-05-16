import { BusMessage } from '../shared/types'

type MessageHandler = (msg: BusMessage) => Promise<void>

export class MessageBus {
  private handlers: Map<string, MessageHandler[]> = new Map()

  register(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) || []
    existing.push(handler)
    this.handlers.set(type, existing)
  }

  async emit(message: BusMessage) {
    const handlers = this.handlers.get(message.type) || []
    await Promise.all(handlers.map(h => h(message)))
  }
}
