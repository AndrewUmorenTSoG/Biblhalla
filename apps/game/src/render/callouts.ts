// On-screen callouts (presentation only): a combo counter over a fighter taking a true
// string of hits, "KO!" where a fighter leaves the arena, and "GO!" as the countdown
// ends. Reads simulation events and state; never writes to them.

const Q = 256;
/** Ticks a finished combo count or a KO stays on screen. */
export const CALLOUT_TICKS = 45;

interface Combo { hits: number; damage: number; x: number; y: number; open: boolean; endTick: number }
interface Text { text: string; x: number; y: number; tick: number; big: boolean }

export class Callouts {
  combos = new Map<number, Combo>();
  texts: Text[] = [];
  private lastEvent = 0;
  private stunned = new Map<number, boolean>();
  private wasCountdown = false;
  goTick = -1;

  reset(): void { this.combos.clear(); this.texts = []; this.lastEvent = 0; this.stunned.clear(); this.wasCountdown = false; this.goTick = -1; }

  update(world: { tick: number; phase: string; events: any[]; fighters: any[] }): void {
    if (world.events.length && world.events[world.events.length - 1].id < this.lastEvent) this.reset();
    if (this.wasCountdown && world.phase === 'playing') this.goTick = world.tick;
    this.wasCountdown = world.phase === 'countdown';
    for (const e of world.events) {
      if (e.id <= this.lastEvent) continue;
      this.lastEvent = e.id;
      if (e.type === 'hit') {
        const t = world.fighters.find((f: any) => f.id === e.fighter);
        if (!t) continue;
        // A hit that lands while the target was still stunned continues the string.
        const c = this.combos.get(t.id);
        const chained = !!c?.open && this.stunned.get(t.id) === true;
        const next: Combo = chained ? c! : { hits: 0, damage: 0, x: 0, y: 0, open: true, endTick: -1 };
        next.hits++; next.damage += Number(e.damage) || 0; next.x = t.x; next.y = t.y; next.open = true;
        this.combos.set(t.id, next);
      }
      if (e.type === 'ko') {
        this.texts.push({ text: 'KO!', x: e.x, y: e.y, tick: world.tick, big: true });
        this.combos.delete(e.fighter);
      }
    }
    for (const f of world.fighters) {
      const stunned = !!(f.stun || f.hitstop);
      this.stunned.set(f.id, stunned);
      const c = this.combos.get(f.id);
      if (!c) continue;
      if (c.open) { c.x = f.x; c.y = f.y; }
      if (c.open && !stunned) { c.open = false; c.endTick = world.tick; }
      if (!c.open && world.tick - c.endTick > CALLOUT_TICKS) this.combos.delete(f.id);
    }
    this.texts = this.texts.filter(t => world.tick - t.tick <= CALLOUT_TICKS);
  }

  /** Visible combo counts (two hits or more). */
  visibleCombos(): { id: number; hits: number; damage: number; x: number; y: number; open: boolean }[] {
    return [...this.combos].filter(([, c]) => c.hits >= 2).map(([id, c]) => ({ id, ...c }));
  }

  draw(c: CanvasRenderingContext2D, screen: (x: number, y: number) => { x: number; y: number }, zoom: number, tick: number, reduced: boolean): void {
    c.save();
    c.textAlign = 'center';
    for (const k of this.visibleCombos()) {
      const p = screen(k.x, k.y + 110 * Q);
      const fade = k.open ? 1 : Math.max(0, 1 - (tick - (this.combos.get(k.id)?.endTick ?? tick)) / CALLOUT_TICKS);
      c.globalAlpha = fade;
      c.font = `bold ${Math.round(20 + Math.min(10, k.hits * 2) * (reduced ? 0 : 1))}px Georgia`;
      c.lineWidth = 4; c.strokeStyle = '#1d1712'; c.fillStyle = k.open ? '#ffd36b' : '#f3e7c8';
      const text = `${k.hits} HITS`;
      c.strokeText(text, p.x, p.y); c.fillText(text, p.x, p.y);
      c.font = 'bold 13px system-ui';
      const dmg = `${Math.floor(k.damage / 10)} damage`;
      c.strokeText(dmg, p.x, p.y + 17); c.fillText(dmg, p.x, p.y + 17);
    }
    for (const t of this.texts) {
      const age = tick - t.tick, p = screen(t.x, t.y);
      const x = Math.max(80, Math.min(1200, p.x)), y = Math.max(140, Math.min(640, p.y));
      c.globalAlpha = Math.max(0, 1 - age / CALLOUT_TICKS);
      c.font = `bold ${reduced ? 64 : Math.round(64 + Math.max(0, 10 - age) * 3)}px Georgia`;
      c.lineWidth = 6; c.strokeStyle = '#1d1712'; c.fillStyle = '#ffe2a0';
      c.strokeText(t.text, x, y); c.fillText(t.text, x, y);
    }
    if (this.goTick >= 0 && tick - this.goTick < 40) {
      const age = tick - this.goTick;
      c.globalAlpha = Math.max(0, 1 - age / 40);
      c.font = `bold ${reduced ? 110 : 110 + age}px Georgia`;
      c.lineWidth = 6; c.strokeStyle = '#1d1712'; c.fillStyle = '#ffe5ad';
      c.strokeText('GO!', 640, 360); c.fillText('GO!', 640, 360);
    }
    c.restore();
  }
}
