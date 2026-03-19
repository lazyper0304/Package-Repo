import { Dialog } from '@radix-ui/themes'
import { useRequest, useSetState } from 'ahooks'
import React, { useRef } from 'react'
import styles from './index.module.less'
import classnames from 'classnames'
import API from '@/services'
import { AiOutlineLoading } from 'react-icons/ai'
import { notify } from '@/utils/notify'

type IProps = Readonly<{ open: boolean; onClose: () => void; onUpload: () => void }>

const UploadExcel: React.FC<IProps> = ({ open, onClose, onUpload }) => {
  const ref = useRef<HTMLInputElement>(null)

  const uploadReq = useRequest(API.excelUpload, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        notify(`上传成功${res.successCount}个，失败${res.errorCount}个，已存在${res.duplicateCount}个`)

        if (res.successCount > 0) {
          onUpload()
        }
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

    formData.append('file', file)

    uploadReq.run(formData)
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    const file = e.dataTransfer.files[0]

    if (!file) return

    const formData = new FormData()

    formData.append('file', file)

    uploadReq.run(formData)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content>
        <Dialog.Title>上传文件</Dialog.Title>

        <Dialog.Description>
          <div
            className={classnames(styles.uploadExcel, uploadReq.loading ? styles['uploadExcel--disabled'] : undefined)}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              key={uploadReq.loading}
              ref={ref}
              type='file'
              accept='.xlsx, .xls, .json'
              disabled={uploadReq.loading}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ marginBottom: 24, fontSize: 24 }}>
              {uploadReq.loading ? <AiOutlineLoading className='loading' /> : '📊'}
            </div>
            <p>点击或拖拽文件到此处上传</p>
            <span>支持 .xlsx、.xls和.json格式</span>
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default React.memo(UploadExcel)
