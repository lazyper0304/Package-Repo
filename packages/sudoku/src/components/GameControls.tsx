import { Select, Button, Flex, Text } from '@radix-ui/themes';
import type { Difficulty } from '../utils/sudokuLogic';
import styles from './GameControls.module.less';

interface GameControlsProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onNewGame: () => void;
  onHint: () => void;
  hintsLeft: number;
  timer: number;
  mistakes: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function GameControls({
  difficulty,
  onDifficultyChange,
  onNewGame,
  onHint,
  hintsLeft,
  timer,
  mistakes,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Text size="2" color="gray">时间</Text>
          <Text size="5" weight="bold">{formatTime(timer)}</Text>
        </div>
        <div className={styles.statItem}>
          <Text size="2" color="gray">错误</Text>
          <Text size="5" weight="bold" color={mistakes > 0 ? 'red' : undefined}>
            {mistakes}
          </Text>
        </div>
        <div className={styles.statItem}>
          <Text size="2" color="gray">提示</Text>
          <Text size="5" weight="bold">{hintsLeft}</Text>
        </div>
      </div>

      <Flex gap="2" align="center">
        <Text size="2" color="gray" style={{ whiteSpace: 'nowrap' }}>难度</Text>
        <Select.Root
          value={difficulty}
          onValueChange={(v) => onDifficultyChange(v as Difficulty)}
          size="2"
        >
          <Select.Trigger style={{ flex: 1 }} />
          <Select.Content>
            <Select.Item value="easy">简单</Select.Item>
            <Select.Item value="medium">中等</Select.Item>
            <Select.Item value="hard">困难</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Flex gap="2">
        <Button onClick={onNewGame} style={{ flex: 1 }}>新游戏</Button>
        <Button
          variant="soft"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          style={{ flex: 1 }}
        >
          提示 ({hintsLeft})
        </Button>
      </Flex>
    </div>
  );
}
