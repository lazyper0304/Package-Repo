import React, { useState } from 'react';
import { Card } from '@radix-ui/themes';
import { TierItem, draggedItem } from '../TierItem';
import { TextCardInput } from '../TextCardInput';
import { ImageImporter } from '../ImageImporter';
import { useTierList } from '../../store/TierListContext';
import styles from './index.module.less';

export const ItemPool: React.FC = () => {
  const { state, dispatch } = useTierList();
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

    // 从行里拖回素材库
    if (sourceContainer !== 'pool') {
      dispatch({ type: 'MOVE_TO_POOL', itemId: item.id });
    }
  };

  return (
    <Card className={styles.pool}>
      <div className={styles.poolHeader}>
        <span className={styles.poolTitle}>素材库</span>
        <TextCardInput />
        <ImageImporter />
      </div>
      <div
        className={`${styles.poolItems} ${isOver ? styles.poolItemsDropOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {state.poolItems.length > 0 ? (
          state.poolItems.map((item) => (
            <TierItem key={item.id} item={item} containerId="pool" />
          ))
        ) : (
          <span className={styles.emptyHint}>添加文字或图片素材，然后拖拽到上方等级行</span>
        )}
      </div>
    </Card>
  );
};
