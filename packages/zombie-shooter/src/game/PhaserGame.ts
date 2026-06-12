import Phaser from 'phaser';
import { createGameConfig } from './config';

let game: Phaser.Game | null = null;

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
