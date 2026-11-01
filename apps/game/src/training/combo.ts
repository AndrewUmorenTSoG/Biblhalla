// Training instrumentation. Reads simulation state after each tick; never writes it.
//
// A combo continues only while the defender has had no actionable tick since the
// previous hit. Any actionable gap resets the counter and is reported as the escape
// gap, so "true combo" labels come from evidence, not from how fast moves look.

import type { Fighter, InputFrame, SimState } from '../../../../packages/sim/src/index.ts';

export const INPUT_HISTORY = 30;

export interface ComboReport {
  /** Hits in the current combo on the defender. */
  hits: number;
  damageTenths: number;
  /** Actionable ticks the defender had before the latest hit (0 = true combo link). */
  lastGap: number;
  /** Longest combo seen this session. */
  best: number;
}

/** A defender can act when not in hitstun, hitstop, respawn, or an action it cannot leave. */
export function actionable(f: Fighter): boolean {
  return f.stocks > 0 && !f.respawn && !f.stun && !f.hitstop && !f.action;
}

export class ComboTracker {
  readonly report: ComboReport = { hits: 0, damageTenths: 0, lastGap: 0, best: 0 };
  /** Actionable ticks since the last hit; Infinity before the first. */
  private gap = Infinity;
  readonly attackerId: number;
  readonly defenderId: number;

  constructor(attackerId: number, defenderId: number) {
    this.attackerId = attackerId;
    this.defenderId = defenderId;
  }

  /** Call once per simulation tick, after `step`. */
  observe(s: SimState): void {
    const defender = s.fighters.find(f => f.id === this.defenderId);
    if (!defender) return;
    const hits = s.events.filter(e => e.type === 'hit' && e.fighter === this.defenderId && e.attacker === this.attackerId);
    if (hits.length) {
      const linked = this.gap === 0 && this.report.hits > 0;
      this.report.lastGap = Number.isFinite(this.gap) ? this.gap : 0;
      this.report.hits = linked ? this.report.hits + hits.length : hits.length;
      this.report.damageTenths = (linked ? this.report.damageTenths : 0) + hits.reduce((n, e) => n + Number(e.damage || 0), 0);
      this.report.best = Math.max(this.report.best, this.report.hits);
      this.gap = 0;
      return;
    }
    if (actionable(defender) && Number.isFinite(this.gap)) this.gap++;
  }
}

/** Rolling, deduplicated history of semantic inputs for the training overlay. */
export class InputHistory {
  readonly entries: { tick: number; text: string }[] = [];

  record(tick: number, frame: InputFrame | undefined): void {
    const text = describe(frame);
    if (!text) return;
    if (this.entries.at(-1)?.text === text) return;
    this.entries.push({ tick, text });
    if (this.entries.length > INPUT_HISTORY) this.entries.shift();
  }
}

export function describe(frame: InputFrame | undefined): string {
  if (!frame) return '';
  const dir = (frame.y ?? 0) > 0 ? '↑' : (frame.y ?? 0) < 0 ? '↓' : '';
  const side = (frame.x ?? 0) > 0 ? '→' : (frame.x ?? 0) < 0 ? '←' : '';
  const buttons = [frame.jump && 'Jump', frame.light && 'Light', frame.heavy && 'Heavy', frame.dodge && 'Dodge', frame.item && 'Item', frame.interact && 'Interact'].filter(Boolean);
  if (!buttons.length) return '';
  return `${dir}${side}${dir || side ? ' ' : ''}${buttons.join('+')}`;
}
