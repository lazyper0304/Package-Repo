import React, { useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';
import type { TierItem as TierItemType } from '../../types';
import { useTierList } from '../../store/TierListContext';
import styles from './index.module.less';

interface Props {
  item: TierItemType;
  containerId: string;
}

// 全局拖拽状态
let draggedItem: { item: TierItemType; sourceContainer: string } | null = null;

export const TierItem: React.FC<Props> = ({ item, containerId }) => {
  const { dispatch } = useTierList();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    draggedItem = { item, sourceContainer: containerId };
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);

    // 创建拖拽预览图
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    e.dataTransfer.setDragImage(el, rect.width / 2, rect.height / 2);
  };

  const handleDragEnd = () => {
    draggedItem = null;
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (containerId === 'pool') {
      dispatch({ type: 'REMOVE_POOL_ITEM', id: item.id });
    } else {
      dispatch({ type: 'MOVE_TO_POOL', itemId: item.id });
    }
  };

  return (
    <div
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {item.type === 'text' ? (
        <span className={styles.text}>{item.content}</span>
      ) : (
        <img src={item.content} alt="" className={styles.image} draggable={false} />
      )}
      <button
        className={styles.removeBtn}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleRemove}
      >
        <MdClose size={12} />
      </button>
    </div>
  );
};

export { draggedItem };
export type DraggedItem = { item: TierItemType; sourceContainer: string };
