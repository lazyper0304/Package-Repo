import { useState, useCallback } from 'react';
import { Card, Text, Badge, ContextMenu } from '@radix-ui/themes';
import type { RewardItem } from '@/game/data/rewards';
import { QUALITY_CONFIG } from '@/game/data/gems';
import styles from './index.module.less';

interface InventoryGridProps {
  items: RewardItem[];
  onItemClick?: (item: RewardItem) => void;
  onEquip?: (item: RewardItem) => void;
  onUnequip?: (item: RewardItem) => void;
  onDecompose?: (item: RewardItem) => void;
}

export function InventoryGrid({ items, onItemClick, onEquip, onUnequip, onDecompose }: InventoryGridProps) {
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);

  const handleClick = useCallback((item: RewardItem) => {
    setSelectedItem(item);
    onItemClick?.(item);
  }, [onItemClick]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size="2" color="gray">暂无物品</Text>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <ContextMenu.Root key={item.id}>
          <ContextMenu.Trigger>
            <Card
              className={styles.item}
              style={{ borderColor: QUALITY_CONFIG[item.quality].color }}
              onClick={() => handleClick(item)}
            >
              <div className={styles.itemIcon}>
                {item.type === 'gem' ? '💎' : item.type === 'equipment' ? '🛡️' : '📦'}
              </div>
              <Text size="1" weight="bold" className={styles.itemName}>
                {item.name}
              </Text>
              <Badge
                style={{ backgroundColor: QUALITY_CONFIG[item.quality].color }}
                size="1"
                className={styles.qualityBadge}
              >
                {QUALITY_CONFIG[item.quality].name}
              </Badge>
            </Card>
          </ContextMenu.Trigger>

          <ContextMenu.Content>
            {onEquip && (
              <ContextMenu.Item onClick={() => onEquip(item)}>
                装备
              </ContextMenu.Item>
            )}
            {onUnequip && (
              <ContextMenu.Item onClick={() => onUnequip(item)}>
                卸下
              </ContextMenu.Item>
            )}
            {onDecompose && (
              <ContextMenu.Item onClick={() => onDecompose(item)} color="red">
                分解
              </ContextMenu.Item>
            )}
          </ContextMenu.Content>
        </ContextMenu.Root>
      ))}
    </div>
  );
}
