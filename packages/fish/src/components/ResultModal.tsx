import { Dialog, Button } from '@radix-ui/themes';

interface ResultModalProps {
  show: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ResultModal({ show, imageUrl, onClose }: ResultModalProps) {
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'watermarked_image.png';
    a.click();
  };

  return (
    <Dialog.Root open={show} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="720px">
        <Dialog.Title>水印添加成功！</Dialog.Title>
        <img
          src={imageUrl ?? undefined}
          alt="带水印的图片"
          style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', margin: '1rem 0' }}
        />
        <Button onClick={handleDownload} style={{ width: '100%', marginTop: '1rem' }}>
          下载图片
        </Button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
