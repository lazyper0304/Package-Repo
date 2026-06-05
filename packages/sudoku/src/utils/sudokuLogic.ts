export type Board = number[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  puzzle: Board;
  solution: Board;
}

const GRID_SIZE = 9;
const BOX_SIZE = 3;

function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

export function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let c = 0; c < GRID_SIZE; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (board[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function solveSudoku(board: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function hasUniqueSolution(board: Board): boolean {
  let count = 0;

  function solve(b: Board): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(b, r, c, num)) {
              b[r][c] = num;
              if (solve(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= 2;
  }

  solve(cloneBoard(board));
  return count === 1;
}

const HOLE_COUNT: Record<Difficulty, number> = {
  easy: 35,
  medium: 45,
  hard: 55,
};

export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const solution = createEmptyBoard();
  solveSudoku(solution);

  const puzzle = cloneBoard(solution);
  const holes = HOLE_COUNT[difficulty];
  const positions = shuffle(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => [
      Math.floor(i / GRID_SIZE),
      i % GRID_SIZE,
    ] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= holes) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution };
}

export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const num = board[r][c];
      board[r][c] = 0;
      if (!isValid(board, r, c, num)) {
        board[r][c] = num;
        return false;
      }
      board[r][c] = num;
    }
  }
  return true;
}

export function getConflicts(board: Board, row: number, col: number, num: number): [number, number][] {
  if (num === 0) return [];
  const conflicts: [number, number][] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && board[row][c] === num) conflicts.push([row, c]);
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && board[r][col] === num) conflicts.push([r, col]);
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (r !== row || c !== col) {
        if (board[r][c] === num) conflicts.push([r, c]);
      }
    }
  }
  return conflicts;
}

export function getHint(board: Board, solution: Board): [number, number, number] | null {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return null;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  return [r, c, solution[r][c]];
}

export function getNumberCounts(board: Board): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = board[r][c];
      if (v >= 1 && v <= 9) counts[v]++;
    }
  }
  return counts;
}
