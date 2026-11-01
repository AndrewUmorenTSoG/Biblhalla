// Computer opponents. Bots read delayed observations of their target and emit the
// same semantic inputs a player would; difficulty changes timing, never stats.

import type { SimContext } from './context.ts';
import type { Fighter, Input, SimState } from './types.ts';
import { Q, nextRandom } from './fixed.ts';
import { event, input } from './state.ts';
import { eligibleItem } from './moveResolver.ts';

const HISTORY = 64;

/** Training dummy presets (12_Tutorial_and_Training): fixed, reproducible behaviours. */
export const DUMMY_BEHAVIOURS = ['stand', 'jump', 'approach', 'attack', 'dodge', 'recover'];

function dummy(ctx: SimContext, s: SimState, f: Fighter): Input {
  // ai.tell marks the tick hitstun ends (dodge preset only).
  if (s.trainingBot === 'dodge') f.ai.tell = f.stun === 1 ? 2 : Math.max(0, f.ai.tell - 1);
  const player = s.fighters.find(p => p.human && p.stocks);
  const toward = player ? (Math.sign(player.x - f.x) || f.facing) : f.facing;
  const near = player ? Math.abs(player.x - f.x) < 90 * Q : false;
  const main = s.map.main.rectUnits;
  const left = main[0] * Q, right = (main[0] + main[2]) * Q, top = (main[1] + main[3]) * Q;
  // Every preset still recovers to the stage, so practice is never interrupted by self-KOs.
  const offStage = !f.ground && (f.x < left - 10 * Q || f.x > right + 10 * Q || f.y < top - 10 * Q);
  if (offStage || s.trainingBot === 'recover' && !f.ground) return recover(f, left, right, top);
  switch (s.trainingBot) {
    case 'jump': return input({ jump: !!f.ground && s.tick % 60 === 0, jumpHeld: true });
    case 'approach': return input({ x: near ? 0 : toward });
    case 'attack': return input({ x: near ? 0 : toward, light: near && s.tick % 45 === 0 });
    // Dodges on its first actionable tick after hitstun: shows the escape window.
    case 'dodge': return input({ dodge: !f.stun && !f.action && f.ai.tell === 1 });
    default: return input();
  }
}

/**
 * Enemy catalog tells (11_Story_Campaign/03): ticks of visible preparation before a
 * light or heavy attack, and how often the heavy is chosen. Same moves, frame data
 * and stats as any fighter; only the readable windup is added.
 */
export const ARCHETYPES: Record<string, { lightTell: number; heavyTell: number; heavyChance: number }> = {
  road_guard: { lightTell: 18, heavyTell: 26, heavyChance: 30 },
  shield_guard: { lightTell: 24, heavyTell: 30, heavyChance: 45 },
  archer: { lightTell: 30, heavyTell: 30, heavyChance: 35 },
  brute: { lightTell: 30, heavyTell: 42, heavyChance: 60 },
};

export function bot(ctx: SimContext, s: SimState, f: Fighter): Input {
  if (s.mode === 'training' && s.trainingBot === 'idle') return input();
  if (s.mode === 'training' && DUMMY_BEHAVIOURS.includes(s.trainingBot)) return dummy(ctx, s, f);
  // Scripted bosses act only through their authored pattern (boss.ts).
  if (s.bossScript && f.guard !== null) return input();
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
  // Wave archetypes wind up visibly before every attack (enemy catalog tells).
  if (f.role && f.ai.tell > 0) {
    if (f.stun || f.hitstop || f.respawn) { f.ai.tell = 0; return input(); }
    f.ai.tell--;
    return f.ai.tell === 0 ? input({ x: f.ai.tellDir, [f.ai.tellButton ?? 'light']: true }) : input();
  }
  // A bot knows its own resources exactly, so recovery is planned every tick rather
  // than on the decision interval used for reading the opponent.
  const main = s.map.main.rectUnits;
  const left = main[0] * Q, right = (main[0] + main[2]) * Q, top = (main[1] + main[3]) * Q;
  const beyondEdge = f.x < left - 10 * Q || f.x > right + 10 * Q;
  if (!f.ground && (beyondEdge || f.y < top - 10 * Q)) return recover(f, left, right, top);

  if (s.tick < f.ai.next) return { ...f.ai.intent, jump: false, light: false, heavy: false, item: false, dodge: false };
  f.ai.next = s.tick + d.decisionTicks;

  const delta = seen.x - f.x, dist = Math.abs(delta) / Q, sign = Math.sign(delta) || f.facing;
  const v: Partial<Input> = { x: sign, jumpHeld: true };
  {
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
      } else if (f.role && ARCHETYPES[f.role] && f.ground && !f.action) {
        const a = ARCHETYPES[f.role], heavy = choose < a.heavyChance;
        f.ai.tell = heavy ? a.heavyTell : a.lightTell;
        f.ai.tellButton = heavy ? 'heavy' : 'light';
        f.ai.tellDir = sign;
        v.x = 0;
        event(s, 'enemyTell', { fighter: f.id, role: f.role, button: f.ai.tellButton, ticks: f.ai.tell });
      } else if (choose < 25) v.heavy = true;
      else v.light = true;
      // Vary direction so the same attack is not repeated: neutral, side or down.
      if ((v.light || v.heavy) && !f.ai.tell) {
        const aim = nextRandom(s) % 3;
        if (aim === 0) v.x = 0;
        else if (aim === 1 && f.ground) v.y = -1;
      }
      if (s.difficulty !== 'easy' && seen.action === 'attack' && nextRandom(s) % 100 < 45) v.dodge = true;
    }
    if (s.difficulty === 'extreme' && dist < 55 && f.ground && nextRandom(s) % 100 < 35) { v.x = -sign; v.dodge = true; }
  }
  // Raiders in defend scenes go for the nearest post when no player is close.
  if (f.role && s.guardPoints?.length && dist > 200) {
    const post = [...s.guardPoints].sort((a, b) => Math.abs(a - f.x) - Math.abs(b - f.x))[0];
    v.x = Math.abs(post - f.x) < 30 * Q ? 0 : Math.sign(post - f.x);
    v.light = v.heavy = false;
  }
  // Never walk off the main stage while chasing something beyond it.
  if (f.ground && f.ground === s.map.main.id && v.x && !v.jump) {
    const ahead = f.x + v.x * EDGE_MARGIN_UNITS * Q;
    if (ahead < left || ahead > right) v.x = 0;
  }
  f.ai.intent = input(v);
  return f.ai.intent;
}

const EDGE_MARGIN_UNITS = 30;

/** Head for the stage: spend air jumps while falling, then the recovery move. */
function recover(f: Fighter, left: number, right: number, top: number): Input {
  // Beneath the stage, a straight-up recovery hits the underside: first drift out past
  // the nearest edge, then come back up and in.
  const under = f.y < top && f.x > left - 20 * Q && f.x < right + 20 * Q && (f.jumps > 0 || f.recovery > 0);
  const outward = f.x < (left + right) / 2 ? -1 : 1;
  const v: Partial<Input> = { x: under ? outward : f.x < left + 40 * Q ? 1 : f.x > right - 40 * Q ? -1 : 0, jumpHeld: true };
  if (under) return input(v);
  if (f.action || f.stun || f.hitstop) return input(v);
  // Plan with exact own resources: drift while high, spend jumps late, and use an air
  // dodge for horizontal reach only when the stage is still far away.
  const edgeGap = f.x < left ? left - f.x : f.x > right ? f.x - right : 0;
  const falling = f.vy < 0;
  if (falling && edgeGap > FAR_RECOVERY_UNITS * Q && f.dodgeCD === 0 && f.y < top + 60 * Q && f.y > top - 160 * Q) {
    v.dodge = true;
    return input(v);
  }
  const jumpLine = top + (edgeGap > 120 * Q ? 40 : 0) * Q;
  if (falling && f.y < jumpLine && f.jumps > 0) v.jump = true;
  else if (falling && f.y < top && f.jumps === 0 && f.recovery > 0) v.heavy = true;
  return input(v);
}

/** Beyond this horizontal gap a bot spends its air dodge to close distance. */
const FAR_RECOVERY_UNITS = 180;
