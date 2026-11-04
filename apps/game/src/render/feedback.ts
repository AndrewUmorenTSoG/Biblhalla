// Hit feel (presentation only): screen shake scaled by how hard a hit launches,
// a burst where a fighter is knocked out, launch smoke trails, and dust on jumps
// and landings. Reads simulation events and state; never writes to them. Reduced
// motion turns off shake and trails but keeps the KO burst as a static flash.

const Q = 256;

export interface Puff { x: number; y: number; age: number; life: number; size: number; kind: 'smoke' | 'dust' | 'burst' | 'gravity' }

/** Spec limits (13_Audio_VFX): at most 2 CSS px for a light impact, 6 for a heavy one. */
export const LIGHT_SHAKE_MAX = 2;
export const HEAVY_SHAKE_MAX = 6;
/** Launch speed (units per tick) from which a hit counts as heavy for shake. */
export const HEAVY_LAUNCH = 9;

/** Shake in CSS pixels for a hit that leaves the target moving at `speedQ`. */
export function shakeFor(speedQ: number, damageTenths: number): number {
  const speed = speedQ / Q, launch = Math.max(0, speed - 4);
  const raw = launch * 0.45 + damageTenths / 120;
  return Math.min(speed >= HEAVY_LAUNCH ? HEAVY_SHAKE_MAX : LIGHT_SHAKE_MAX, raw);
}

/** A ring-out is the heaviest impact, still within the heavy limit. */
export const KO_SHAKE = HEAVY_SHAKE_MAX;
/** Launch speed (units per tick) above which a stunned fighter leaves smoke. */
export const TRAIL_SPEED = 7;
const MAX_PUFFS = 90;


export class Feedback {
  shake = 0;
  puffs: Puff[] = [];
  private lastEvent = 0;
  private wasGround = new Map<number, boolean>();
  private gravityActions = new Map<number, number>();
  reduced = false;
  /** Separate accessibility switches (17_Performance): shake and bright flashes can be turned off on their own. */
  shakeOn = true;
  /** Particle budget; the quality governor lowers it on slow devices. */
  maxPuffs = MAX_PUFFS;
  flashOn = true;

  reset(): void { this.shake = 0; this.puffs = []; this.lastEvent = 0; this.wasGround.clear(); this.gravityActions.clear(); }

  /** Feed once per painted frame with the newest state. */
  update(world: { tick: number; events: any[]; fighters: any[] }, frameTicks = 1): void {
    // Display time can stall or jump backwards (tab switches, test drivers); never let it amplify.
    frameTicks = Number.isFinite(frameTicks) ? Math.max(0, Math.min(6, frameTicks)) : 0;
    this.shake = this.reduced || !this.shakeOn ? 0 : Math.max(0, this.shake * Math.pow(0.82, frameTicks) - 0.05 * frameTicks);
    if (world.events.length && world.events[world.events.length - 1].id < this.lastEvent) this.lastEvent = 0;
    for (const e of world.events) {
      if (e.id <= this.lastEvent) continue;
      this.lastEvent = e.id;
      const f = world.fighters.find((x: any) => x.id === e.fighter);
      if (e.type === 'hit' && f) this.kick(shakeFor(Math.hypot(f.vx, f.vy), Number(e.damage) || 0));
      if (e.type === 'ko') { this.kick(KO_SHAKE); this.add({ x: e.x, y: e.y, size: 60, life: 30, kind: 'burst' }); }
      if (e.type === 'jump' && f && !this.reduced) this.dust(f.x, f.y, 3);
    }
    for (const f of world.fighters) {
      // A gravity cancel is the one airborne attack marked `cancelled` by the
      // simulation. Spawn once per action, at the point where it happened.
      if (f.action?.kind === 'attack' && f.action.cancelled && !f.ground && this.gravityActions.get(f.id) !== f.action.instance) {
        this.gravityActions.set(f.id, f.action.instance);
        this.add({ x: f.x, y: f.y - 9 * Q, size: 22, life: 18, kind: 'gravity' });
      }
      const was = this.wasGround.get(f.id);
      if (f.ground && was === false && !this.reduced) this.dust(f.x, f.y, 4);
      this.wasGround.set(f.id, !!f.ground);
      if (!this.reduced && f.stun && f.stocks && !f.respawn && Math.hypot(f.vx, f.vy) / Q > TRAIL_SPEED && world.tick % 2 === 0)
        this.add({ x: f.x, y: f.y + 37 * Q, size: 10 + Math.min(14, Math.hypot(f.vx, f.vy) / Q), life: 22, kind: 'smoke' });
    }
    for (const p of this.puffs) p.age += frameTicks;
    this.puffs = this.puffs.filter(p => p.age < p.life);
  }

  /** Screen offset this frame; deterministic per tick so captures are stable. */
  offset(tick: number): { x: number; y: number } {
    if (this.shake < 0.3) return { x: 0, y: 0 };
    return { x: Math.sin(tick * 2.9) * this.shake, y: Math.cos(tick * 3.7) * this.shake * 0.7 };
  }

  private kick(amount: number): void { if (!this.reduced && this.shakeOn) this.shake = Math.max(this.shake, amount); }
  private dust(x: number, y: number, n: number): void {
    for (let k = 0; k < n; k++) this.add({ x: x + (k - (n - 1) / 2) * 9 * Q, y: y + 2 * Q, size: 6 + k % 2 * 3, life: 16, kind: 'dust' });
  }
  private add(p: Omit<Puff, 'age'>): void { this.puffs.push({ ...p, age: 0 }); if (this.puffs.length > this.maxPuffs) this.puffs.splice(0, this.puffs.length - this.maxPuffs); }

  /** Draw puffs; `screen` maps sim Q coordinates to canvas pixels. */
  draw(c: CanvasRenderingContext2D, screen: (x: number, y: number) => { x: number; y: number }, zoom: number): void {
    for (const p of this.puffs) {
      const pos = screen(p.x, p.y), t = p.age / p.life;
      c.save();
      if (p.kind === 'gravity') {
        c.globalAlpha = (1 - t) * 0.7;
        c.fillStyle = '#f4f0e4';
        const spread = (8 + t * 12) * zoom, radius = p.size * (0.55 + t * 0.22) * zoom;
        for (const dx of [-1, 0, 1]) {
          c.beginPath(); c.ellipse(pos.x + dx * spread, pos.y + (dx === 0 ? -3 : 1) * zoom, radius * (dx === 0 ? 1 : 0.8), radius * 0.47, 0, 0, Math.PI * 2); c.fill();
        }
      } else if (p.kind === 'burst') {
        // With flashes off the ring-out mark is a soft, dim ring rather than a bright burst.
        c.globalAlpha = (1 - t) * (this.flashOn ? 0.85 : 0.3);
        const r = (p.size + t * (this.reduced ? 0 : 140)) * zoom;
        const g = c.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
        g.addColorStop(0, '#fff8e0'); g.addColorStop(0.4, '#ffd27a'); g.addColorStop(1, 'rgba(255,170,80,0)');
        c.fillStyle = g; c.beginPath(); c.arc(pos.x, pos.y, r, 0, Math.PI * 2); c.fill();
      } else {
        c.globalAlpha = (1 - t) * (p.kind === 'smoke' ? 0.45 : 0.5);
        c.fillStyle = p.kind === 'smoke' ? '#e8e2d4' : '#cdbb98';
        c.beginPath(); c.arc(pos.x, pos.y - (p.kind === 'dust' ? t * 8 : 0), p.size * (0.6 + t * 0.8) * zoom, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
  }
}

/** Damage colour, white through yellow and orange to deep red, like a fighter's danger level. */
export function damageColor(damageTenths: number): string {
  const d = Math.max(0, damageTenths / 10);
  const stops: [number, number[]][] = [[0, [255, 255, 255]], [50, [255, 236, 140]], [100, [255, 168, 64]], [150, [232, 72, 48]], [220, [140, 20, 28]]];
  for (let k = 1; k < stops.length; k++) {
    const [a, ca] = stops[k - 1], [b, cb] = stops[k];
    if (d <= b) { const t = (d - a) / (b - a); return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(',')})`; }
  }
  return 'rgb(140,20,28)';
}
