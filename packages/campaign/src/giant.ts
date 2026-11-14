import type { Fighter } from '../../sim/src/index.ts';
import { Q } from '../../sim/src/index.ts';

export interface Giant {
  x: number;
  height: number;
  walking: boolean;
  facing: number;
  move: 'guard' | 'reach' | 'throw' | 'headbutt' | 'recover';
  frame: number;
  nextGrab: 'throw' | 'headbutt';
}

export const GIANT_HOME = 3550;
export const giantStart = (): Giant => ({ x: GIANT_HOME * Q, height: 0, walking: false, facing: -1, move: 'guard', frame: 0, nextGrab: 'throw' });

/** One ballistic hop during the shield wind-up. A second impulse requires landing. */
export function shieldHop(remaining: number): number {
  const t = Math.max(0, Math.min(30, 30 - remaining));
  return t * (30 - t) / 3;
}

/** Close-range sequence owns the victim only after the reach connects. */
export function giantGrapple(g: Giant, victim: Fighter, runCap: number, mayGrab: boolean): boolean {
  const dx = victim.x - g.x;
  g.walking = false;
  if (g.move === 'guard') {
    g.facing = Math.sign(dx) || g.facing;
    const goal = Math.max((GIANT_HOME - 95) * Q, Math.min((GIANT_HOME + 95) * Q, victim.x));
    g.walking = goal !== g.x;
    g.x += Math.sign(goal - g.x) * Math.min(Math.abs(goal - g.x), Math.floor(runCap / 2));
    if (mayGrab && Math.abs(dx) < 148 * Q && victim.y < 245 * Q) {
      g.move = 'reach';
      g.frame = 0;
    }
    return false;
  }
  g.frame++;
  if (g.move === 'recover') {
    if (g.frame >= 32) { g.move = 'guard'; g.frame = 0; }
    return false;
  }
  if (g.move === 'reach') {
    if (g.frame < 18) return false;
    const contact = dx * g.facing >= -16 * Q && Math.abs(dx) < 155 * Q && victim.y < 245 * Q && victim.action?.kind !== 'dodge';
    g.move = contact ? g.nextGrab : 'recover';
    if (contact) g.nextGrab = g.nextGrab === 'throw' ? 'headbutt' : 'throw';
    g.frame = 0;
    if (!contact) return false;
  }
  if (g.move !== 'throw' && g.move !== 'headbutt') return false;
  const t = g.frame;
  const lift = Math.min(1, t / 11);
  const heldDistance = g.move === 'headbutt' ? 62 : 90;
  const heldHeight = g.move === 'headbutt' ? 161 : 112;
  let distance = 106 + (heldDistance - 106) * lift;
  let elevation = heldHeight * lift;
  if (t >= 15) {
    const flight = Math.min(1, (t - 15) / (g.move === 'throw' ? 24 : 8));
    distance += (g.move === 'throw' ? 260 : 94) * flight;
    elevation = heldHeight * (1 - flight) + (g.move === 'throw' ? 280 * flight * (1 - flight) : 0);
  }
  victim.x = Math.round(g.x + g.facing * distance * Q);
  victim.y = Math.round((80 + elevation) * Q);
  victim.vx = victim.vy = victim.kx = 0;
  victim.action = null;
  if (elevation > 0) victim.ground = null;
  if (t >= (g.move === 'throw' ? 47 : 43)) { g.move = 'recover'; g.frame = 0; }
  return true;
}
