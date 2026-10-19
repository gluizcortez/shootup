import type { UpgradeConfig } from '@/core/run/world';
import type { UpgradeDef } from '@/core/upgrades/types';

/**
 * Cartas entre ondas. Cada carta é um passo pequeno: o poder vem de juntar
 * várias ao longo da run, não de uma só. Raridade define força e frequência:
 * comum (ajuste leve), incomum (efeito novo, moderado) e rara (muda o jeito
 * de atirar, aparece pouco).
 * Ordem de cálculo: base → + somas → × produtos → limites (veja computeStats).
 */
export const UPGRADE_POOL: readonly UpgradeDef[] = [
  // ── Comuns ──
  {
    id: 'gatilho_nervoso',
    name: 'Gatilho Nervoso',
    description: 'Atira 8% mais rápido.',
    rarity: 'comum',
    branch: 'balistica',
    tags: ['cadencia'],
    maxStacks: 5,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'fireInterval', op: 'mul', value: 0.92 }],
  },
  {
    id: 'calibre_reforcado',
    name: 'Calibre Reforçado',
    description: '+1 de dano por bala.',
    rarity: 'comum',
    branch: 'balistica',
    tags: ['dano'],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'damage', op: 'add', value: 1 }],
  },
  {
    id: 'olho_vivo',
    name: 'Olho Vivo',
    description: '+4% de chance de crítico.',
    rarity: 'comum',
    branch: 'balistica',
    tags: ['critico'],
    maxStacks: 3,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'critChance', op: 'add', value: 0.04 }],
  },
  {
    id: 'pe_leve',
    name: 'Pé Leve',
    description: 'Corre 8% mais rápido e pula um tiquinho mais alto.',
    rarity: 'comum',
    branch: 'sobrevivencia',
    tags: ['movimento'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'runSpeed', op: 'mul', value: 1.08 },
      { stat: 'jumpVelocity', op: 'mul', value: 1.03 },
    ],
  },
  // ── Incomuns ──
  {
    id: 'mira_cirurgica',
    name: 'Mira Cirúrgica',
    description: '+6% de chance de crítico e críticos +25% mais fortes.',
    rarity: 'incomum',
    branch: 'balistica',
    tags: ['critico'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'critChance', op: 'add', value: 0.06 },
      { stat: 'critMultiplier', op: 'add', value: 0.25 },
    ],
  },
  {
    id: 'bala_viajante',
    name: 'Bala Viajante',
    description: 'A bala atravessa +1 inimigo e voa 5% mais rápido.',
    rarity: 'incomum',
    branch: 'balistica',
    tags: ['perfuracao'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'pierce', op: 'add', value: 1 },
      { stat: 'projectileSpeed', op: 'mul', value: 1.05 },
    ],
  },
  {
    id: 'casco_duro',
    name: 'Casco Duro',
    description: '+1 coração máximo e cura 1.',
    rarity: 'incomum',
    branch: 'sobrevivencia',
    tags: ['vida'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'maxHp', op: 'add', value: 1 }],
    onPick: { heal: 1 },
  },
  // ── Raras ──
  {
    id: 'tiro_duplo',
    name: 'Tiro Duplo',
    description: '+1 bala por disparo, mais aberto. Cada bala causa 70% do dano.',
    rarity: 'raro',
    branch: 'balistica',
    tags: ['projeteis'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [
      { stat: 'pellets', op: 'add', value: 1 },
      { stat: 'spreadDeg', op: 'add', value: 5 },
      { stat: 'damage', op: 'mul', value: 0.7 },
    ],
  },
  {
    id: 'sinuca_mortal',
    name: 'Sinuca Mortal',
    description: 'Ao acertar, a bala quica para o inimigo mais próximo (+1 quique).',
    rarity: 'raro',
    branch: 'caos',
    tags: ['ricochete'],
    maxStacks: 2,
    prerequisites: [],
    exclusions: [],
    modifiers: [{ stat: 'ricochet', op: 'add', value: 1 }],
  },
];

export const UPGRADES: UpgradeConfig = {
  pool: UPGRADE_POOL,
  weights: { comum: 70, incomum: 24, raro: 6 },
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
