type EventMap = Record<string, unknown>;

class GameBridge {
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const wrappedCallback = (data: unknown) => callback(data as T);
    this.listeners.get(event)!.add(wrappedCallback);
    return () => this.listeners.get(event)?.delete(wrappedCallback);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const gameBridge = new GameBridge();

// Events from Phaser -> React
export interface GameEvents {
  'game:started': void;
  'wave:complete': { waveNumber: number };
  'wave:started': { waveNumber: number };
  'player:died': { waveNumber: number; killCount: number };
  'score:changed': { score: number };
  'xp:changed': { xp: number; level: number };
  'enemy:killed': { type: string };
  'upgrade:options': { options: UpgradeOption[] };
  'wall:hp-changed': { hp: number; maxHp: number };
  'wall:shield-changed': { shield: number; maxShield: number };
  'ammo:changed': { ammo: number; maxAmmo: number; isReloading: boolean };
  'game:time': { time: number };
  'debug:bullets': { active: number; total: number };
  'debug:enemies': { active: number; total: number };
  'skills:updated': { skills: SkillInfo[] };
  'damage:stats': { stats: DamageStat[] };
  'gun:stats': GunStats;
}

// Events from React -> Phaser
export interface ReactEvents {
  'upgrade:selected': { upgradeId: string };
  'game:start': { startWave: number };
  'game:restart': void;
  'game:pause': void;
  'game:resume': void;
  'game:toggle-shoot': { enabled: boolean };
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  category: 'gun' | 'skill' | 'element' | 'heal';
  icon: string;
  currentLevel: number;
  maxLevel: number;
}

export interface SkillInfo {
  name: string;
  element: string;
  level: number;
  cooldown: number;
  remaining: number;
  progress: number;
  elementDamage: number;
}

export interface DamageStat {
  source: string;
  icon: string;
  damage: number;
  percentage: number;
}

export interface GunStats {
  damage: number;
  damageBonus: number;
  burstCount: number;
  rapidCount: number;
  splitCount: number;
  splitDamage: number;
  critChance: number;
  critMultiplier: number;
}
