import { MessageBus } from './bus'
import { PriorityQueue } from './queue'
import { BusMessage } from '../shared/types'

export class AgentCore {
  bus: MessageBus
  queue: PriorityQueue

  constructor() {
    this.bus = new MessageBus()
    this.queue = new PriorityQueue(this.processMessage.bind(this))
  }

  async processMessage(msg: BusMessage): Promise<any> {
    await this.bus.emit(msg)
    return { handled: true }
  }

  async send(message: BusMessage): Promise<any> {
    return this.queue.enqueue(message)
  }
}

export const agent = new AgentCore()
