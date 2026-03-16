import eventBus from '@/eventBus'
import type { NotifyConfig } from '@/utils/notify'
import { Button, Dialog } from '@radix-ui/themes'
import { useMount, useSetState, useUnmount } from 'ahooks'
import React from 'react'

type IProps = Readonly<{}>

type IState = {
  open: boolean
  title: string
  content?: React.ReactNode
}

const Notify: React.FC<IProps> = () => {
  const [state, setState] = useSetState<IState>({
    open: false,
    content: undefined,
    title: '提示',
  })

  function showNotify(content: React.ReactNode, config?: NotifyConfig) {
    setState({ open: true, content, title: config?.title ?? '提示' })
  }

  function handleOpenChange(v: boolean) {
    setState({ open: v })
  }

  useMount(() => {
    eventBus.on('showNotify', showNotify)
  })

  useUnmount(() => {
    eventBus.off('showNotify', showNotify)
  })

  return (
    <Dialog.Root open={state.open} onOpenChange={handleOpenChange}>
      <Dialog.Content width='300px' size='1'>
        <Dialog.Title>提示</Dialog.Title>
        <Dialog.Description>{state.content}</Dialog.Description>

        <Dialog.Close style={{ marginTop: 16 }}>
          <Button style={{ width: '100%' }}>确定</Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default React.memo(Notify)
