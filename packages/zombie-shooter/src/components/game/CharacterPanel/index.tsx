import { useState, useMemo } from 'react';
import { Card, Text, Badge, Button, ContextMenu } from '@radix-ui/themes';
import type { RewardItem } from '@/game/data/rewards';
import { QUALITY_CONFIG, type Quality } from '@/game/data/gems';
import { ELEMENT_INFO, type ElementType } from '@/game/data/equipment';
import { HoverPopup } from '../HoverPopup';
import styles from './index.module.less';

interface CharacterPanelProps {
  inventory: RewardItem[];
  equippedItems: Record<string, RewardItem | null>;
  onEquip: (item: RewardItem, slot: string) => void;
  onUnequip: (slot: string) => void;
  onEnchant: (gem: RewardItem, equipSlot: string) => void;
  onUnenchant: (equipSlot: string, gemIndex: number) => void;
  onRefine: (item: RewardItem, affixIndex: number) => void;
  onMergeGems: () => void;
}

const EQUIP_SLOTS = [
  { id: 'helmet', name: '头盔', icon: '🪖' },
  { id: 'armor', name: '盔甲', icon: '🛡️' },
  { id: 'shoulder', name: '肩甲', icon: '💪' },
  { id: 'legs', name: '腿甲', icon: '👖' },
  { id: 'boots', name: '战靴', icon: '👢' },
];

const QUALITY_ORDER: Quality[] = ['mythic', 'legendary', 'perfect', 'elite', 'excellent', 'common'];

const slotNames: Record<string, string> = {
  helmet: '头盔',
  armor: '盔甲',
  shoulder: '肩甲',
  legs: '腿甲',
  boots: '战靴',
};

const slotIcons: Record<string, string> = {
  helmet: '🪖',
  armor: '🛡️',
  shoulder: '💪',
  legs: '👖',
  boots: '👢',
};

type InventoryTab = 'gems' | 'equipment' | 'materials';
type SlotFilter = 'all' | string;

export function CharacterPanel({ inventory, equippedItems, onEquip, onUnequip, onEnchant, onUnenchant, onRefine, onMergeGems }: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('gems');
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');

  const gems = inventory.filter(i => i.type === 'gem');
  const equipment = inventory.filter(i => i.type === 'equipment');
  const materials = inventory.filter(i => i.type === 'material');

  // 按部位筛选 + 按品质排序
  const currentItems = useMemo(() => {
    let items = activeTab === 'gems' ? gems : activeTab === 'equipment' ? equipment : materials;

    // 按部位筛选（只对宝石和装备有效）
    if (slotFilter !== 'all' && activeTab !== 'materials') {
      items = items.filter(item => (item.data as any)?.slot === slotFilter);
    }

    // 按品质排序（高品质在前）
    items = [...items].sort((a, b) => {
      const aIndex = QUALITY_ORDER.indexOf(a.quality);
      const bIndex = QUALITY_ORDER.indexOf(b.quality);
      return aIndex - bIndex;
    });

    return items;
  }, [activeTab, slotFilter, gems, equipment, materials]);

  // 获取物品提示信息
  const getItemTooltip = (item: RewardItem) => {
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
        lines.push(affix.description || affix.name);
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
      // 元素伤害在 affixRow 中单独显示，不在文本中重复
    }

    return lines.join('\n');
  };

  // 计算装备属性总和
  const totalEquipStats = Object.values(equippedItems).reduce((acc, item) => {
    if (!item || !item.data) return acc;
    const data = item.data as any;
    return {
      attack: (acc.attack || 0) + (data.attack || 0),
      hp: (acc.hp || 0) + (data.hp || 0),
    };
  }, { attack: 0, hp: 0 });

  // 计算各系元素伤害
  const elementDamageByType: Record<string, number> = {};
  Object.values(equippedItems).forEach(item => {
    if (!item || !item.data) return;
    const data = item.data as any;
    if (data.affixes) {
      data.affixes.forEach((affix: any) => {
        if (affix.elementType && affix.damage > 0) {
          elementDamageByType[affix.elementType] = (elementDamageByType[affix.elementType] || 0) + affix.damage;
        }
      });
    }
  });
  const totalElementDamage = Object.values(elementDamageByType).reduce((sum, v) => sum + v, 0);

  const ELEMENT_INFO: Record<string, { name: string; icon: string; color: string }> = {
    fire: { name: '火', icon: '🔥', color: '#ef4444' },
    thunder: { name: '雷', icon: '⚡', color: '#f59e0b' },
    water: { name: '水', icon: '💧', color: '#3b82f6' },
    wind: { name: '风', icon: '🌪️', color: '#22c55e' },
    earth: { name: '土', icon: '🪨', color: '#a855f7' },
  };

  // 计算宝石属性总和（所有词条，含品质颜色）
  const totalGemStats = Object.values(equippedItems).reduce((acc, item) => {
    if (!item || !item.data) return acc;
    const gems = (item.data as any).enchantedGems || [];
    gems.forEach((gem: any) => {
      if (gem.data?.affixes) {
        gem.data.affixes.forEach((affix: any) => {
          const key = affix.description || affix.name;
          if (key) {
            if (!acc[key]) {
              acc[key] = { value: 0, quality: gem.quality || 'common' };
            }
            acc[key].value += (affix.value || 1);
          }
        });
      }
    });
    return acc;
  }, {} as Record<string, { value: number; quality: string }>);

  // 计算总属性
  const baseAttack = 100;
  const baseHp = 2000;
  const baseCritRate = 5;
  const baseCritDamage = 300;
  const baseDodgeRate = 0;
  const baseHitRate = 100;

  const totalAttack = baseAttack + totalEquipStats.attack;
  const totalHp = baseHp + totalEquipStats.hp;
  const totalCritRate = baseCritRate + (totalGemStats['暴击率增加'] || 0);
  const totalCritDamage = baseCritDamage + (totalGemStats['暴击伤害增幅'] || 0);
  const totalDodgeRate = baseDodgeRate + (totalGemStats['闪避率增加'] || 0);
  const totalHitRate = baseHitRate + (totalGemStats['命中率增加'] || 0);

  return (
    <div className={styles.characterPanel}>
      {/* 上层：角色 + 装备 + 属性 */}
      <div className={styles.topSection}>
        {/* 角色和装备行 */}
        <div className={styles.characterRow}>
          {/* 人物卡片 */}
          <div className={styles.characterCard}>
            <div className={styles.characterBody}>
              <div className={styles.characterHead}>😎</div>
              <div className={styles.characterTorso}>👕</div>
              <div className={styles.characterLegs}>👖</div>
            </div>
          </div>

          {/* 装备槽 - 竖向 */}
          <div className={styles.equipSlotsVertical}>
            {EQUIP_SLOTS.map((slot) => {
                const equipped = equippedItems[slot.id];
                const qualityColor = equipped ? QUALITY_CONFIG[equipped.quality]?.color || '#9ca3af' : 'rgba(255,255,255,0.2)';

                return (
                  <ContextMenu.Root key={slot.id}>
                    <ContextMenu.Trigger>
                      <HoverPopup
                        trigger={
                          <div
                            className={`${styles.equipSlotV} ${equipped ? styles.equipped : ''}`}
                            style={{ borderColor: qualityColor }}
                          >
                            <div className={styles.slotIcon}>
                              <Text size="2">{slot.icon}</Text>
                            </div>
                            <div className={styles.slotInfo}>
                              <Text size="1" weight="bold">{slot.name}</Text>
                              {equipped ? (
                                <Text size="1" style={{ color: qualityColor }}>
                                  {QUALITY_CONFIG[equipped.quality]?.name || '未知'}
                                </Text>
                              ) : (
                                <Text size="1" color="gray">未装备</Text>
                              )}
                            </div>
                          </div>
                        }
                  >
                    {equipped && (
                      <div className={styles.equipTooltip}>
                        <Text size="2" weight="bold" style={{ color: qualityColor }}>
                          {slotNames[(equipped.data as any)?.slot] || ''}
                        </Text>
                        <Text size="1">品质: {QUALITY_CONFIG[equipped.quality]?.name || '未知'}</Text>
                        <Text size="1">攻击: +{(equipped.data as any)?.attack || 0}</Text>
                        <Text size="1">生命: +{(equipped.data as any)?.hp || 0}</Text>

                        {/* 元素伤害词条 */}
                        {(equipped.data as any)?.affixes?.length > 0 && (
                          <div className={styles.elementAffixes}>
                            <Text size="1" weight="bold">元素伤害:</Text>
                            {(equipped.data as any).affixes.map((affix: any, i: number) => {
                              const elemType = affix.elementType;
                              const elem = elemType ? ELEMENT_INFO[elemType as ElementType] : null;
                              const damage = affix.damage || 0;
                              const isEmpty = damage === 0;
                              return (
                                <div key={i} className={styles.affixRow}>
                                  <Text size="1" color={isEmpty ? 'gray' : undefined} style={isEmpty ? {} : { color: elem?.color }}>
                                    {isEmpty ? '未洗练' : `${elem?.icon || '✨'} ${elem?.name || '元素'}系伤害+${damage}`}
                                  </Text>
                                  <Button
                                    size="1"
                                    variant="soft"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRefine(equipped, i);
                                    }}
                                  >
                                    洗练
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 宝石孔位 */}
                        {(() => {
                          const equippedData = equipped.data as any;
                          const enchantedGems = equippedData?.enchantedGems || [];
                          const gemSlots = equippedData?.gemSlots || 0;
                          return (
                            <>
                              <div className={styles.gemSlots}>
                                <Text size="1" weight="bold">宝石孔位:</Text>
                                <div className={styles.gemSlotsGrid}>
                                  {Array.from({ length: gemSlots }).map((_, i) => (
                                    <div key={i} className={styles.gemSlot}>
                                      {enchantedGems[i] ? (
                                        <Text size="1">💎</Text>
                                      ) : (
                                        <Text size="1" color="gray">空</Text>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {enchantedGems.length > 0 && (
                                <div className={styles.enchantedGems}>
                                  <Text size="1" weight="bold">附魔词条:</Text>
                                  {enchantedGems.map((gem: any, i: number) => (
                                    <div key={i} className={styles.enchantedGemItem}>
                                      {gem.data?.affixes?.map((affix: any, j: number) => (
                                        <Text key={`${i}-${j}`} size="1">{affix.name || affix.description}</Text>
                                      ))}
                                      <Button
                                        size="1"
                                        variant="soft"
                                        color="red"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUnenchant(slot.id, i);
                                        }}
                                      >
                                        卸下
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </HoverPopup>
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

        {/* 属性区 */}
        <div className={styles.characterStats}>
            <div className={styles.statsSection}>
              <Text size="3" weight="bold" style={{ marginBottom: 4 }}>角色属性</Text>
              <div className={styles.statRow}>
                <Text size="1" color="gray">生命</Text>
                <Text size="1" weight="bold">
                  {baseHp}
                  {totalEquipStats.hp > 0 && <Text size="1" color="green"> (+{totalEquipStats.hp})</Text>}
                </Text>
              </div>
              <div className={styles.statRow}>
                <Text size="1" color="gray">攻击</Text>
                <Text size="1" weight="bold">
                  {baseAttack}
                  {totalEquipStats.attack > 0 && <Text size="1" color="green"> (+{totalEquipStats.attack})</Text>}
                </Text>
              </div>
              <div className={styles.statRow}>
                <Text size="1" color="gray">暴击率</Text>
                <Text size="1" weight="bold">{totalCritRate}%</Text>
              </div>
              <div className={styles.statRow}>
                <Text size="1" color="gray">暴击增幅</Text>
                <Text size="1" weight="bold">{totalCritDamage}%</Text>
              </div>
              <div className={styles.statRow}>
                <Text size="1" color="gray">闪避率</Text>
                <Text size="1" weight="bold">{totalDodgeRate}%</Text>
              </div>
              <div className={styles.statRow}>
                <Text size="1" color="gray">命中率</Text>
                <Text size="1" weight="bold">{totalHitRate}%</Text>
              </div>
              {totalElementDamage > 0 && Object.entries(elementDamageByType).map(([element, damage]) => {
                const info = ELEMENT_INFO[element];
                if (!info || damage <= 0) return null;
                return (
                  <div key={element} className={styles.statRow}>
                    <Text size="1" color="gray">{info.icon} {info.name}系伤害</Text>
                    <Text size="1" weight="bold" style={{ color: info.color }}>+{damage}</Text>
                  </div>
                );
              })}
            </div>

            <div className={styles.statsSection}>
              <Text size="3" weight="bold" style={{ marginBottom: 4 }}>宝石属性</Text>
              {Object.keys(totalGemStats).length > 0 ? (
                Object.entries(totalGemStats).map(([name, data]) => (
                  <Text key={name} size="1" style={{ color: QUALITY_CONFIG[data.quality as Quality]?.color || '#ffffff' }}>{name}</Text>
                ))
              ) : (
                <Text size="1" color="gray">无</Text>
              )}
            </div>
          </div>
        </div>

      {/* 背包管理区 */}
      <div className={styles.inventorySection}>
        <div className={styles.inventoryHeader}>
          <Text size="3" weight="bold">背包</Text>
          {activeTab === 'gems' && <Button size="2" variant="soft" onClick={onMergeGems}>一键合成</Button>}
        </div>

        {/* 分类标签 */}
        <div className={styles.inventoryTabs}>
          <div
            className={`${styles.tab} ${activeTab === 'gems' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('gems'); setSlotFilter('all'); }}
          >
            宝石
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'equipment' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('equipment'); setSlotFilter('all'); }}
          >
            装备
          </div>
          <div
            className={`${styles.tab} ${activeTab === 'materials' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('materials'); setSlotFilter('all'); }}
          >
            材料
          </div>
        </div>

        {/* 部位筛选标签（宝石和装备时显示） */}
        {activeTab !== 'materials' && (
          <div className={styles.slotFilterTabs}>
            <div
              className={`${styles.slotTab} ${slotFilter === 'all' ? styles.slotTabActive : ''}`}
              onClick={() => setSlotFilter('all')}
            >
              全部
            </div>
            {EQUIP_SLOTS.map(slot => (
              <div
                key={slot.id}
                className={`${styles.slotTab} ${slotFilter === slot.id ? styles.slotTabActive : ''}`}
                onClick={() => setSlotFilter(slot.id)}
              >
                {slot.name}
              </div>
            ))}
          </div>
        )}

        {/* 物品网格 */}
        <div className={styles.inventoryGrid}>
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ContextMenu.Root key={item.id}>
                <ContextMenu.Trigger>
                  <HoverPopup
                    trigger={
                      <div className={styles.itemCard} style={{ borderColor: QUALITY_CONFIG[item.quality]?.color || '#9ca3af' }}>
                        <div className={styles.itemIcon}>
                          {item.type === 'gem'
                            ? '💎'
                            : slotIcons[(item.data as any)?.slot] || '🛡️'}
                        </div>
                        <Text size="1" className={styles.itemName}>
                          {`${slotNames[(item.data as any)?.slot] || ''}${item.type === 'gem' ? '宝石' : ''}`}
                        </Text>
                        <div className={styles.itemBadge}>
                          <Badge
                            size="1"
                            style={{ backgroundColor: QUALITY_CONFIG[item.quality]?.color || '#9ca3af', color: '#ffffff' }}
                          >
                            {QUALITY_CONFIG[item.quality]?.name || '未知'}
                          </Badge>
                        </div>
                      </div>
                    }
                  >
                    <div className={styles.itemTooltip}>
                      <Text size="1" style={{ whiteSpace: 'pre-line', marginBottom: 8 }}>{getItemTooltip(item)}</Text>
                      <div className={styles.itemActions}>
                        {item.type === 'equipment' && (
                          <>
                            <Button size="1" onClick={() => onEquip(item, (item.data as any)?.slot || 'armor')}>
                              装备
                            </Button>
                            {(item.data as any)?.affixes?.map((affix: any, idx: number) => {
                              const damage = affix.damage || 0;
                              const isEmpty = damage === 0;
                              const elemType = affix.elementType;
                              const elem = elemType ? ELEMENT_INFO[elemType as ElementType] : null;
                              return (
                                <div key={idx} className={styles.affixRow}>
                                  <Text size="1" color={isEmpty ? 'gray' : undefined} style={isEmpty ? {} : { color: elem?.color }}>
                                    {isEmpty ? '未洗练' : `${elem?.icon || '✨'} ${elem?.name || '元素'}系伤害+${damage}`}
                                  </Text>
                                  <Button size="1" variant="soft" onClick={() => onRefine(item, idx)}>
                                    洗练
                                  </Button>
                                </div>
                              );
                            })}
                          </>
                        )}
                        {item.type === 'gem' && (
                          <>
                            <Button size="1" onClick={() => onEnchant(item, (item.data as any)?.slot || 'helmet')}>
                              附魔
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </HoverPopup>
                </ContextMenu.Trigger>

                <ContextMenu.Content>
                  {item.type === 'equipment' && (
                    <>
                      {EQUIP_SLOTS.map((slot) => (
                        <ContextMenu.Item key={slot.id} onClick={() => onEquip(item, slot.id)}>
                          装备到{slot.name}
                        </ContextMenu.Item>
                      ))}
                      <ContextMenu.Separator />
                      {(item.data as any)?.affixes?.map((affix: any, idx: number) => {
                        const damage = affix.damage || 0;
                        const isEmpty = damage === 0;
                        const elemType = affix.elementType;
                        const elem = elemType ? ELEMENT_INFO[elemType as ElementType] : null;
                        return (
                          <ContextMenu.Item key={idx} onClick={() => onRefine(item, idx)}>
                            {isEmpty ? '洗练元素伤害' : `${elem?.icon || '✨'} 洗练${elem?.name || '元素'}伤害 (${damage})`}
                          </ContextMenu.Item>
                        );
                      })}
                    </>
                  )}

                  {item.type === 'gem' && item.data && (
                    <>
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
