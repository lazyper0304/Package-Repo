import { Text } from '@radix-ui/themes';
import styles from './NumberPad.module.less';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onErase: () => void;
  numberCounts: Record<number, number>;
}

export function NumberPad({ onNumberClick, onErase, numberCounts }: NumberPadProps) {
  return (
    <div className={styles.pad}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
        const completed = numberCounts[num] >= 9;
        return (
          <button
            key={num}
            className={`${styles.numBtn} ${completed ? styles.completed : ''}`}
            onClick={() => onNumberClick(num)}
            disabled={completed}
          >
            <span className={styles.numText}>{num}</span>
            <Text size="1" className={styles.count}>{numberCounts[num]}/9</Text>
          </button>
        );
      })}
      <button className={styles.eraseBtn} onClick={onErase}>
        擦除
      </button>
    </div>
  );
}
