import React from 'react';
import { Button, Dialog, Flex } from '@radix-ui/themes';

type IProps = Readonly<{
  open: boolean;
  title?: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

const ConfirmDialog: React.FC<IProps> = ({
  open,
  title = '确认删除',
  description,
  confirmText = '删除',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Content maxWidth="360px">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description size="2">{description}</Dialog.Description>
        <Flex gap="2" mt="4" justify="end">
          <Button variant="soft" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button color="red" loading={loading} onClick={onConfirm}>
            {confirmText}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(ConfirmDialog);
