// Immutable per-content lookup tables shared by every simulation module.

import type { Attack, Content, FighterDef, Physics, Rules } from '../../content/src/index.ts';

export interface SimContext {
  content: Content;
  P: Physics;
  R: Rules;
  moves: Record<string, Attack>;
  defs: Record<string, FighterDef>;
}

export function createContext(content: Content): SimContext {
  const moves = Object.fromEntries(content.attacks.attacks.map(m => [m.id, m]));
  const defs: Record<string, FighterDef> = Object.fromEntries(content.fighters.fighters.map(f => [f.id, f]));
  return { content, P: content.physics, R: content.rules, moves, defs };
}
