import { Card, Text, Button } from '@radix-ui/themes';
import styles from './index.module.less';

interface StartScreenProps {
  bestScore: number;
  onStart: () => void;
}

export function StartScreen({ bestScore, onStart }: StartScreenProps) {
  return (
    <div className={styles.overlay}>
      <Card className={styles.panel}>
        <div className={styles.titleArea}>
          <Text size="7" weight="bold" style={{ textAlign: 'center', display: 'block' }}>
            向僵尸开炮
          </Text>
          <Text size="2" color="gray" style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
            肉鸽射击游戏
          </Text>
        </div>

        <div className={styles.info}>
          <Text size="2" color="gray" style={{ textAlign: 'center' }}>
            左右移动，自动射击
          </Text>
          <Text size="2" color="gray" style={{ textAlign: 'center' }}>
            每波结束后选择升级
          </Text>
          {bestScore > 0 && (
            <Text size="2" style={{ textAlign: 'center', marginTop: 12 }}>
              最高分: {bestScore}
            </Text>
          )}
        </div>

        <Button
          size="4"
          style={{ width: '100%', marginTop: 24 }}
          onClick={onStart}
        >
          开始游戏
        </Button>
      </Card>
    </div>
  );
}
