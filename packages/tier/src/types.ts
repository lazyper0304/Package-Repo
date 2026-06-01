export interface TierItem {
  id: string;
  type: 'text' | 'image';
  content: string;
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: TierItem[];
}

export interface TierListState {
  rows: TierRow[];
  poolItems: TierItem[];
}

export type TierListAction =
  | { type: 'ADD_POOL_ITEM'; item: TierItem }
  | { type: 'REMOVE_POOL_ITEM'; id: string }
  | { type: 'MOVE_TO_ROW'; itemId: string; rowId: string; index?: number }
  | { type: 'MOVE_TO_POOL'; itemId: string }
  | { type: 'REORDER_IN_ROW'; rowId: string; oldIndex: number; newIndex: number }
  | { type: 'REORDER_IN_POOL'; oldIndex: number; newIndex: number }
  | { type: 'UPDATE_ROW'; rowId: string; changes: Partial<Pick<TierRow, 'label' | 'color'>> }
  | { type: 'ADD_ROW'; row: TierRow }
  | { type: 'REMOVE_ROW'; rowId: string }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_STATE'; state: TierListState };
