import { Card, Text, Button, Badge } from '@radix-ui/themes';
import type { RewardItem } from '../../../game/data/rewards';
import { getQualityColor, getQualityName } from '../../../game/data/rewards';
import styles from './index.module.less';

// 格式化数字
function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}

interface GameOverPanelProps {
  waveNumber: number;
  score: number;
  killCount: number;
  bestScore: number;
  rewards: RewardItem[];
  damageStats: { source: string; icon: string; damage: number; percentage: number }[];
  onRestart: () => void;
  onBackToLobby: () => void;
}

export function GameOverPanel({ waveNumber, score, killCount, bestScore, rewards, damageStats, onRestart, onBackToLobby }: GameOverPanelProps) {
  const isNewBest = score >= bestScore;
  const progress = Math.min(100, (waveNumber / 20) * 100);

  return (
    <div className={styles.overlay}>
      <Card className={styles.panel}>
        <Text size="6" weight="bold" style={{ textAlign: 'center', display: 'block' }}>
          游戏结束
        </Text>

        {isNewBest && (
          <Text size="3" color="orange" style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
            新纪录！
          </Text>
        )}

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <Text color="gray">到达波次</Text>
            <Text weight="bold">{waveNumber}</Text>
          </div>
          <div className={styles.statRow}>
            <Text color="gray">进度</Text>
            <Text weight="bold">{Math.round(progress)}%</Text>
          </div>
          <div className={styles.statRow}>
            <Text color="gray">最终分数</Text>
            <Text weight="bold">{score}</Text>
          </div>
          <div className={styles.statRow}>
            <Text color="gray">击杀数</Text>
            <Text weight="bold">{killCount}</Text>
          </div>
          <div className={styles.statRow}>
            <Text color="gray">最高分</Text>
            <Text weight="bold">{bestScore}</Text>
          </div>
        </div>

        {/* 伤害统计 - 横向柱状图 */}
        {damageStats.length > 0 && (
          <div className={styles.damageSection}>
            <Text size="3" weight="bold" style={{ marginBottom: 8 }}>伤害统计</Text>
            <div className={styles.damageChart}>
              {damageStats.map((stat, index) => (
                <div key={index} className={styles.damageChartItem}>
                  <div className={styles.damageBarHeader}>
                    <Text size="1">{stat.icon}</Text>
                    <Text size="1">{formatNumber(stat.damage)}</Text>
                  </div>
                  <div className={styles.damageBarContainer}>
                    <div
                      className={styles.damageBar}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 奖励预览 */}
        {rewards.length > 0 && (
          <div className={styles.rewardsSection}>
            <Text size="3" weight="bold" style={{ marginBottom: 8 }}>获得奖励</Text>
            <div className={styles.rewardList}>
              {rewards.map((item) => (
                <div key={item.id} className={styles.rewardItem}>
                  <Badge
                    style={{ backgroundColor: getQualityColor(item.quality) }}
                    size="2"
                  >
                    {item.name}
                  </Badge>
                  <Text size="1" color="gray">未鉴定</Text>
                </div>
              ))}
            </div>
            <Text size="1" color="gray" style={{ marginTop: 8, textAlign: 'center' }}>
              返回大厅后鉴定物品属性
            </Text>
          </div>
        )}

        <div className={styles.buttons}>
          <Button
            size="3"
            style={{ width: '100%' }}
            onClick={onRestart}
          >
            再来一局
          </Button>
          <Button
            size="3"
            variant="soft"
            style={{ width: '100%' }}
            onClick={onBackToLobby}
          >
            返回大厅
          </Button>
        </div>
      </Card>
    </div>
  );
}
