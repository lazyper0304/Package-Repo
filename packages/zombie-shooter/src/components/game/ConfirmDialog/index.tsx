import { Text, Button } from '@radix-ui/themes';
import styles from './index.module.less';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmText = '确认', cancelText = '取消', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          <Text size="3" weight="bold">{title}</Text>
        </div>
        <div className={styles.message}>
          <Text size="2" style={{ whiteSpace: 'pre-line' }}>{message}</Text>
        </div>
        <div className={styles.buttons}>
          <Button size="2" variant="soft" onClick={onCancel}>{cancelText}</Button>
          <Button size="2" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
