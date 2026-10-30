// Computer opponents. Bots read delayed observations of their target and emit the
// same semantic inputs a player would; difficulty changes timing, never stats.

import type { SimContext } from './context.ts';
import type { Fighter, Input, SimState } from './types.ts';
import { Q, nextRandom } from './fixed.ts';
import { event, input } from './state.ts';
import { eligibleItem } from './moveResolver.ts';

const HISTORY = 64;

export function bot(ctx: SimContext, s: SimState, f: Fighter): Input {
  if (s.mode === 'training' && s.trainingBot === 'idle') return input();
  const target = s.fighters
    .filter(t => t.id !== f.id && t.team !== f.team && t.stocks && !t.respawn)
    .sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x) || a.id - b.id)[0];
  if (!target) return input();

  const d = ctx.R.difficulty[s.difficulty];
  f.ai.history.push({ x: target.x, y: target.y, action: target.action?.kind || '', tick: s.tick });
  if (f.ai.history.length > HISTORY) f.ai.history.shift();
  const seen = f.ai.history[Math.max(0, f.ai.history.length - 1 - d.reactionTicks)];

  // Champions telegraph every heavy: a readable windup, then the strike.
  if (f.guard !== null && f.maxGuard !== null) {
    f.ai.phase = f.guard < f.maxGuard * 0.3 ? 3 : f.guard < f.maxGuard * 0.65 ? 2 : 1;
    if (f.ai.tell > 0) {
      f.ai.tell--;
      return f.ai.tell === 0 ? input({ x: f.ai.tellDir, heavy: true }) : input();
    }
  }
  if (s.tick < f.ai.next) return { ...f.ai.intent, jump: false, light: false, heavy: false, item: false, dodge: false };
  f.ai.next = s.tick + d.decisionTicks;

  const delta = seen.x - f.x, dist = Math.abs(delta) / Q, sign = Math.sign(delta) || f.facing;
  const v: Partial<Input> = { x: sign, jumpHeld: true };
  const main = s.map.main.rectUnits;
  const offStage = f.y < (main[1] + main[3]) * Q - 10 * Q || f.x < (main[0] - 25) * Q || f.x > (main[0] + main[2] + 25) * Q;
  if (offStage) {
    v.x = f.x < 0 ? 1 : -1;
    if (f.vy < 0 && f.jumps) v.jump = true;
    else if (f.recovery) v.heavy = true;
  } else {
    if (f.weapon === 'unarmed') {
      if (eligibleItem(ctx, s, f)) v.item = true;
      else if (s.items.length) {
        v.x = Math.sign(s.items[0].x - f.x);
        if (s.items[0].y > f.y + 80 * Q) v.jump = true;
      }
    }
    if (dist < 75) v.x = 0;
    if (seen.y > f.y + 95 * Q && f.ground) v.jump = true;
    const ranged = f.weapon === 'bow' || f.weapon === 'sling';
    const reach = ranged ? 440 : f.weapon === 'spear' ? 175 : 110;
    if (dist < reach && Math.abs(seen.y - f.y) < 100 * Q) {
      v.x = sign;
      const choose = nextRandom(s) % 100;
      if (f.guard !== null && f.ground && !f.action) {
        f.ai.tell = s.difficulty === 'easy' ? 54 : 36;
        f.ai.tellDir = sign;
        v.x = 0;
        event(s, 'bossTell', { fighter: f.id, phase: f.ai.phase });
      } else if (choose < 25) v.heavy = true;
      else v.light = true;
      if (s.difficulty !== 'easy' && seen.action === 'attack' && nextRandom(s) % 100 < 45) v.dodge = true;
    }
    if (s.difficulty === 'extreme' && dist < 55 && f.ground && nextRandom(s) % 100 < 35) { v.x = -sign; v.dodge = true; }
  }
  f.ai.intent = input(v);
  return f.ai.intent;
}
