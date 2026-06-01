import type { TierRow } from './types';

export const DEFAULT_TIERS: Omit<TierRow, 'items'>[] = [
  { id: 'tier-1', label: '夯', color: '#ff1a1a' },
  { id: 'tier-2', label: '顶级', color: '#ffb347' },
  { id: 'tier-3', label: '人上人', color: '#ffff00' },
  { id: 'tier-4', label: 'NPC', color: '#fff2cc' },
  { id: 'tier-5', label: '拉完了', color: '#ffffff' },
];

export const PRESET_COLORS = [
  '#ff7f7f', '#ffbf7f', '#ffff7f', '#7fff7f', '#7fbfff', '#bf7fff',
  '#ff7fbf', '#7fffff', '#ff4444', '#4488ff', '#44bb44', '#ff8800',
  '#aa44ff', '#ff66aa', '#66dddd', '#dddd44',
];
