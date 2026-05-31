import { useRef, useCallback } from 'react';
import { Card, Button, Text } from '@radix-ui/themes';

interface UploadAreaProps {
  onImageLoad: (dataUrl: string) => void;
}

export default function UploadArea({ onImageLoad }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件！');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB！');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onImageLoad(e.target!.result as string);
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    areaRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    areaRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    areaRef.current?.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card
      ref={areaRef}
      className="upload-section"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>
      <Text size="2" color="gray">拖放图片到这里，或者</Text>
      <Button
        variant="solid"
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
      >
        选择图片
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = e.target.files;
          if (files && files[0]) handleFile(files[0]);
        }}
      />
    </Card>
  );
}
