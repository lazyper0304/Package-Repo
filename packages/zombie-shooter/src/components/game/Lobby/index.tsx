import { useState } from 'react'
import { Card, Text, Button, Badge, Progress, IconButton } from '@radix-ui/themes'
import { MdMail, MdPerson, MdChat, MdShoppingCart, MdPeople } from 'react-icons/md'
import type { RewardItem } from '@/game/data/rewards'
import { QUALITY_CONFIG, type Quality } from '@/game/data/gems'
import { getStageDropRates } from '@/game/data/rewards'
import { stageNames } from '@/utils/constants'
import { formatCurrency } from '@/utils/formatCurrency'
import { CharacterPanel } from '../CharacterPanel'
import { CorePanel } from '../CorePanel'
import { HoverPopup } from '../HoverPopup'
import styles from './index.module.less'

interface LobbyProps {
  bestScore: number
  maxWave: number
  inventory: RewardItem[]
  cores: RewardItem[]
  armors: RewardItem[]
  currency: { copper: number; silver: number; gold: number }
  initialStage: number
  equippedItems: Record<string, RewardItem | null>
  stageRecords: Record<number, number>
  onStartGame: (startWave: number, difficulty: 'normal' | 'elite') => void
  onRefine: (item: RewardItem, affixIndex: number) => void
  onEnchant: (gem: RewardItem, equipSlot: string) => void
  onUnenchant: (equipSlot: string, gemIndex: number) => void
  onEquip: (item: RewardItem, slot: string) => void
  onUnequip: (slot: string) => void
  onMergeGems: () => void
}

type NavTab = 'shop' | 'character' | 'battle' | 'core' | 'base'
type Difficulty = 'normal' | 'elite'

export function Lobby({
  bestScore,
  maxWave,
  inventory,
  cores,
  armors,
  currency,
  initialStage,
  equippedItems,
  stageRecords,
  onStartGame,
  onRefine,
  onEnchant,
  onUnenchant,
  onEquip,
  onUnequip,
  onMergeGems,
}: LobbyProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('battle')
  const [selectedStage, setSelectedStage] = useState(initialStage)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  const completedStage = maxWave >= 20 ? Math.floor(maxWave / 20) : 0
  const currentStage = completedStage + 1
  const maxVisible = 100 // 显示所有配置的关卡
  const canChallenge = selectedStage <= currentStage

  const stageName = stageNames[selectedStage] || `关卡 ${selectedStage}`

  // 通关条件
  const getClearConditions = (stage: number) => {
    const isCompleted = stage <= maxWave
    return [
      { name: '成功通关', completed: isCompleted, icon: '🏆' },
      { name: '50%血量通关', completed: isCompleted, icon: '❤️' },
      { name: '完美通关', completed: false, icon: '⭐' },
    ]
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.lobbyContainer}>
        {/* 顶部状态栏 */}
        <div className={styles.topBar}>
          <div className={styles.playerInfo}>
            <div className={styles.avatar}>
              <Text size='4'>🎮</Text>
              <Badge color='orange' size='1' className={styles.levelBadge}>
                Lv.{maxWave}
              </Badge>
            </div>
            <div className={styles.playerDetails}>
              <Text size='3' weight='bold'>
                玩家
              </Text>
              <div className={styles.resources}>
                <div className={styles.resourceItem}>
                  <Text size='1'>🪙</Text>
                  <Text size='2'>{formatCurrency(currency.copper)}</Text>
                </div>
                <div className={styles.resourceItem}>
                  <Text size='1'>🥈</Text>
                  <Text size='2'>{formatCurrency(currency.silver)}</Text>
                </div>
                <div className={styles.resourceItem}>
                  <Text size='1'>🥇</Text>
                  <Text size='2'>{formatCurrency(currency.gold)}</Text>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.topActions}>
            <IconButton variant='soft' size='2' radius='full'>
              <MdMail size={18} />
            </IconButton>
          </div>
        </div>

        {/* 主内容区 */}
        <div className={styles.mainContent}>
          {activeTab === 'battle' && (
            <>
              {/* 副本信息区 */}
              <div className={styles.stageInfo}>
                <div className={styles.stageHeader}>
                  <Text size='5' weight='bold'>
                    {selectedStage}. {stageName}
                  </Text>
                  <Badge
                    color={selectedStage < currentStage ? 'green' : selectedStage === currentStage ? 'orange' : 'gray'}
                    size='2'
                  >
                    {(() => {
                      if (selectedStage >= currentStage) return selectedStage === currentStage ? '可挑战' : '未解锁'
                      const hpRecord = stageRecords[selectedStage]
                      if (hpRecord === undefined) return '已通关'
                      if (hpRecord >= 100) return '完美通关'
                      return `${hpRecord}%血量通关`
                    })()}
                  </Badge>
                </div>

                {/* 难度切换 */}
                <div className={styles.difficultySwitch}>
                  <Button
                    size='2'
                    variant={difficulty === 'normal' ? 'solid' : 'soft'}
                    onClick={() => setDifficulty('normal')}
                  >
                    普通
                  </Button>
                  <Button
                    size='2'
                    variant={difficulty === 'elite' ? 'solid' : 'soft'}
                    onClick={() => {
                      if (selectedStage < currentStage) {
                        setDifficulty('elite')
                      }
                    }}
                    disabled={selectedStage >= currentStage}
                    style={{ opacity: selectedStage >= currentStage ? 0.5 : 1 }}
                  >
                    {selectedStage < currentStage ? '精英' : '精英(未解锁)'}
                  </Button>
                </div>

                {/* 副本预览图 */}
                <div className={styles.stagePreview}>
                  <div className={styles.previewScene}>
                    <img
                      src={`${import.meta.env.BASE_URL}stage-${((selectedStage - 1) % 10) + 1}.webp`}
                      alt={stageName}
                      className={styles.stageImage}
                    />
                  </div>
                  <div className={styles.previewNav}>
                    <Button
                      variant='soft'
                      size='2'
                      onClick={() => setSelectedStage(Math.max(1, selectedStage - 1))}
                      disabled={selectedStage <= 1}
                    >
                      ◀
                    </Button>
                    <Text size='2' color='gray'>
                      {selectedStage} / {maxVisible}
                    </Text>
                    <Button
                      variant='soft'
                      size='2'
                      onClick={() => setSelectedStage(Math.min(maxVisible, selectedStage + 1))}
                      disabled={selectedStage >= maxVisible}
                    >
                      ▶
                    </Button>
                  </div>
                </div>

                {/* 进度奖励区 - 三个宝箱 */}
                <div className={styles.rewardProgress}>
                  <HoverPopup
                    trigger={
                      <div className={styles.rewardNode}>
                        <div
                          className={`${styles.rewardBox} ${selectedStage < currentStage ? styles.rewardUnlocked : ''}`}
                        >
                          <Text size='3'>🏆</Text>
                        </div>
                        <Text size='1' color='gray'>
                          成功通关
                        </Text>
                      </div>
                    }
                  >
                    <div className={styles.rewardTooltip}>
                      <Text size='2' weight='bold'>
                        通关奖励
                      </Text>
                      <Text size='1'>宝石、装备</Text>
                    </div>
                  </HoverPopup>
                  <Progress value={selectedStage < currentStage ? 100 : 0} size='1' className={styles.progressBar} />
                  <HoverPopup
                    trigger={
                      <div className={styles.rewardNode}>
                        <div className={styles.rewardBox}>
                          <Text size='3'>❤️</Text>
                        </div>
                        <Text size='1' color='gray'>
                          50%血量
                        </Text>
                      </div>
                    }
                  >
                    <div className={styles.rewardTooltip}>
                      <Text size='2' weight='bold'>
                        50%血量奖励
                      </Text>
                      <Text size='1'>宝石、装备 + 50金条</Text>
                    </div>
                  </HoverPopup>
                  <Progress value={0} size='1' className={styles.progressBar} />
                  <HoverPopup
                    trigger={
                      <div className={styles.rewardNode}>
                        <div className={styles.rewardBox}>
                          <Text size='3'>⭐</Text>
                        </div>
                        <Text size='1' color='gray'>
                          完美通关
                        </Text>
                      </div>
                    }
                  >
                    <div className={styles.rewardTooltip}>
                      <Text size='2' weight='bold'>
                        完美通关奖励
                      </Text>
                      <Text size='1'>宝石、装备 + 200金条</Text>
                    </div>
                  </HoverPopup>
                </div>
              </div>

              {/* 开始游戏按钮 */}
              <div className={styles.bottomAction}>
                <Button
                  size='4'
                  className={styles.startButton}
                  onClick={() => canChallenge && onStartGame(selectedStage, difficulty)}
                  disabled={!canChallenge}
                >
                  {canChallenge ? '开始游戏' : '请先通关前置关卡'}
                </Button>

                {/* 掉落概率表 */}
                {(() => {
                  const dropRates = getStageDropRates(selectedStage, difficulty)
                  const qualityOrder: Quality[] = ['common', 'excellent', 'elite', 'perfect', 'legendary', 'mythic']
                  const qualityNames: Record<string, string> = {
                    common: '普通',
                    excellent: '优秀',
                    elite: '精英',
                    perfect: '完美',
                    legendary: '传说',
                    mythic: '神话',
                  }
                  const qualityColors: Record<string, string> = {
                    common: '#9ca3af',
                    excellent: '#22c55e',
                    elite: '#3b82f6',
                    perfect: '#8b5cf6',
                    legendary: '#f59e0b',
                    mythic: '#ef4444',
                  }

                  return (
                    <div className={styles.dropRateTable}>
                      <Text size='2' weight='bold' style={{ marginBottom: 8, display: 'inline-block' }}>
                        掉落装备/宝石概率
                      </Text>
                      <div className={styles.dropRateRow}>
                        {qualityOrder.map((q) => {
                          const rate = dropRates[q] || 0
                          return (
                            <div key={q} className={styles.dropRateItem}>
                              <Text size='1' weight='bold' style={{ color: qualityColors[q] }}>
                                {qualityNames[q]}
                              </Text>
                              <Text size='1' color='gray'>
                                {rate}%
                              </Text>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </>
          )}

          {activeTab === 'character' && (
            <CharacterPanel
              inventory={inventory}
              equippedItems={equippedItems}
              onEquip={onEquip}
              onUnequip={onUnequip}
              onEnchant={onEnchant}
              onUnenchant={onUnenchant}
              onRefine={onRefine}
              onMergeGems={onMergeGems}
            />
          )}

          {activeTab === 'shop' && (
            <div className={styles.shopPanel}>
              <Text size='4' weight='bold' style={{ marginBottom: 16 }}>
                商城 - 抽奖
              </Text>
              <div className={styles.gachaInfo}>
                <Text size='2' color='gray'>
                  抽奖产出：宝石(85%)、核心(10%)、装甲(5%)
                </Text>
              </div>
              <div className={styles.gachaButtons}>
                <Button size='3' variant='soft' disabled={currency.gold < 200}>
                  单抽 - 200金条
                </Button>
                <Button size='3' disabled={currency.gold < 1800}>
                  10连抽 - 1800金条 (9折)
                </Button>
              </div>
              <div className={styles.currentGold}>
                <Text size='2'>当前金条: {formatCurrency(currency.gold)}</Text>
              </div>
            </div>
          )}

          {activeTab === 'core' && (
            <CorePanel cores={cores} armors={armors} />
          )}

          {activeTab === 'base' && (
            <div className={styles.emptyState}>
              <Text size='6'>🏠</Text>
              <Text size='3' color='gray'>
                基地
              </Text>
              <Text size='2' color='gray'>
                即将开放
              </Text>
            </div>
          )}
        </div>

        {/* 底部导航栏 */}
        <div className={styles.bottomNav}>
          <div
            className={`${styles.navItem} ${activeTab === 'shop' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            <MdShoppingCart size={20} />
            <Text size='1'>商城</Text>
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'character' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('character')}
          >
            <MdPerson size={20} />
            <Text size='1'>角色</Text>
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'battle' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('battle')}
          >
            <Text size='3'>⚔️</Text>
            <Text size='1'>战斗</Text>
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'core' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('core')}
          >
            <Text size='3'>💎</Text>
            <Text size='1'>核心</Text>
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'base' ? styles.navActive : ''}`}
            onClick={() => setActiveTab('base')}
          >
            <Text size='3'>🏠</Text>
            <Text size='1'>基地</Text>
          </div>
        </div>
      </div>
    </div>
  )
}
