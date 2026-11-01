// Advanced lessons (12_Tutorial_and_Training): one visible goal each, completed only
// by real simulation outcomes, with feedback that names the actual state.

import type { SimState } from '../../../../packages/sim/src/index.ts';

export interface Drill {
  id: string;
  title: string;
  goal: string;
  /** Optional staging when the drill starts (weapon, position). */
  setup?: (s: SimState) => void;
}

export const DRILLS: Drill[] = [
  { id: 'fastfall', title: 'Fast fall', goal: 'Jump, then hold Down while falling to drop faster.' },
  { id: 'weapons', title: 'Weapons', goal: 'Pick up a weapon from a crate, throw it, then pick one up and drop it with Down + Pickup.',
    setup: s => { s.pickupTick = s.tick + 1; } },
  { id: 'gravity', title: 'Gravity cancel', goal: 'In the air, Dodge with no direction, then Light: a grounded attack in mid-air. It spends the dodge and ends its protection.' },
  { id: 'chase', title: 'Chase', goal: 'Land a light hit on the dummy, then Dodge toward it to chase.' },
  { id: 'dashjump', title: 'Dash jump', goal: 'Dodge sideways on the ground to dash, then Jump during the dash.' },
  { id: 'wall', title: 'Wall jump', goal: 'Fall beside the stage wall holding toward it to slide, then Jump away. Wall help has a limit.' },
];

export class DrillRun {
  done = false;
  note = '';
  private prevAction = '';
  private picked = 0;
  private threw = false;
  private dropped = false;
  private hit = false;
  readonly drill: Drill;

  constructor(drill: Drill) { this.drill = drill; }

  /** Call once per tick after `step`. Returns true when the drill completes. */
  observe(s: SimState, fastFallCapQ: number, fallCapQ: number): boolean {
    if (this.done) return false;
    const [p, d] = s.fighters;
    const ev = s.events.filter(e => e.fighter === p.id);
    switch (this.drill.id) {
      case 'fastfall':
        if (p.vy < -fallCapQ && p.vy >= -fastFallCapQ) this.done = true;
        break;
      case 'weapons':
        this.picked += ev.filter(e => e.type === 'pickup').length;
        if (ev.some(e => e.type === 'throw')) this.threw = true;
        if (this.prevAction === 'drop' && p.action?.kind !== 'drop' && p.weapon === 'unarmed') this.dropped = true;
        this.note = `${this.picked ? '✓' : '○'} pick up  ${this.threw ? '✓' : '○'} throw  ${this.dropped ? '✓' : '○'} drop`;
        if (this.picked >= 2 && this.threw && this.dropped) this.done = true;
        break;
      case 'gravity':
        if (p.action?.kind === 'attack' && p.action.cancelled) this.done = true;
        else if (p.action?.kind === 'dodge' && p.action.airborne && (p.action.dx || p.action.dy)) this.note = 'That was a directional dodge; try a neutral dodge.';
        else if (p.action?.kind === 'dodge' && !p.action.airborne) this.note = 'That dodge was on the ground; jump first.';
        break;
      case 'chase':
        if (s.events.some(e => e.type === 'hit' && e.fighter === d?.id && e.attacker === p.id)) this.hit = true;
        if (this.hit && p.action?.kind === 'chase') this.done = true;
        else if (!this.hit && p.action?.kind === 'chase') this.note = 'A chase needs a confirmed hit first.';
        break;
      case 'dashjump':
        if (ev.some(e => e.type === 'jump') && this.prevAction === 'dash') this.done = true;
        break;
      case 'wall':
        if (ev.some(e => e.type === 'jump') && p.wallTicks > 0 && !p.ground) this.done = true;
        else if (p.wallTicks > 0) this.note = `Sliding — wall help used ${p.wallTicks} of 90 ticks.`;
        break;
    }
    this.prevAction = p.action?.kind ?? '';
    return this.done;
  }

  get text(): string { return `${this.drill.title}: ${this.drill.goal}${this.note ? '  ' + this.note : ''}`; }
}
