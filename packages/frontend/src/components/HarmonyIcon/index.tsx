import { Card, Dialog, Flex, Text } from '@radix-ui/themes'
import { useRequest, useSetState } from 'ahooks'
import React, { useRef } from 'react'
import styles from './index.module.less'
import classnames from 'classnames'
import API from '@/services'
import { AiOutlineLoading } from 'react-icons/ai'
import { notify } from '@/utils/notify'

type IProps = Readonly<{ open: boolean; onClose: () => void }>

const UploadExcel: React.FC<IProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLInputElement>(null)

  const [state, setState] = useSetState({
    fileName: '',
    bgUrl: '',
    fgUrl: '',
    success: false,
  })

  const uploadReq = useRequest(API.harmonyIcon, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        notify('转鸿蒙双层图标成功')

        setState({ success: true, bgUrl: res.bgUrl, fgUrl: res.fgUrl })
      }
    },
  })

  function handleClick() {
    if (uploadReq.loading) return

    ref.current?.click()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    if (!file) return

    const formData = new FormData()

    setState({ fileName: file.name })

    formData.append('file', file)

    uploadReq.run(formData)
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    const file = e.dataTransfer.files[0]

    if (!file) return

    const formData = new FormData()

    setState({ fileName: file.name })

    formData.append('file', file)

    uploadReq.run(formData)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth='760px'>
        <Dialog.Title>
          <div>转鸿蒙双层图标</div>
        </Dialog.Title>

        <Dialog.Description>
          <div
            className={classnames(styles.harmonyIcon, uploadReq.loading ? styles['harmonyIcon--disabled'] : undefined)}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              key={uploadReq.loading}
              ref={ref}
              type='file'
              accept='.png'
              disabled={uploadReq.loading}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ marginBottom: 24, fontSize: 24 }}>
              {uploadReq.loading ? <AiOutlineLoading className='loading' /> : '📊'}
            </div>
            <p>点击或拖拽文件到此处上传</p>
            <span>支持 .png 格式 (256*256)</span>
          </div>

          {state.success && (
            <div className={styles.harmonyIcon__preview}>
              <Card>
                <Flex justify='between' style={{ marginBottom: 16 }}>
                  <Text size='5'>预览</Text>

                  <Card style={{ padding: '3px 6px', fontSize: 13 }}>
                    <Text color='gray'>{state.fileName}</Text>
                  </Card>
                </Flex>

                <Flex gap='3' justify='between'>
                  <Flex gap='3' direction='column' style={{ flex: 1 }}>
                    <Text color='gray'>背景</Text>

                    <Card style={{ flex: 1 }}>
                      <img src={state.bgUrl} />

                      <Card
                        style={{
                          display: 'inline-block',
                          float: 'right',
                          padding: '3px 6px',
                          fontSize: 13,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {state.fileName.replace('.png', '')}_bg.png
                      </Card>
                    </Card>
                  </Flex>

                  <Flex gap='3' direction='column' style={{ flex: 1 }}>
                    <Text color='gray'>前景</Text>

                    <Card style={{ flex: 1 }}>
                      <img src={state.fgUrl} />

                      <Card
                        style={{
                          display: 'inline-block',
                          float: 'right',
                          padding: '3px 6px',
                          fontSize: 13,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {state.fileName.replace('.png', '')}_fg.png
                      </Card>
                    </Card>
                  </Flex>
                </Flex>
              </Card>
            </div>
          )}
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default React.memo(UploadExcel)
