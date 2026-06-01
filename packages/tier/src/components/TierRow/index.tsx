import React, { useState } from 'react';
import { TierItem, draggedItem } from '../TierItem';
import { useTierList } from '../../store/TierListContext';
import type { TierRow as TierRowType } from '../../types';
import styles from './index.module.less';

interface Props {
  row: TierRowType;
}

export const TierRow: React.FC<Props> = ({ row }) => {
  const { dispatch } = useTierList();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (!draggedItem) return;

    const { item, sourceContainer } = draggedItem;

    if (sourceContainer === row.id) return;

    // 从其他行或素材库移到这一行
    if (sourceContainer === 'pool') {
      dispatch({ type: 'REMOVE_POOL_ITEM', id: item.id });
    } else {
      dispatch({ type: 'MOVE_TO_POOL', itemId: item.id });
    }
    dispatch({ type: 'MOVE_TO_ROW', itemId: item.id, rowId: row.id });
  };

  return (
    <div className={styles.row}>
      <div className={styles.label} style={{ backgroundColor: row.color }}>
        {row.label}
      </div>
      <div
        className={`${styles.items} ${isOver ? styles.itemsDropOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {row.items.length > 0 ? (
          row.items.map((item) => (
            <TierItem key={item.id} item={item} containerId={row.id} />
          ))
        ) : (
          <span className={styles.emptyHint}>拖拽素材到此处</span>
        )}
      </div>
    </div>
  );
};
