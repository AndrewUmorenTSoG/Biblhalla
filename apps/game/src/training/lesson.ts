// The first lesson (12_Tutorial_and_Training): seven short steps that advance only on
// real simulation outcomes (movement, jumps, hits, resolved moves, dodges, recovery,
// ring-outs), never on raw button presses. Reads state; the only writes are lesson
// staging on the dummy (its behaviour and, for the finish, its damage).

import type { SimState } from '../../../../packages/sim/src/index.ts';
import { Q } from '../../../../packages/sim/src/index.ts';

export type LessonStep = 'move' | 'jump' | 'attack' | 'directional' | 'dodge' | 'return' | 'finish' | 'done';

export const LESSON_TEXT: Record<LessonStep, string> = {
  move: 'Move: walk to the far marker and back.',
  jump: 'Jump: jump, then jump again in the air.',
  attack: 'Attack: hit the dummy with Light. More damage means stronger knockback.',
  directional: 'Directional attacks: hold Side then Light, and Down then Light.',
  dodge: 'Dodge: the dummy will swing slowly. Dodge as it strikes — dodge has a cooldown.',
  return: 'Recover: step off the edge, then air-jump or use an air Heavy to return.',
  finish: 'Finish: the dummy is at high damage. Knock it out past the side.',
  done: 'Lesson complete. Play a bot, or practise more in Training.',
};

const MAX_AIR_JUMPS = 2;
const ORDER: LessonStep[] = ['move', 'jump', 'attack', 'directional', 'dodge', 'return', 'finish', 'done'];

export class Lesson {
  step: LessonStep = 'move';
  /** Human-readable note about the last resolved move, e.g. "That was sword_slight". */
  note = '';
  private startX = 0;
  private reachedFar = false;
  private groundJump = false;
  private sides = new Set<string>();
  private wentOff = false;
  private staged = false;

  /** Call once per tick after `step`. Returns true when the step changed. */
  observe(s: SimState): boolean {
    const [p, d] = s.fighters;
    if (!p || !d || this.step === 'done') return false;
    const before = this.step;
    const events = s.events;
    // The dummy swings only during the dodge lesson; otherwise it stands still.
    s.trainingBot = this.step === 'dodge' ? 'attack' : 'stand';
    switch (this.step) {
      case 'move':
        if (!this.startX) this.startX = p.x || 1;
        if (Math.abs(p.x - this.startX) > 150 * Q) this.reachedFar = true;
        if (this.reachedFar && Math.abs(p.x - this.startX) < 40 * Q) this.advance();
        break;
      case 'jump':
        // A ground jump refills air jumps; an air jump spends one.
        for (const e of events) if (e.type === 'jump' && e.fighter === p.id) {
          if (p.jumps === MAX_AIR_JUMPS) this.groundJump = true;
          else if (this.groundJump) this.advance();
        }
        break;
      case 'attack':
        if (events.some(e => e.type === 'hit' && e.fighter === d.id && e.attacker === p.id)) this.advance();
        break;
      case 'directional':
        for (const e of events) if (e.type === 'attack' && e.fighter === p.id) {
          const move = String(e.move);
          this.note = `That was ${move.replace(/_/g, ' ')}.`;
          if (/_slight$/.test(move)) this.sides.add('side');
          if (/_dlight$/.test(move)) this.sides.add('down');
        }
        if (this.sides.size === 2) this.advance();
        break;
      case 'dodge':
        if (p.action?.kind === 'dodge' && d.action?.kind === 'attack' && Math.abs(p.x - d.x) < 140 * Q) this.advance();
        else if (p.action?.kind === 'dodge' && p.action.dx) this.note = 'That was a directional dodge — any dodge works here, but stay close.';
        break;
      case 'return': {
        const [mx, my, mw, mh] = s.map.main.rectUnits;
        const off = p.x < mx * Q || p.x > (mx + mw) * Q || p.y < (my + mh) * Q - 10 * Q;
        if (off) this.wentOff = true;
        if (this.wentOff && p.ground === s.map.main.id) this.advance();
        if (p.respawn) this.wentOff = false;
        break;
      }
      case 'finish':
        if (!this.staged) { d.damage = Math.max(d.damage, 1500); this.staged = true; }
        if (events.some(e => e.type === 'ko' && e.fighter === d.id)) this.advance();
        break;
    }
    return this.step !== before;
  }

  private advance(): void {
    this.step = ORDER[ORDER.indexOf(this.step) + 1];
    this.staged = false;
    this.note = '';
  }

  get text(): string { return `${LESSON_TEXT[this.step]}${this.note ? ' ' + this.note : ''}`; }
  get progress(): string { return `${Math.min(ORDER.indexOf(this.step) + 1, 7)} / 7`; }
}
