import React, { useRef, useState } from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import { AiOutlineUpload, AiOutlineDelete } from 'react-icons/ai';
import classnames from 'classnames';
import styles from './UploadArea.module.less';

type Props = {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  hasFile: boolean;
  onReset: () => void;
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif'];

export const UploadArea: React.FC<Props> = ({ onFileSelect, previewUrl, hasFile, onReset }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert('请上传支持的图片格式：JPG、PNG、BMP、WebP、GIF');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size="4" weight="bold">原图</Text>
        {hasFile && (
          <Button size="1" color="gray" variant="soft" onClick={onReset}>
            <AiOutlineDelete /> 重新选择
          </Button>
        )}
      </div>

      {!hasFile ? (
        <div
          className={classnames(styles.uploadArea, isDragOver && styles.dragOver)}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            validateAndSelect(e.dataTransfer.files);
          }}
        >
          <input
            ref={ref}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => validateAndSelect(e.target.files)}
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
  );
};
