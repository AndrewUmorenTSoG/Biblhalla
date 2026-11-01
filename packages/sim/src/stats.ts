// Per-match instrumentation (15_Balance_and_Combat_Instrumentation). A pure observer:
// feed it the state after every tick; it never changes the simulation. No player
// names are recorded, only fighter ids and roster heroes.

import type { SimState } from './types.ts';

export interface FighterStats {
  hero: string;
  attacks: number;
  hits: number;
  whiffs: number;
  damageDealt: number;
  kos: number;
  selfKos: number;
  chaseUses: number;
  airCancels: number;
  dodges: number;
  dodgeSuccesses: number;
  recoveryAttempts: number;
  weaponTicks: number;
}

export interface MatchStats {
  contentHash: string;
  ticks: number;
  fighters: Record<number, FighterStats>;
  winners: number[];
}

const SELF_KO_WINDOW = 180;

export class MatchRecorder {
  readonly stats: MatchStats;
  private lastHitOn = new Map<number, number>();
  private lastAttackerOn = new Map<number, number>();
  private open = new Map<number, { instance: number; hit: boolean }>();
  private dodgeOpen = new Map<number, number>();

  constructor(s: SimState) {
    this.stats = { contentHash: s.contentHash, ticks: 0, fighters: {}, winners: [] };
  }

  private f(id: number, s: SimState): FighterStats {
    return (this.stats.fighters[id] ??= {
      hero: s.fighters.find(x => x.id === id)?.hero ?? '?', attacks: 0, hits: 0, whiffs: 0, damageDealt: 0, kos: 0, selfKos: 0,
      chaseUses: 0, airCancels: 0, dodges: 0, dodgeSuccesses: 0, recoveryAttempts: 0, weaponTicks: 0,
    });
  }

  observe(s: SimState): void {
    this.stats.ticks = s.tick;
    for (const e of s.events) {
      const id = e.fighter as number;
      if (e.type === 'attack') {
        const st = this.f(id, s);
        st.attacks++;
        if (/_recovery$/.test(String(e.move))) st.recoveryAttempts++;
      }
      if (e.type === 'hit') {
        this.lastHitOn.set(id, s.tick);
        const attacker = e.attacker as number;
        if (attacker) this.lastAttackerOn.set(id, attacker);
        if (attacker) { const st = this.f(attacker, s); st.hits++; st.damageDealt += Number(e.damage || 0); }
        const o = this.open.get(attacker);
        if (o) o.hit = true;
      }
      if (e.type === 'ko') {
        const st = this.f(id, s);
        if (s.tick - (this.lastHitOn.get(id) ?? -1e9) > SELF_KO_WINDOW) st.selfKos++;
        // Credit the KO to whoever last hit this fighter, if recently.
        const scorer = this.lastAttackerOn.get(id);
        if (scorer !== undefined && s.tick - (this.lastHitOn.get(id) ?? -1e9) <= SELF_KO_WINDOW) this.f(scorer, s).kos++;
      }
      if (e.type === 'result') this.stats.winners = (e.winners as number[]) ?? [];
    }
    for (const x of s.fighters) {
      const st = this.f(x.id, s);
      if (x.weapon !== 'unarmed') st.weaponTicks++;
      const a = x.action;
      // Whiffs: an attack instance that ends without confirming a hit.
      const prev = this.open.get(x.id);
      if (prev && (!a || a.kind !== 'attack' || a.instance !== prev.instance)) {
        if (!prev.hit && !a?.confirmed) st.whiffs++;
        this.open.delete(x.id);
      }
      if (a?.kind === 'attack' && !this.open.has(x.id)) {
        this.open.set(x.id, { instance: a.instance, hit: !!a.confirmed });
        if (a.cancelled) st.airCancels++;
      }
      if (a?.kind === 'attack' && a.confirmed) { const o = this.open.get(x.id); if (o) o.hit = true; }
      if (a?.kind === 'chase' && a.tick === 1) st.chaseUses++;
      // Dodge success: a dodge during which an enemy attack zone was active nearby and no hit landed.
      if (a?.kind === 'dodge' && a.tick === 1) { st.dodges++; this.dodgeOpen.set(x.id, s.tick); }
      const started = this.dodgeOpen.get(x.id);
      if (started !== undefined && a?.kind !== 'dodge') {
        const threatened = s.fighters.some(o => o.id !== x.id && o.action?.kind === 'attack' && Math.abs(o.x - x.x) < 140 * 256);
        const hitSince = (this.lastHitOn.get(x.id) ?? -1) >= started;
        if (threatened && !hitSince) st.dodgeSuccesses++;
        this.dodgeOpen.delete(x.id);
      }
    }
  }
}
