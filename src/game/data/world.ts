import type { WorldConfig } from '@/core/run/world';
import { ARENA, TERRAIN } from './arena';
import { ENEMIES } from './enemies';
import { PLAYER } from './player';
import { PISTOL } from './weapons';
import { UPGRADES } from './upgrades';
import { WAVES } from './waves';

export const WORLD_CONFIG: WorldConfig = {
  bounds: ARENA,
  terrain: TERRAIN,
  player: PLAYER,
  weapon: PISTOL,
  enemies: ENEMIES,
  waves: WAVES,
  combo: { window: 2.5, killsPerStep: 3, stepBonus: 0.5, maxMultiplier: 5 },
  upgrades: UPGRADES,
  projectileCapacity: 512,
};
