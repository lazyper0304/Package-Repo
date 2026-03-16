type Callback = (...args: any[]) => void

class EventBus {
  private events: Map<string, Callback[]>

  constructor() {
    this.events = new Map()
  }

  on(eventName: string, callback: Callback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    this.events.get(eventName)?.push(callback)
  }

  off(eventName: string, callback: Callback): void {
    if (this.events.has(eventName)) {
      const callbacks: any = this.events.get(eventName)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(eventName: string, ...args: any[]): void {
    if (this.events.has(eventName)) {
      this.events.get(eventName)?.forEach((callback) => {
        callback(...args)
      })
    }
  }
}

const eventBus = new EventBus()
export default eventBus
