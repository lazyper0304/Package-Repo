import React, { useRef, useState } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { AiOutlineUpload } from 'react-icons/ai';
import classnames from 'classnames';
import { ALLOWED_EXTENSIONS } from '../utils/vectorize';
import styles from './UploadArea.module.less';

type Props = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

export const UploadArea: React.FC<Props> = ({ onFileSelect, disabled }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    const file = files[0];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert('请上传支持的图片格式：JPG、JPEG、BMP、PNG、WebP');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div
      className={classnames(styles.uploadArea, isDragOver && styles.dragOver, disabled && styles.disabled)}
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
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
        disabled={disabled}
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
          支持格式：JPG、JPEG、BMP、PNG、WebP
        </Text>
      </Flex>
    </div>
  );
};
