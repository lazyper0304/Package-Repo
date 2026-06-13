import { Card, Text, Badge } from '@radix-ui/themes';
import type { UpgradeOption } from '@/game/bridge';
import { useMobile } from '@/hooks/useMobile';
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
  const isMobile = useMobile();

  return (
    <div className={styles.overlay}>
      <div className={isMobile ? styles.optionsMobile : styles.panel}>
        {!isMobile && (
          <div className={styles.header}>
            <Text size="5" weight="bold">选择技能</Text>
          </div>
        )}
        <div className={isMobile ? styles.optionsMobileGrid : styles.options}>
          {options.map((option) => (
            <Card
              key={option.id}
              className={isMobile ? styles.optionCardMobile : styles.optionCard}
              onClick={() => onSelect(option.id)}
            >
              <div className={styles.iconWrapper}>
                <Text size={isMobile ? "4" : "6"}>{option.icon}</Text>
              </div>
              <div className={styles.optionContent}>
                <div className={styles.optionHeader}>
                  <Text size={isMobile ? "2" : "3"} weight="bold" style={{ textAlign: 'left' }}>{option.name}</Text>
                  {!isMobile && (
                    <Badge color={categoryColors[option.category] as 'blue' | 'purple' | 'green' | 'orange'} size="1">
                      {categoryNames[option.category]}
                    </Badge>
                  )}
                </div>
                <Text size={isMobile ? "1" : "2"} color="gray" style={{ marginTop: isMobile ? 2 : 4, textAlign: 'left' }}>
                  {option.description}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
