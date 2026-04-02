import React from 'react';
import { Dialog, Text } from '@radix-ui/themes';

type IProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  description?: string;
}>

const CustomDialog: React.FC<IProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = '520px',
  description,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth={maxWidth}>
        <Dialog.Title>{title}</Dialog.Title>
        {description && (
          <Dialog.Description size="2" mb="4">
            {description}
          </Dialog.Description>
        )}
        <div>{children}</div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(CustomDialog);