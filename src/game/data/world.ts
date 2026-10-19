import type { WorldConfig } from '@/core/run/world';
import { ARENA } from './arena';
import { ENEMIES } from './enemies';
import { PLAYER } from './player';
import { PISTOL } from './weapons';
import { WAVES } from './waves';

export const WORLD_CONFIG: WorldConfig = {
  bounds: ARENA,
  player: PLAYER,
  weapon: PISTOL,
  enemies: ENEMIES,
  waves: WAVES,
  combo: { window: 2.5, killsPerStep: 3, stepBonus: 0.5, maxMultiplier: 5 },
  projectileCapacity: 512,
};
