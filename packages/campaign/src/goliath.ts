// L041 David and Goliath: a restrained reenactment, never a health-bar fight.
//   1 Approach: pass three telegraphed spear lanes to reach the stream-stone bay.
//   2 Composure: holding one stone, clear two shield advances until Goliath pauses.
//   3 Decisive shot: aim from the marked zone while he pauses. A miss returns to
//     composure; one hit ends the encounter with the narrated outcome.
// Grabs, throws and knockdowns cost position. The sling opportunity resolves the fight.

import type { Fighter } from '../../sim/src/index.ts';
import { Q } from '../../sim/src/index.ts';

import { giantStart, giantGrapple, shieldHop, type Giant } from './giant.ts';

export type GoliathStage = 'approach' | 'composure' | 'aim' | 'done';

export interface Lane { x: number; state: 'safe' | 'tell' | 'active' }

export interface GoliathState {
  giant: Giant;
  impactX: number;
  stage: GoliathStage;
  /** Kept for the renderer: true while the aim opportunity is open. */
  open: number;
  stone: boolean;
  lanes: Lane[];
  advance: { state: 'idle' | 'tell' | 'active'; x: number; ticks: number };
  advancesCleared: number;
  pauseTicks: number;
  misses: number;
  tell: number;
}

export const GOLIATH_X = 3550;
export const STONE_BAY_X = 3000;
export const AIM_ZONE: [number, number] = [3150, 3350];
const LANE_XS = [900, 1700, 2500];
const LANE_HALF_WIDTH = 60;
const LANE_PERIOD = 240;
const LANE_ACTIVE = 40;
const ADVANCE_ACTIVE = 48;
const ADVANCE_HEIGHT = 50;
const ADVANCES_NEEDED = 2;

const timing = (difficulty: string) => ({
  // Easy gives 1.5x warning and a longer opening; outcomes and rules are the same.
  laneTell: difficulty === 'easy' ? 90 : 60,
  advanceTell: difficulty === 'easy' ? 90 : 60,
  pause: difficulty === 'easy' ? 160 : difficulty === 'hard' ? 120 : 100,
});

export function createGoliath(): GoliathState {
  return {
    giant: giantStart(), impactX: GOLIATH_X * Q, stage: 'approach', open: 0, stone: false,
    lanes: LANE_XS.map(x => ({ x: x * Q, state: 'safe' })),
    advance: { state: 'idle', x: GOLIATH_X * Q, ticks: 0 },
    advancesCleared: 0, pauseTicks: 0, misses: 0, tell: 0,
  };
}

export interface GoliathHooks {
  say(text: string, ticks: number): void;
  complete(): void;
}

/** One tick of the reenactment. `interact` is this tick's aim/collect press. */
export function stepGoliath(g: GoliathState, f: Fighter, tick: number, interact: boolean, difficulty: string, hooks: GoliathHooks, runCap: number): void {
  const t = timing(difficulty);
  if (g.advance.state === 'idle' && g.stage !== 'done') {
    if (giantGrapple(g.giant, f, runCap, g.stage !== 'aim') || g.giant.move === 'reach') return;
  }
  const resetTo = (x: number, text: string) => {
    f.x = x * Q; f.y = 82 * Q; f.vx = f.vy = f.kx = 0; f.action = null;
    hooks.say(text, 150);
  };

  if (g.stage === 'approach') {
    const phase = tick % LANE_PERIOD;
    for (const [n, lane] of g.lanes.entries()) {
      // Lanes are staggered so a safe crossing always exists.
      const p = (phase + n * 80) % LANE_PERIOD;
      lane.state = p < t.laneTell ? 'tell' : p < t.laneTell + LANE_ACTIVE ? 'active' : 'safe';
      if (lane.state === 'active' && Math.abs(f.x - lane.x) < LANE_HALF_WIDTH * Q && f.y < 150 * Q) {
        resetTo(lane.x / Q - 200, 'The spear lane is marked. Wait for it to clear, then cross.');
      }
    }
    if (interact && Math.abs(f.x - STONE_BAY_X * Q) < 90 * Q) {
      g.stone = true;
      g.stage = 'composure';
      g.lanes.forEach(l => (l.state = 'safe'));
      hooks.say('One smooth stone from the stream. Stay composed: watch the shield advance.', 220);
    }
    return;
  }

  if (g.stage === 'composure') {
    const a = g.advance;
    if (a.state === 'idle') {
      a.state = 'tell'; a.ticks = t.advanceTell; a.x = g.giant.x; g.impactX = a.x;
      g.tell = a.ticks;
      hooks.say('I see his shield rise. Jump the shockwave when it reaches my feet.', a.ticks);
    } else if (--a.ticks <= 0) {
      if (a.state === 'tell') { a.state = 'active'; a.ticks = ADVANCE_ACTIVE; }
      else {
        a.state = 'idle';
        g.advancesCleared++;
        if (g.advancesCleared >= ADVANCES_NEEDED) {
          g.stage = 'aim'; g.pauseTicks = t.pause; g.open = 1;
          hooks.say('Goliath pauses. Step into the marked zone and aim.', t.pause);
        }
      }
    }
    g.giant.height = a.state === 'tell' ? shieldHop(a.ticks) : 0;
    if (a.state === 'active') {
      // The advance sweeps from Goliath toward the stone bay at ankle height.
      const progress = ADVANCE_ACTIVE - a.ticks;
      const radius = ((GOLIATH_X - STONE_BAY_X) * progress / ADVANCE_ACTIVE) * Q;
      a.x = g.impactX - radius;
      if (Math.abs(Math.abs(f.x - g.impactX) - radius) < 40 * Q && f.y < (82 + ADVANCE_HEIGHT) * Q) {
        a.state = 'idle';
        g.advancesCleared = 0;
        resetTo(STONE_BAY_X - 150, 'Stepped back to the stream. Composure starts again; nothing is lost.');
      }
    }
    return;
  }

  if (g.stage === 'aim') {
    const inZone = f.x >= AIM_ZONE[0] * Q && f.x <= AIM_ZONE[1] * Q;
    if (interact) {
      if (inZone) {
        g.stage = 'done'; g.open = 0;
        hooks.say('One decisive stone. The account continues without graphic aftermath.', 360);
        hooks.complete();
        return;
      }
      g.misses++;
    }
    if (interact || --g.pauseTicks <= 0) {
      g.stage = 'composure'; g.open = 0; g.advancesCleared = 0; g.advance.state = 'idle';
      hooks.say(interact ? 'The stone went wide. Regain composure and wait for the next pause.' : 'The opening passed. Stay composed for the next one.', 180);
    }
  }
}
