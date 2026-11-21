import type { Fighter } from './types.ts';

/** Normalize boss launch danger without changing displayed damage or ring-out rules. */
export function dangerDamage(f: Pick<Fighter, 'damage' | 'redDamage'>): number {
  return f.redDamage ? Math.floor((f.damage * 1500) / f.redDamage) : f.damage;
}
