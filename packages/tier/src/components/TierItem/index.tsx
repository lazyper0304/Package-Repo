import React, { useRef, useState } from 'react';
import { MdClose, MdSettings } from 'react-icons/md';
import type { TierItem as TierItemType } from '../../types';
import { useTierList } from '../../store/TierListContext';
import { ItemConfigDialog } from '../ItemConfigDialog';
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
  const [configOpen, setConfigOpen] = useState(false);

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigOpen(true);
  };

  const handleSave = (changes: { textColor?: string; backgroundColor?: string }) => {
    dispatch({ type: 'UPDATE_ITEM', itemId: item.id, changes });
  };

  const cardStyle: React.CSSProperties = {
    ...(item.textColor && { color: item.textColor }),
    ...(item.backgroundColor && { background: item.backgroundColor }),
  };

  if (item.type === 'image') {
    return (
      <>
        <div
          className={`${styles.imageItem} ${isDragging ? styles.dragging : ''}`}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <img src={item.content} alt="" className={styles.image} draggable={false} />
          <div className={styles.actions}>
            <button
              className={styles.configBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleClick}
            >
              <MdSettings size={12} />
            </button>
            <button
              className={styles.removeBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleRemove}
            >
              <MdClose size={12} />
            </button>
          </div>
        </div>
        <ItemConfigDialog
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          item={item}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
        style={cardStyle}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <span className={styles.text}>{item.content}</span>
        <div className={styles.actions}>
          <button
            className={styles.configBtn}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
          >
            <MdSettings size={12} />
          </button>
          <button
            className={styles.removeBtn}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleRemove}
          >
            <MdClose size={12} />
          </button>
        </div>
      </div>
      <ItemConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        item={item}
        onSave={handleSave}
      />
    </>
  );
};

export { draggedItem };
export type DraggedItem = { item: TierItemType; sourceContainer: string };
