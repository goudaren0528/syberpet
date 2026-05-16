import { BusMessage } from '../shared/types'

interface QueueItem {
  message: BusMessage
  resolve: (value: any) => void
  reject: (error: any) => void
}

export class PriorityQueue {
  private queues: QueueItem[][] = [[], [], [], []] // P0-P3
  private concurrency: number
  private active = 0
  private processor: (msg: BusMessage) => Promise<any>

  constructor(processor: (msg: BusMessage) => Promise<any>, concurrency = 2) {
    this.processor = processor
    this.concurrency = concurrency
  }

  enqueue(message: BusMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queues[message.priority].push({ message, resolve, reject })
      this.processNext()
    })
  }

  private async processNext() {
    if (this.active >= this.concurrency) return

    const item = this.dequeue()
    if (!item) return

    this.active++
    try {
      const result = await this.processor(item.message)
      item.resolve(result)
    } catch (e) {
      item.reject(e)
    } finally {
      this.active--
      this.processNext()
    }
  }

  private dequeue(): QueueItem | null {
    for (const queue of this.queues) {
      if (queue.length > 0) return queue.shift()!
    }
    return null
  }
}
