import { Text } from '@radix-ui/themes';
import { formatNumber } from '@/utils/format';
import styles from './index.module.less';

interface DamageStat {
  source: string;
  icon: string;
  damage: number;
  percentage: number;
}

interface DamageChartProps {
  stats: DamageStat[];
}

export function DamageChart({ stats }: DamageChartProps) {
  if (stats.length === 0) {
    return (
      <div>
        <Text size='1' color='gray'>暂无伤害数据</Text>
      </div>
    );
  }

  return (
    <div className={styles.damageChart}>
      {stats.map((stat, index) => (
        <div key={index} className={styles.damageChartItem}>
          <div className={styles.damageBarHeader}>
            <Text size='1'>{stat.icon}</Text>
            <Text size='1'>{formatNumber(stat.damage)}</Text>
          </div>
          <div className={styles.damageBarContainer}>
            <div className={styles.damageBar} style={{ width: `${stat.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
