import { useState, useEffect } from 'react'
import { Card, Text, Button, Badge } from '@radix-ui/themes'
import type { RewardItem } from '@/game/data/rewards'
import { getQualityColor, getQualityName } from '@/game/data/rewards'
import { QUALITY_CONFIG, type Quality } from '@/game/data/gems'
import { formatCurrency } from '@/utils/formatCurrency'
import { DamageChart } from '../DamageChart'
import styles from './index.module.less'

interface GameOverPanelProps {
  waveNumber: number
  score: number
  killCount: number
  bestScore: number
  rewards: RewardItem[]
  clearCondition: string
  damageStats: { source: string; icon: string; damage: number; percentage: number }[]
  onRestart: () => void
  onBackToLobby: () => void
  onClaimRewards: () => void
}

export function GameOverPanel({
  waveNumber,
  score,
  killCount,
  bestScore,
  rewards,
  clearCondition,
  damageStats,
  onRestart,
  onBackToLobby,
  onClaimRewards,
}: GameOverPanelProps) {
  const isNewBest = score >= bestScore
  const isCleared = clearCondition === 'cleared'

  // 自动领取奖励
  useEffect(() => {
    if (rewards.length > 0) {
      onClaimRewards()
    }
  }, [])

  const copperEarned = killCount * 10
  const gems = rewards.filter((r) => r.type === 'gem')
  const equipment = rewards.filter((r) => r.type === 'equipment')

  return (
    <div className={styles.overlay}>
      <Card className={styles.panel}>
        <Text size='6' weight='bold' style={{ textAlign: 'center', display: 'block' }}>
          {isCleared ? '挑战成功' : '挑战失败'}
        </Text>

        {isNewBest && (
          <Text size='3' color='orange' style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
            新纪录！
          </Text>
        )}

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <Text color='gray'>到达波次</Text>
            <Text weight='bold'>{waveNumber}/20</Text>
          </div>
          <div className={styles.statRow}>
            <Text color='gray'>击杀数</Text>
            <Text weight='bold'>{killCount}</Text>
          </div>
          <div className={styles.statRow}>
            <Text color='gray'>获得铜钱</Text>
            <Text weight='bold' color='orange'>
              🪙 {formatCurrency(copperEarned)}
            </Text>
          </div>
        </div>

        {/* 伤害统计 */}
        {damageStats.length > 0 && (
          <div className={styles.damageSection}>
            <Text size='3' weight='bold' style={{ marginBottom: 8 }}>
              伤害统计
            </Text>
            <DamageChart stats={damageStats} />
          </div>
        )}

        {/* 奖励区域 */}
        <div className={styles.rewardsSection}>
          <Text size='3' weight='bold' style={{ marginBottom: 8, display: 'block' }}>
            {isCleared ? '通关奖励' : '本次奖励'}
          </Text>

          {rewards.length > 0 && (
            <>
              {gems.length > 0 && (
                <div className={styles.rewardCategory}>
                  <Text size='2' color='gray'>宝石</Text>
                  <div className={styles.rewardList}>
                    {gems.map((item) => (
                      <div key={item.id} className={styles.rewardItem}>
                        <Badge style={{ backgroundColor: getQualityColor(item.quality), color: '#ffffff' }} size='2'>
                          {QUALITY_CONFIG[item.quality]?.name || '未知'}宝石
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {equipment.length > 0 && (
                <div className={styles.rewardCategory}>
                  <Text size='2' color='gray'>装备</Text>
                  <div className={styles.rewardList}>
                    {equipment.map((item) => (
                      <div key={item.id} className={styles.rewardItem}>
                        <Badge style={{ backgroundColor: getQualityColor(item.quality), color: '#ffffff' }} size='2'>
                          {QUALITY_CONFIG[item.quality]?.name || '未知'}装备
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {rewards.length === 0 && (
            <Text size='2' color='gray' style={{ textAlign: 'center' }}>
              暂无奖励
            </Text>
          )}
        </div>

        <div className={styles.buttons}>
          <Button size='3' style={{ width: '100%' }} onClick={onRestart}>
            再来一局
          </Button>
          <Button size='3' variant='soft' style={{ width: '100%' }} onClick={onBackToLobby}>
            返回大厅
          </Button>
        </div>
      </Card>
    </div>
  )
}
