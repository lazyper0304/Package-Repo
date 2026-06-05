import { useCallback } from 'react';
import styles from './SudokuBoard.module.less';

interface SudokuBoardProps {
  board: number[][];
  puzzle: number[][];
  selectedCell: [number, number] | null;
  conflicts: Set<string>;
  hintCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
}

export function SudokuBoard({
  board,
  puzzle,
  selectedCell,
  conflicts,
  hintCell,
  onCellClick,
}: SudokuBoardProps) {
  const getCellClassName = useCallback(
    (row: number, col: number, value: number) => {
      const classes: string[] = [styles.cell];

      if (value !== 0 && puzzle[row][col] === 0) {
        classes.push(styles.userInput);
      }

      if (conflicts.has(`${row}-${col}`)) {
        classes.push(styles.conflict);
      }

      if (hintCell && hintCell[0] === row && hintCell[1] === col) {
        classes.push(styles.hint);
      }

      if (selectedCell) {
        const [sr, sc] = selectedCell;
        if (sr === row && sc === col) {
          classes.push(styles.selected);
        } else if (sr === row || sc === col) {
          classes.push(styles.highlighted);
        } else {
          const boxRow = Math.floor(sr / 3) * 3;
          const boxCol = Math.floor(sc / 3) * 3;
          if (
            row >= boxRow &&
            row < boxRow + 3 &&
            col >= boxCol &&
            col < boxCol + 3
          ) {
            classes.push(styles.highlighted);
          }
        }

        if (value !== 0 && board[sr][sc] === value) {
          classes.push(styles.sameNumber);
        }
      }

      if (col % 3 === 0 && col !== 0) classes.push(styles.boxLeft);
      if (row % 3 === 0 && row !== 0) classes.push(styles.boxTop);

      return classes.join(' ');
    },
    [board, puzzle, selectedCell, conflicts, hintCell]
  );

  return (
    <div className={styles.board}>
      {board.map((row, r) =>
        row.map((value, c) => (
          <div
            key={`${r}-${c}`}
            className={getCellClassName(r, c, value)}
            onClick={() => onCellClick(r, c)}
          >
            {value !== 0 ? value : ''}
          </div>
        ))
      )}
    </div>
  );
}
