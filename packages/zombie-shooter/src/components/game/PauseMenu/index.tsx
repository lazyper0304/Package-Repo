import { Card, Text, Button } from '@radix-ui/themes';
import styles from './index.module.less';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export function PauseMenu({ onResume, onRestart, onBackToLobby }: PauseMenuProps) {
  return (
    <div className={styles.overlay}>
      <Card className={styles.panel}>
        <Text size="6" weight="bold" style={{ textAlign: 'center', display: 'block' }}>
          游戏暂停
        </Text>

        <div className={styles.buttons}>
          <Button
            size="3"
            style={{ width: '100%' }}
            onClick={onResume}
          >
            继续游戏
          </Button>
          <Button
            size="3"
            variant="soft"
            style={{ width: '100%' }}
            onClick={onRestart}
          >
            重新开始
          </Button>
          <Button
            size="3"
            variant="soft"
            color="gray"
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
