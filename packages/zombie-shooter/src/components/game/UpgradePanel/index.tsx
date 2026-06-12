import { Card, Text, Badge } from '@radix-ui/themes';
import type { UpgradeOption } from '../../../game/bridge';
import styles from './index.module.less';

interface UpgradePanelProps {
  options: UpgradeOption[];
  onSelect: (upgradeId: string) => void;
}

const categoryColors: Record<string, string> = {
  gun: 'blue',
  skill: 'purple',
  element: 'orange',
  heal: 'green',
};

const categoryNames: Record<string, string> = {
  gun: '枪械',
  skill: '技能',
  element: '元素',
  heal: '恢复',
};

export function UpgradePanel({ options, onSelect }: UpgradePanelProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <Text size="5" weight="bold">选择技能</Text>
        </div>
        <div className={styles.options}>
          {options.map((option) => (
            <Card
              key={option.id}
              className={styles.optionCard}
              onClick={() => onSelect(option.id)}
            >
              <div className={styles.iconWrapper}>
                <Text size="6">{option.icon}</Text>
              </div>
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <Text size="3" weight="bold">{option.name}</Text>
                  <Badge color={categoryColors[option.category] as 'blue' | 'purple' | 'green' | 'orange'} size="1">
                    {categoryNames[option.category]}
                  </Badge>
                </div>
                <Text size="2" color="gray" style={{ marginTop: 4 }}>
                  {option.description}
                </Text>
                {option.category !== 'skill' && (
                  <Text size="1" color="gray" style={{ marginTop: 2 }}>
                    Lv.{option.currentLevel} → Lv.{option.currentLevel + 1}
                  </Text>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
