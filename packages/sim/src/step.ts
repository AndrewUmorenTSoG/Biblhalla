// The fixed 60 Hz tick: step(state, inputFrames) -> state + events.

import type { SimContext } from './context.ts';
import type { Fighter, Input, InputFrames, SimState } from './types.ts';
import { finish, input } from './state.ts';
import { updateFighter, fighterOutside } from './physics.ts';
import { updateItems } from './items.ts';
import { combat } from './combat.ts';
import { arrivals, checkResult, knockOut } from './rules.ts';
import { bot } from './ai.ts';

const hasWaves = (s: SimState) => s.mode === 'waves' || s.mode === 'story';

export function step(ctx: SimContext, s: SimState, inputs: InputFrames = {}): SimState {
  if (s.phase === 'paused' || s.phase === 'result') return s;
  s.events = [];
  // The countdown spends no match time.
  if (s.phase === 'countdown') {
    if (--s.countdown <= 0) s.phase = 'playing';
    return s;
  }
  s.tick++;
  s.remaining--;
  if (hasWaves(s)) {
    arrivals(ctx, s);
    if (s.result) return s;
  }

  const frames: Record<number, Input> = {};
  for (const f of s.fighters) frames[f.id] = f.human ? input(inputs[f.id] || inputs[f.inputId] || {}) : bot(ctx, s, f);

  // Stable ascending order; simultaneous neutral pickups rotate priority by match count.
  const order = [...s.fighters].sort((a, b) => a.id - b.id);
  const contenders = order.filter(f => f.weapon === 'unarmed' && frames[f.id].item && !f.action && !f.stun);
  if (contenders.length > 1) {
    const first = contenders[s.pickupPriority % contenders.length];
    order.sort((a, b) => (a.id === first.id ? -1 : b.id === first.id ? 1 : a.id - b.id));
  }
  for (const f of order) updateFighter(ctx, s, f, frames[f.id]);
  updateItems(ctx, s);
  combat(ctx, s);
  // All KOs resolve from the same tick before any result is decided.
  const finalKOs: Fighter[] = [];
  for (const f of s.fighters) {
    if (!f.stocks || f.respawn || !fighterOutside(s, f)) continue;
    knockOut(ctx, s, f);
    if (!f.stocks) finalKOs.push(f);
  }
  if (hasWaves(s) && s.remaining <= 0) finish(s, false, 'Encounter time expired');
  else checkResult(ctx, s, finalKOs);
  return s;
}
