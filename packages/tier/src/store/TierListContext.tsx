import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { TierListState, TierListAction, TierRow } from '../types';
import { DEFAULT_TIERS } from '../constants';

function createDefaultState(): TierListState {
  return {
    rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
    poolItems: [],
  };
}

function findItemSource(state: TierListState, itemId: string): { type: 'pool' } | { type: 'row'; rowId: string; index: number } | null {
  const poolIndex = state.poolItems.findIndex((i) => i.id === itemId);
  if (poolIndex !== -1) return { type: 'pool', index: poolIndex } as any;
  for (const row of state.rows) {
    const index = row.items.findIndex((i) => i.id === itemId);
    if (index !== -1) return { type: 'row', rowId: row.id, index };
  }
  return null;
}

function removeItemFromState(state: TierListState, itemId: string): { state: TierListState; item: TierListState['poolItems'][0] | null } {
  const source = findItemSource(state, itemId);
  if (!source) return { state, item: null };

  if (source.type === 'pool') {
    const item = state.poolItems.find((i) => i.id === itemId)!;
    return {
      state: { ...state, poolItems: state.poolItems.filter((i) => i.id !== itemId) },
      item,
    };
  }

  const row = state.rows.find((r) => r.id === source.rowId)!;
  const item = row.items.find((i) => i.id === itemId)!;
  return {
    state: {
      ...state,
      rows: state.rows.map((r) =>
        r.id === source.rowId ? { ...r, items: r.items.filter((i) => i.id !== itemId) } : r
      ),
    },
    item,
  };
}

function reducer(state: TierListState, action: TierListAction): TierListState {
  switch (action.type) {
    case 'ADD_POOL_ITEM':
      return { ...state, poolItems: [...state.poolItems, action.item] };

    case 'REMOVE_POOL_ITEM':
      return { ...state, poolItems: state.poolItems.filter((i) => i.id !== action.id) };

    case 'MOVE_TO_ROW': {
      const { state: s1, item } = removeItemFromState(state, action.itemId);
      if (!item) return state;
      const targetRow = s1.rows.find((r) => r.id === action.rowId);
      if (!targetRow) return s1;
      const insertIndex = action.index ?? targetRow.items.length;
      return {
        ...s1,
        rows: s1.rows.map((r) =>
          r.id === action.rowId
            ? { ...r, items: [...r.items.slice(0, insertIndex), item, ...r.items.slice(insertIndex)] }
            : r
        ),
      };
    }

    case 'MOVE_TO_POOL': {
      const { state: s1, item } = removeItemFromState(state, action.itemId);
      if (!item) return state;
      return { ...s1, poolItems: [...s1.poolItems, item] };
    }

    case 'REORDER_IN_ROW': {
      const row = state.rows.find((r) => r.id === action.rowId);
      if (!row) return state;
      const items = [...row.items];
      const [moved] = items.splice(action.oldIndex, 1);
      items.splice(action.newIndex, 0, moved);
      return {
        ...state,
        rows: state.rows.map((r) => (r.id === action.rowId ? { ...r, items } : r)),
      };
    }

    case 'REORDER_IN_POOL': {
      const items = [...state.poolItems];
      const [moved] = items.splice(action.oldIndex, 1);
      items.splice(action.newIndex, 0, moved);
      return { ...state, poolItems: items };
    }

    case 'UPDATE_ROW':
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === action.rowId ? { ...r, ...action.changes } : r
        ),
      };

    case 'ADD_ROW':
      return { ...state, rows: [...state.rows, action.row] };

    case 'REMOVE_ROW':
      return {
        ...state,
        rows: state.rows.filter((r) => r.id !== action.rowId),
      };

    case 'RESET_ALL':
      return createDefaultState();

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

interface TierListContextValue {
  state: TierListState;
  dispatch: React.Dispatch<TierListAction>;
}

const TierListContext = createContext<TierListContextValue | null>(null);

export function TierListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, createDefaultState);
  return (
    <TierListContext.Provider value={{ state, dispatch }}>
      {children}
    </TierListContext.Provider>
  );
}

export function useTierList() {
  const ctx = useContext(TierListContext);
  if (!ctx) throw new Error('useTierList must be used within TierListProvider');
  return ctx;
}
