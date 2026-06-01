import React, { useState } from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import { MdAdd, MdClose, MdSettings } from 'react-icons/md';
import { useTierList } from '../../store/TierListContext';
import { PRESET_COLORS } from '../../constants';
import styles from './index.module.less';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ConfigDialog: React.FC<Props> = ({ open, onClose }) => {
  const { state, dispatch } = useTierList();
  const [localRows, setLocalRows] = useState(() =>
    state.rows.map((r) => ({ id: r.id, label: r.label, color: r.color }))
  );

  const updateLocal = (id: string, changes: Partial<{ label: string; color: string }>) => {
    setLocalRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  };

  const handleRemoveRow = (id: string) => {
    setLocalRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    setLocalRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: `Tier ${prev.length + 1}`, color: PRESET_COLORS[prev.length % PRESET_COLORS.length] },
    ]);
  };

  const handleConfirm = () => {
    // 更新现有行
    for (const lr of localRows) {
      const existing = state.rows.find((r) => r.id === lr.id);
      if (existing) {
        if (existing.label !== lr.label || existing.color !== lr.color) {
          dispatch({ type: 'UPDATE_ROW', rowId: lr.id, changes: { label: lr.label, color: lr.color } });
        }
      } else {
        dispatch({ type: 'ADD_ROW', row: { id: lr.id, label: lr.label, color: lr.color, items: [] } });
      }
    }
    // 删除被移除的行
    for (const r of state.rows) {
      if (!localRows.find((lr) => lr.id === r.id)) {
        dispatch({ type: 'REMOVE_ROW', rowId: r.id });
      }
    }
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content className={styles.dialog}>
        <Dialog.Title>配置等级</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          自定义等级名称和颜色
        </Dialog.Description>

        {localRows.map((row) => (
          <div key={row.id} className={styles.rowItem}>
            <input
              type="color"
              className={styles.colorInput}
              value={row.color}
              onChange={(e) => updateLocal(row.id, { color: e.target.value })}
            />
            <input
              className={styles.labelInput}
              value={row.label}
              onChange={(e) => updateLocal(row.id, { label: e.target.value })}
              placeholder="等级名称"
            />
            {localRows.length > 2 && (
              <button className={styles.removeRowBtn} onClick={() => handleRemoveRow(row.id)}>
                <MdClose size={18} />
              </button>
            )}
          </div>
        ))}

        <Button variant="soft" className={styles.addBtn} onClick={handleAddRow}>
          <MdAdd /> 添加等级
        </Button>

        <div className={styles.actions}>
          <Button variant="soft" color="gray" onClick={onClose}>取消</Button>
          <Button onClick={handleConfirm}>确定</Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
