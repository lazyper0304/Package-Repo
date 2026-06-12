import { useState } from 'react';
import { Card, Text, Button, Badge, Progress, IconButton, Tooltip } from '@radix-ui/themes';
import { MdMail, MdPerson, MdChat, MdShoppingCart, MdPeople } from 'react-icons/md';
import type { RewardItem } from '../../../game/data/rewards';
import { identifyReward } from '../../../game/data/rewards';
import { QUALITY_CONFIG } from '../../../game/data/gems';
import { CharacterPanel } from '../CharacterPanel';
import styles from './index.module.less';

interface LobbyProps {
  bestScore: number;
  maxWave: number;
  inventory: RewardItem[];
  cores: RewardItem[];
  armors: RewardItem[];
  currency: { copper: number; silver: number; gold: number };
  initialStage: number;
  onStartGame: (startWave: number) => void;
}

type NavTab = 'shop' | 'character' | 'battle' | 'core' | 'base';
type Difficulty = 'normal' | 'elite';

export function Lobby({ bestScore, maxWave, inventory, cores, armors, currency, initialStage, onStartGame }: LobbyProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('battle');
  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [equippedItems, setEquippedItems] = useState<Record<string, RewardItem | null>>({
    helmet: null,
    armor: null,
    shoulder: null,
    legs: null,
    boots: null,
  });

  const currentStage = maxWave + 1;
  const maxVisible = Math.min(Math.max(maxWave + 4, 10), 100);
  const canChallenge = selectedStage <= currentStage;

  const stageNames: Record<number, string> = {
    1: '废弃工厂', 2: '城市街道', 3: '地下车库', 4: '购物中心', 5: '医院大厅',
    6: '学校操场', 7: '公园广场', 8: '地铁站', 9: '港口码头', 10: '军事基地',
  };
  const stageName = stageNames[selectedStage] || `关卡 ${selectedStage}`;

  // 装备处理函数
  const handleEquip = (item: RewardItem, slot: string) => {
    setEquippedItems(prev => ({
      ...prev,
      [slot]: item,
    }));
  };

  const handleUnequip = (slot: string) => {
    setEquippedItems(prev => ({
      ...prev,
      [slot]: null,
    }));
  };

  const handleEnchant = (gem: RewardItem, equipSlot: string) => {
    // 宝石附魔到装备 - 暂时只是记录
    console.log('Enchanting', gem.name, 'to', equipSlot);
  };

  const handleIdentify = (item: RewardItem) => {
    // 鉴定物品
    const identifiedItem = identifyReward(item);
    // 更新背包中的物品
    setInventory(prev =>
      prev.map(i => i.id === item.id ? identifiedItem : i)
    );
  };

  const handleRefine = (item: RewardItem) => {
    // 洗练装备元素伤害
    if (item.type === 'equipment' && item.data) {
      const equipData = item.data as any;
      const maxDamage = equipData.maxElementDamage || 2000;
      const newDamage = Math.floor(maxDamage * (Math.random() * 0.4 + 0.6));

      if (newDamage > (equipData.elementDamage || 0)) {
        const updatedItem = {
          ...item,
          data: {
            ...equipData,
            elementDamage: newDamage,
            affixes: equipData.affixes?.map((affix: any) => ({
              ...affix,
              elementPercent: Math.round((newDamage / maxDamage) * 100),
            })),
          },
        };
        setInventory(prev =>
          prev.map(i => i.id === item.id ? updatedItem : i)
        );
      }
    }
  };

  // 通关条件
  const getClearConditions = (stage: number) => {
    const isCompleted = stage <= maxWave;
    return [
      { name: '成功通关', completed: isCompleted, icon: '🏆' },
      { name: '50%血量通关', completed: isCompleted, icon: '❤️' },
      { name: '完美通关', completed: false, icon: '⭐' },
    ];
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.lobbyContainer}>
        {/* 顶部状态栏 */}
        <div className={styles.topBar}>
          <div className={styles.playerInfo}>
            <div className={styles.avatar}>
              <Text size="4">🎮</Text>
              <Badge color="orange" size="1" className={styles.levelBadge}>Lv.{maxWave}</Badge>
            </div>
            <div className={styles.playerDetails}>
              <Text size="3" weight="bold">玩家</Text>
              <div className={styles.resources}>
                <div className={styles.resourceItem}>
                  <Text size="1">🪙</Text>
                  <Text size="2">{currency.copper}</Text>
                </div>
                <div className={styles.resourceItem}>
                  <Text size="1">🥈</Text>
                  <Text size="2">{currency.silver}</Text>
                </div>
                <div className={styles.resourceItem}>
                  <Text size="1">⚡</Text>
                  <Text size="2">10/10</Text>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.topActions}>
            <IconButton variant="soft" size="2" radius="full"><MdMail size={18} /></IconButton>
            <IconButton variant="soft" size="2" radius="full"><MdPerson size={18} /></IconButton>
            <IconButton variant="soft" size="2" radius="full"><MdPeople size={18} /></IconButton>
            <IconButton variant="soft" size="2" radius="full"><MdChat size={18} /></IconButton>
          </div>
        </div>

        {/* 主内容区 */}
        <div className={styles.mainContent}>
          {activeTab === 'battle' && (
            <>
              {/* 副本信息区 */}
              <div className={styles.stageInfo}>
                <div className={styles.stageHeader}>
                  <Text size="5" weight="bold">{selectedStage}. {stageName}</Text>
                  <Badge color={canChallenge ? 'orange' : 'green'} size="2">
                    {canChallenge ? '可挑战' : '已通关'}
                  </Badge>
                </div>

                {/* 难度切换 */}
                <div className={styles.difficultySwitch}>
                  <Button
                    size="2"
                    variant={difficulty === 'normal' ? 'solid' : 'soft'}
                    onClick={() => setDifficulty('normal')}
                  >
                    普通
                  </Button>
                  <Button
                    size="2"
                    variant={difficulty === 'elite' ? 'solid' : 'soft'}
                    onClick={() => setDifficulty('elite')}
                  >
                    精英
                  </Button>
                </div>

                {/* 副本预览图 */}
                <div className={styles.stagePreview}>
                  <div className={styles.previewScene}>
                    <div className={styles.sceneBackground}>
                      <div className={styles.building1}>🏢</div>
                      <div className={styles.building2}>🏬</div>
                      <div className={styles.tree}>🌳</div>
                      <div className={styles.zombie}>🧟</div>
                    </div>
                  </div>
                  <div className={styles.previewNav}>
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => setSelectedStage(Math.max(1, selectedStage - 1))}
                      disabled={selectedStage <= 1}
                    >
                      ◀
                    </Button>
                    <Text size="2" color="gray">{selectedStage} / {maxVisible}</Text>
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => setSelectedStage(Math.min(maxVisible, selectedStage + 1))}
                      disabled={selectedStage >= maxVisible}
                    >
                      ▶
                    </Button>
                  </div>
                </div>

                {/* 进度奖励区 - 三个宝箱 */}
                <div className={styles.rewardProgress}>
                  <div className={styles.rewardNode}>
                    <Tooltip content="奖励：宝石、装备">
                      <div className={`${styles.rewardBox} ${selectedStage <= maxWave ? styles.rewardUnlocked : ''}`}>
                        <Text size="3">🏆</Text>
                      </div>
                    </Tooltip>
                    <Text size="1" color="gray">成功通关</Text>
                  </div>
                  <Progress value={selectedStage <= maxWave ? 100 : 0} size="1" className={styles.progressBar} />
                  <div className={styles.rewardNode}>
                    <Tooltip content="奖励：宝石、装备 + 50金条">
                      <div className={styles.rewardBox}>
                        <Text size="3">❤️</Text>
                      </div>
                    </Tooltip>
                    <Text size="1" color="gray">50%血量</Text>
                  </div>
                  <Progress value={0} size="1" className={styles.progressBar} />
                  <div className={styles.rewardNode}>
                    <Tooltip content="奖励：宝石、装备 + 200金条">
                      <div className={styles.rewardBox}>
                        <Text size="3">⭐</Text>
                      </div>
                    </Tooltip>
                    <Text size="1" color="gray">完美通关</Text>
                  </div>
                </div>
              </div>

              {/* 开始游戏按钮 */}
              <div className={styles.bottomAction}>
                <Button
                  size="4"
                  className={styles.startButton}
                  onClick={() => canChallenge && onStartGame(selectedStage)}
                  disabled={!canChallenge}
                >
                  {canChallenge ? '开始游戏' : '请先通关前置关卡'}
                </Button>
              </div>
            </>
          )}

          {activeTab === 'character' && (
            <CharacterPanel
              inventory={inventory}
              equippedItems={equippedItems}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onEnchant={handleEnchant}
              onIdentify={handleIdentify}
              onRefine={handleRefine}
            />
          )}

          {activeTab === 'shop' && (
            <div className={styles.shopPanel}>
              <Text size="4" weight="bold" style={{ marginBottom: 16 }}>商城 - 抽奖</Text>
              <div className={styles.gachaInfo}>
                <Text size="2" color="gray">抽奖产出：宝石(85%)、核心(10%)、装甲(5%)</Text>
              </div>
              <div className={styles.gachaButtons}>
                <Button size="3" variant="soft" disabled={currency.gold < 200}>单抽 - 200金条</Button>
                <Button size="3" disabled={currency.gold < 1800}>10连抽 - 1800金条 (9折)</Button>
              </div>
              <div className={styles.currentGold}>
                <Text size="2">当前金条: {currency.gold}</Text>
              </div>
            </div>
          )}

          {activeTab === 'core' && (
            <div className={styles.emptyState}>
              <Text size="6">💎</Text>
              <Text size="3" color="gray">核心系统</Text>
              <Text size="2" color="gray">通过商城抽奖获得核心和装甲</Text>
            </div>
          )}

          {activeTab === 'base' && (
            <div className={styles.emptyState}>
              <Text size="6">🏠</Text>
              <Text size="3" color="gray">基地</Text>
              <Text size="2" color="gray">即将开放</Text>
            </div>
          )}
        </div>

        {/* 底部导航栏 */}
        <div className={styles.bottomNav}>
          <div className={`${styles.navItem} ${activeTab === 'shop' ? styles.navActive : ''}`} onClick={() => setActiveTab('shop')}>
            <MdShoppingCart size={20} />
            <Text size="1">商城</Text>
          </div>
          <div className={`${styles.navItem} ${activeTab === 'character' ? styles.navActive : ''}`} onClick={() => setActiveTab('character')}>
            <MdPerson size={20} />
            <Text size="1">角色</Text>
          </div>
          <div className={`${styles.navItem} ${activeTab === 'battle' ? styles.navActive : ''}`} onClick={() => setActiveTab('battle')}>
            <Text size="3">⚔️</Text>
            <Text size="1">战斗</Text>
          </div>
          <div className={`${styles.navItem} ${activeTab === 'core' ? styles.navActive : ''}`} onClick={() => setActiveTab('core')}>
            <Text size="3">💎</Text>
            <Text size="1">核心</Text>
          </div>
          <div className={`${styles.navItem} ${activeTab === 'base' ? styles.navActive : ''}`} onClick={() => setActiveTab('base')}>
            <Text size="3">🏠</Text>
            <Text size="1">基地</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
