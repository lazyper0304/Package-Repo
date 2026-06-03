import { useRef, useCallback, useState } from 'react'
import { Flex, Text, Button } from '@radix-ui/themes'
import { AiOutlineUpload, AiOutlineDelete } from 'react-icons/ai'
import classnames from 'classnames'
import styles from './UploadArea.module.less'

interface UploadAreaProps {
  onImageLoad: (dataUrl: string) => void
  previewUrl: string | null
  hasFile: boolean
  onReset: () => void
}

export default function UploadArea({ onImageLoad, previewUrl, hasFile, onReset }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件！')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过10MB！')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => onImageLoad(e.target!.result as string)
      reader.readAsDataURL(file)
    },
    [onImageLoad],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size="4" weight="bold">上传图片</Text>
        {hasFile && (
          <Button size="1" color="gray" variant="soft" onClick={onReset}>
            <AiOutlineDelete /> 重新选择
          </Button>
        )}
      </div>

      {!hasFile ? (
        <div
          className={classnames(styles.uploadArea, isDragOver && styles.dragOver)}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files
              if (files && files[0]) handleFile(files[0])
            }}
          />
          <div className={styles.icon}>
            <AiOutlineUpload size={48} />
          </div>
          <Flex direction="column" align="center">
            <Text size="3" style={{ marginBottom: 8 }}>
              点击或拖拽图片文件到此处上传
            </Text>
            <Text size="2" color="gray">
              支持格式：JPG、PNG、BMP、WebP、GIF
            </Text>
          </Flex>
        </div>
      ) : (
        <div className={styles.preview}>
          <img src={previewUrl!} alt="预览" />
        </div>
      )}
    </div>
  )
}
