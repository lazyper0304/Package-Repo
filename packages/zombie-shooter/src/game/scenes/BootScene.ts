import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 加载子弹图片
    this.load.image('bullet', 'bullet.png');
    this.load.image('bullet-fire', 'bullet-fire.png');
    this.load.image('bullet-ice', 'bullet-ice.png');
    this.load.image('bullet-thunder', 'bullet-thunder.png');
    // 加载背景图片
    this.load.image('background', 'background.webp');
    // 加载城墙图片
    this.load.image('wall', 'wall.png');
    // 加载玩家图片
    this.load.image('player', 'player.png');
    // 加载僵尸行走图片
    this.load.image('zombie-walk-1', 'zombie-walk-1.png');
    this.load.image('zombie-walk-2', 'zombie-walk-2.png');
    // 加载疾尸行走图片
    this.load.image('runner-walk-1', 'runner-walk-1.png');
    this.load.image('runner-walk-2', 'runner-walk-2.png');
    // 加载僵尸王图片
    this.load.image('boss', 'boss.png');
  }

  create(): void {
    this.createFallbackTextures();
    this.createAnimations();
    this.scene.start('GameScene');
  }

  private createAnimations(): void {
    // 创建僵尸行走动画
    if (this.textures.exists('zombie-walk-1') && this.textures.exists('zombie-walk-2')) {
      this.anims.create({
        key: 'zombie-walk',
        frames: [
          { key: 'zombie-walk-1' },
          { key: 'zombie-walk-2' },
        ],
        frameRate: 4,
        repeat: -1,
      });
    }

    // 创建疾尸行走动画
    if (this.textures.exists('runner-walk-1') && this.textures.exists('runner-walk-2')) {
      this.anims.create({
        key: 'runner-walk',
        frames: [
          { key: 'runner-walk-1' },
          { key: 'runner-walk-2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    // 创建僵尸王行走动画
    if (this.textures.exists('boss-1') && this.textures.exists('boss-2')) {
      this.anims.create({
        key: 'boss-walk',
        frames: [
          { key: 'boss-1' },
          { key: 'boss-2' },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  private createFallbackTextures(): void {
    // 创建备用纹理（如果图片加载失败）
    if (!this.textures.exists('player')) {
      const g = this.add.graphics();
      g.fillStyle(0x4a90d9, 1);
      g.fillRoundedRect(8, 20, 24, 28, 4);
      g.fillStyle(0xffd4a3, 1);
      g.fillCircle(20, 14, 12);
      g.fillStyle(0x000000, 1);
      g.fillCircle(16, 12, 2);
      g.fillCircle(24, 12, 2);
      g.lineStyle(2, 0x000000, 1);
      g.strokeRoundedRect(8, 20, 24, 28, 4);
      g.strokeCircle(20, 14, 12);
      g.generateTexture('player-fallback', 40, 52);
      g.destroy();
    }

    if (!this.textures.exists('bullet')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(6, 6, 5);
      g.fillStyle(0xffff00, 0.6);
      g.fillCircle(6, 6, 3);
      g.generateTexture('bullet', 12, 12);
      g.destroy();
    }

    // 分裂子弹纹理
    const g = this.add.graphics();
    g.fillStyle(0xff6600, 1);
    g.fillCircle(4, 4, 3);
    g.fillStyle(0xffcc00, 0.8);
    g.fillCircle(4, 4, 2);
    g.generateTexture('split-bullet', 8, 8);
    g.destroy();

    // 敌人备用纹理
    if (!this.textures.exists('enemy-walker')) {
      this.createEnemyTexture('enemy-walker', 0x4ade80, 24);
    }
    if (!this.textures.exists('enemy-runner')) {
      this.createEnemyTexture('enemy-runner', 0xfacc15, 18);
    }
    if (!this.textures.exists('enemy-tank')) {
      this.createEnemyTexture('enemy-tank', 0xef4444, 32);
    }
    if (!this.textures.exists('enemy-splitter')) {
      this.createEnemyTexture('enemy-splitter', 0xa855f7, 22);
    }

    // XP gem texture
    const gemG = this.add.graphics();
    gemG.fillStyle(0x06b6d4, 1);
    gemG.fillRect(4, 0, 8, 8);
    gemG.fillRect(0, 4, 16, 8);
    gemG.fillRect(4, 12, 8, 4);
    gemG.generateTexture('xp-gem', 16, 16);
    gemG.destroy();
  }

  private createEnemyTexture(key: string, color: number, size: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(size / 2 - 4, size / 2 - 2, 3);
    g.fillCircle(size / 2 + 4, size / 2 - 2, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(size / 2 - 4, size / 2 - 2, 1.5);
    g.fillCircle(size / 2 + 4, size / 2 - 2, 1.5);
    g.lineStyle(2, 0x000000, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
