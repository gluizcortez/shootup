import type { UpgradeConfig } from '@/core/run/world';
import type { UpgradeDef } from '@/core/upgrades/types';

/**
 * Cartas entre ondas (protótipo). Cada uma muda o tiro de forma perceptível.
 * Ordem de cálculo: base → + somas → × produtos → limites (veja computeStats).
 */
export const UPGRADE_POOL: readonly UpgradeDef[] = [
  {
    id: 'tiro_duplo',
    name: 'Tiro Duplo',
    description: '+1 bala por disparo, um pouco mais aberto. Cada bala causa 80% do dano.',
    rarity: 'comum',
    branch: 'balistica',
    tags: ['projeteis'],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'pellets', op: 'add', value: 1 },
      { stat: 'spreadDeg', op: 'add', value: 4 },
      { stat: 'damage', op: 'mul', value: 0.8 },
    ],
  },
  {
    id: 'gatilho_nervoso',
    name: 'Gatilho Nervoso',
    description: 'Atira 25% mais rápido.',
    rarity: 'comum',
    branch: 'balistica',
    tags: ['cadencia'],
    maxStacks: 4,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'fireInterval', op: 'mul', value: 0.8 }],
  },
  {
    id: 'bala_viajante',
    name: 'Bala Viajante',
    description: 'A bala atravessa +1 inimigo e voa mais rápido.',
    rarity: 'incomum',
    branch: 'balistica',
    tags: ['perfuracao'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'pierce', op: 'add', value: 1 },
      { stat: 'projectileSpeed', op: 'mul', value: 1.12 },
    ],
  },
  {
    id: 'sinuca_mortal',
    name: 'Sinuca Mortal',
    description: 'Ao acertar, a bala quica para o inimigo mais próximo (+1 quique).',
    rarity: 'incomum',
    branch: 'caos',
    tags: ['ricochete'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'ricochet', op: 'add', value: 1 }],
  },
  {
    id: 'mira_cirurgica',
    name: 'Mira Cirúrgica',
    description: '+12% de chance de crítico e críticos +50% mais fortes.',
    rarity: 'incomum',
    branch: 'balistica',
    tags: ['critico'],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'critChance', op: 'add', value: 0.12 },
      { stat: 'critMultiplier', op: 'add', value: 0.5 },
    ],
  },
  {
    id: 'pe_leve',
    name: 'Pé Leve',
    description: 'Corre 15% mais rápido e pula um pouco mais alto.',
    rarity: 'comum',
    branch: 'sobrevivencia',
    tags: ['movimento'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'runSpeed', op: 'mul', value: 1.15 },
      { stat: 'jumpVelocity', op: 'mul', value: 1.06 },
    ],
  },
  {
    id: 'casco_duro',
    name: 'Casco Duro',
    description: '+1 coração máximo e cura 1.',
    rarity: 'comum',
    branch: 'sobrevivencia',
    tags: ['vida'],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'maxHp', op: 'add', value: 1 }],
    onPick: { heal: 1 },
  },
];

export const UPGRADES: UpgradeConfig = {
  pool: UPGRADE_POOL,
  weights: { comum: 60, incomum: 30, raro: 10 },
  clamps: {
    fireInterval: { min: 0.045, max: 2 },
    pellets: { min: 1, max: 8 },
    spreadDeg: { min: 0, max: 25 },
    critChance: { min: 0, max: 0.75 },
    pierce: { min: 0, max: 4 },
    ricochet: { min: 0, max: 4 },
    maxHp: { min: 1, max: 10 },
  },
  offerSize: 3,
};
