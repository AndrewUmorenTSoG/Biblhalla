// Immutable per-content lookup tables shared by every simulation module.

import type { Attack, Content, FighterDef, Physics, Rules } from '../../content/src/index.ts';

export interface SimContext {
  content: Content;
  P: Physics;
  R: Rules;
  moves: Record<string, Attack>;
  defs: Record<string, FighterDef>;
}

/** Fictional campaign companions: not in the arena roster, never selectable in versus. */
const COMPANIONS: Record<string, Partial<FighterDef>> = {
  dru: { id: 'dru', name: 'Dru', title: 'Story Archive companion', weaponPair: ['sword', 'staff'], stats: { power: 5, guard: 5, speed: 5 } },
  ken: { id: 'ken', name: 'Ken', title: 'Story Archive companion', weaponPair: ['staff', 'sling'], stats: { power: 5, guard: 5, speed: 5 } },
};

export function createContext(content: Content): SimContext {
  const moves = Object.fromEntries(content.attacks.attacks.map(m => [m.id, m]));
  const defs: Record<string, FighterDef> = Object.fromEntries(content.fighters.fighters.map(f => [f.id, f]));
  for (const [id, def] of Object.entries(COMPANIONS)) defs[id] = def as FighterDef;
  return { content, P: content.physics, R: content.rules, moves, defs };
}
