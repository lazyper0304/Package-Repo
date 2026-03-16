import eventBus from '@/eventBus'

export type NotifyConfig = {
  title: string
}

export function notify(content: React.ReactNode, config?: NotifyConfig) {
  eventBus.emit('showNotify', content, config)
}
