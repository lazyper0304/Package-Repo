import { useCallback, useState } from 'react';

/**
 * 统一管理 dialog 开关状态
 */
export function useDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  return { open, onOpen, onClose, setOpen } as const;
}
