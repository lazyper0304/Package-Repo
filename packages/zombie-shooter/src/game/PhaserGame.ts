import Phaser from 'phaser';
import { createGameConfig } from './config';

let game: Phaser.Game | null = null;

// 待发送给 GameScene 的启动数据（所有值预先计算好）
let pendingGameData: {
  startWave: number;
  bonusHp: number;
  bonusAttack: number;
  affixEffects: Record<string, number>;
  wallMaxHp: number;
  wallShield: number;
  playerCritChanceBonus: number;
  playerCritDamageBonus: number;
  playerDodgeRate: number;
  playerAttackBonus: number;
  elementDamageByType: Record<string, number>;
  hitRateBonus: number;
} | null = null;

export function setPendingGameData(data: typeof pendingGameData) {
  pendingGameData = data;
}

export function getAndClearPendingGameData() {
  const data = pendingGameData;
  pendingGameData = null;
  return data;
}

export function initPhaserGame(container: string | HTMLElement): Phaser.Game {
  if (game) {
    game.destroy(true);
  }
  game = new Phaser.Game(createGameConfig(container));
  return game;
}

export function destroyPhaserGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}

export function getPhaserGame(): Phaser.Game | null {
  return game;
}
