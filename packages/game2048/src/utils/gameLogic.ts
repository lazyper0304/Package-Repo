// 2048 游戏逻辑

export type Grid = number[][];

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

export function getEmptyCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

export function addRandomTile(grid: Grid): Grid {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;
  const newGrid = cloneGrid(grid);
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

export function initializeGame(): Grid {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

function slideRow(row: number[]): { row: number[]; score: number; moved: boolean } {
  let filtered = row.filter(v => v !== 0);
  let score = 0;
  let moved = false;

  // 合并
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
      moved = true;
    }
  }

  // 填充
  while (filtered.length < GRID_SIZE) {
    filtered.push(0);
  }

  // 检查是否移动
  if (!moved) {
    for (let i = 0; i < GRID_SIZE; i++) {
      if (filtered[i] !== row[i]) {
        moved = true;
        break;
      }
    }
  }

  return { row: filtered, score, moved };
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export function move(grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean } {
  let newGrid = cloneGrid(grid);
  let totalScore = 0;
  let anyMoved = false;

  if (direction === 'left') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const result = slideRow(newGrid[r]);
      newGrid[r] = result.row;
      totalScore += result.score;
      if (result.moved) anyMoved = true;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const result = slideRow([...newGrid[r]].reverse());
      newGrid[r] = result.row.reverse();
      totalScore += result.score;
      if (result.moved) anyMoved = true;
    }
  } else if (direction === 'up') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = newGrid.map(row => row[c]);
      const result = slideRow(col);
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = result.row[r];
      totalScore += result.score;
      if (result.moved) anyMoved = true;
    }
  } else if (direction === 'down') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = newGrid.map(row => row[c]).reverse();
      const result = slideRow(col);
      const reversed = result.row.reverse();
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = reversed[r];
      totalScore += result.score;
      if (result.moved) anyMoved = true;
    }
  }

  return { grid: newGrid, score: totalScore, moved: anyMoved };
}

export function canMove(grid: Grid): boolean {
  // 有空格
  if (getEmptyCells(grid).length > 0) return true;

  // 可以合并
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = grid[r][c];
      if (c < GRID_SIZE - 1 && val === grid[r][c + 1]) return true;
      if (r < GRID_SIZE - 1 && val === grid[r + 1][c]) return true;
    }
  }

  return false;
}

export function hasWon(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] >= WIN_VALUE) return true;
    }
  }
  return false;
}

export function getMaxTile(grid: Grid): number {
  let max = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  return max;
}
