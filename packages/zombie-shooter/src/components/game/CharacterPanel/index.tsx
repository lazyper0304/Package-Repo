import { useState } from 'react';
import { Card, Text, Badge, Button, ContextMenu, Tooltip } from '@radix-ui/themes';
import type { RewardItem } from '../../../game/data/rewards';
import { QUALITY_CONFIG } from '../../../game/data/gems';
import styles from './index.module.less';

interface CharacterPanelProps {
  inventory: RewardItem[];
  equippedItems: Record<string, RewardItem | null>;
  onEquip: (item: RewardItem, slot: string) => void;
  onUnequip: (slot: string) => void;
  onEnchant: (gem: RewardItem, equipSlot: string) => void;
  onIdentify: (item: RewardItem) => void;
  onRefine: (item: RewardItem) => void;
}

const EQUIP_SLOTS = [
  { id: 'helmet', name: '头盔', icon: '🪖' },
  { id: 'armor', name: '盔甲', icon: '🛡️' },
  { id: 'shoulder', name: '肩甲', icon: '💪' },
  { id: 'legs', name: '腿甲', icon: '👖' },
  { id: 'boots', name: '战靴', icon: '👢' },
];

type InventoryTab = 'gems' | 'equipment' | 'materials';

export function CharacterPanel({ inventory, equippedItems, onEquip, onUnequip, onEnchant, onIdentify, onRefine }: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('gems');

  const gems = inventory.filter(i => i.type === 'gem');
  const equipment = inventory.filter(i => i.type === 'equipment');
  const materials = inventory.filter(i => i.type === 'material');

  const currentItems = activeTab === 'gems' ? gems : activeTab === 'equipment' ? equipment : materials;

  // 获取物品提示信息
  const getItemTooltip = (item: RewardItem) => {
    if (!item.identified) {
      return '未鉴定 - 右键鉴定';
    }

    const quality = QUALITY_CONFIG[item.quality];
    const lines = [item.name, `品质: ${quality?.name || '未知'}`];

    if (item.type === 'gem' && item.data && 'affixes' in item.data) {
      const gemData = item.data as any;
      const slotNames: Record<string, string> = {
        helmet: '头盔',
        armor: '盔甲',
        shoulder: '肩甲',
        legs: '腿甲',
        boots: '战靴',
      };
      lines.push(`部位: ${slotNames[gemData.slot] || '未知'}`);
      lines.push('---词条---');
      gemData.affixes?.forEach((affix: any) => {
        lines.push(affix.name || affix.description);
      });
    }

    if (item.type === 'equipment' && item.data && 'affixes' in item.data) {
      const equipData = item.data as any;
      const slotNames: Record<string, string> = {
        helmet: '头盔',
        armor: '盔甲',
        shoulder: '肩甲',
        legs: '腿甲',
        boots: '战靴',
      };
      lines.push(`部位: ${slotNames[equipData.slot] || '未知'}`);
      lines.push(`攻击: +${equipData.attack || 0}`);
      lines.push(`生命: +${equipData.hp || 0}`);
      if (equipData.elementDamage > 0) {
        lines.push('---元素伤害---');
        equipData.affixes?.forEach((affix: any) => {
          lines.push(`${affix.name} (${affix.elementPercent || 0}%)`);
        });
      }
    }

    return lines.join('\n');
  };

  return (
    <div className={styles.characterPanel}>
      {/* 角色主视觉区 */}
      <div className={styles.characterMain}>
        {/* 角色形象 */}
        <div className={styles.characterDisplay}>
          <div className={styles.characterModel}>
            <div className={styles.characterBody}>
              <div className={styles.characterHead}>😎</div>
              <div className={styles.characterTorso}>👕</div>
              <div className={styles.characterLegs}>👖</div>
            </div>
          </div>
          <Text size="3" weight="bold" style={{ marginTop: 8 }}>玩家</Text>
        </div>

        {/* 装备展示区 - 右侧竖排 */}
        <div className={styles.equipSlots}>
          {EQUIP_SLOTS.map((slot) => {
            const equipped = equippedItems[slot.id];
            return (
              <ContextMenu.Root key={slot.id}>
                <ContextMenu.Trigger>
                  <div className={`${styles.equipSlot} ${equipped ? styles.equipped : ''}`}>
                    <div className={styles.slotIcon}>
                      <Text size="2">{equipped ? '🛡️' : slot.icon}</Text>
                    </div>
                    <div className={styles.slotInfo}>
                      <Text size="1" weight="bold">{slot.name}</Text>
                      {equipped ? (
                        <div className={styles.equippedInfo}>
                          <Text size="1">{equipped.name}</Text>
                          <Badge
                            size="1"
                            style={{ backgroundColor: QUALITY_CONFIG[equipped.quality]?.color || '#9ca3af' }}
                          >
                            {QUALITY_CONFIG[equipped.quality]?.name || '未知'}
                          </Badge>
                        </div>
                      ) : (
                        <Text size="1" color="gray">未装备</Text>
                      )}
                    </div>
                  </div>
                </ContextMenu.Trigger>

                <ContextMenu.Content>
                  {equipped && (
                    <ContextMenu.Item onClick={() => onUnequip(slot.id)}>
                      卸下装备
                    </ContextMenu.Item>
                  )}
                  {equipment.map((item) => (
                    <ContextMenu.Item key={item.id} onClick={() => onEquip(item, slot.id)}>
                      装备 {item.name}
                    </ContextMenu.Item>
                  ))}
                  {gems.map((gem) => (
                    <ContextMenu.Item key={gem.id} onClick={() => onEnchant(gem, slot.id)}>
                      附魔 {gem.name}
                    </ContextMenu.Item>
                  ))}
                </ContextMenu.Content>
              </ContextMenu.Root>
            );
          })}
        </div>
      </div>

      {/* 背包管理区 */}
      <div className={styles.inventorySection}>
        <div className={styles.inventoryHeader}>
          <Text size="3" weight="bold">我的背包</Text>
          <Button size="2" variant="soft">一键合成</Button>
        </div>

        {/* 分类标签 */}
        <div className={styles.inventoryTabs}>
          <div
            className={`${styles.tab} ${activeTab === 'gems' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('gems')}
          >
            宝石
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'equipment' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            装备
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'materials' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            材料
          </div>
        </div>

        {/* 物品网格 */}
        <div className={styles.inventoryGrid}>
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ContextMenu.Root key={item.id}>
                <ContextMenu.Trigger>
                  <Tooltip content={<span style={{ whiteSpace: 'pre-line', display: 'block' }}>{getItemTooltip(item)}</span>}>
                    <div className={styles.itemCard} style={{ borderColor: QUALITY_CONFIG[item.quality]?.color || '#9ca3af' }}>
                      <div className={styles.itemIcon}>
                        {item.type === 'gem' ? '💎' : '🛡️'}
                      </div>
                      <Text size="1" className={styles.itemName}>{item.name}</Text>
                      <div className={styles.itemBadge}>
                        <Badge
                          size="1"
                          style={{ backgroundColor: QUALITY_CONFIG[item.quality]?.color || '#9ca3af' }}
                        >
                          {QUALITY_CONFIG[item.quality]?.name || '未知'}
                        </Badge>
                      </div>
                    </div>
                  </Tooltip>
                </ContextMenu.Trigger>

                <ContextMenu.Content>
                  {/* 未鉴定物品 - 显示鉴定选项 */}
                  {!item.identified && (
                    <ContextMenu.Item onClick={() => onIdentify(item)}>
                      鉴定
                    </ContextMenu.Item>
                  )}

                  {/* 已鉴定物品 - 显示装备/附魔/洗练选项 */}
                  {item.identified && item.type === 'equipment' && (
                    <>
                      {EQUIP_SLOTS.map((slot) => (
                        <ContextMenu.Item key={slot.id} onClick={() => onEquip(item, slot.id)}>
                          装备到{slot.name}
                        </ContextMenu.Item>
                      ))}
                      <ContextMenu.Separator />
                      <ContextMenu.Item onClick={() => onRefine(item)}>
                        洗练元素伤害
                      </ContextMenu.Item>
                    </>
                  )}

                  {item.identified && item.type === 'gem' && item.data && (
                    <>
                      {/* 只显示能附魔到的部位 */}
                      {EQUIP_SLOTS
                        .filter(slot => {
                          const gemData = item.data as any;
                          return gemData && gemData.slot === slot.id;
                        })
                        .map((slot) => (
                          <ContextMenu.Item key={slot.id} onClick={() => onEnchant(item, slot.id)}>
                            附魔到{slot.name}
                          </ContextMenu.Item>
                        ))
                      }
                    </>
                  )}
                </ContextMenu.Content>
              </ContextMenu.Root>
            ))
          ) : (
            <div className={styles.emptyGrid}>
              <Text size="2" color="gray">暂无物品</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
