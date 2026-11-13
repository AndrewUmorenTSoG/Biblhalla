import type { SimState } from '../../../../packages/sim/src/index.ts';

const lifetime = 24;
const maxIndicators = 40;

export class HitIndicators {
  private world: Pick<SimState, 'tick' | 'events'> | null = null;
  private lastEvent = 0;
  private hits: { tick: number; x: number; y: number; damage: number }[] = [];

  collect(world: Pick<SimState, 'tick' | 'events'>): void {
    if (this.world !== world) {
      this.world = world;
      this.lastEvent = 0;
      this.hits.length = 0;
    }
    for (const e of world.events) {
      if (e.id <= this.lastEvent) continue;
      this.lastEvent = e.id;
      if (e.type === 'hit') {
        this.hits.push({ tick: e.tick, x: Number(e.x), y: Number(e.y), damage: Math.floor(Number(e.damage) / 10) });
      }
    }
    while (this.hits.length && (this.hits.length > maxIndicators || world.tick - this.hits[0].tick >= lifetime)) {
      this.hits.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D, screen: (x: number, y: number) => { x: number; y: number }, tick: number, reduced: boolean): void {
    if (!this.hits.length) return;
    ctx.save();
    ctx.strokeStyle = '#ffe9aa';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#fff4d0';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Georgia';
    for (const hit of this.hits) {
      const pos = screen(hit.x, hit.y);
      const age = tick - hit.tick + 1;
      ctx.globalAlpha = 1 - age / (lifetime + 1);
      if (!reduced) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, age * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillText('+' + hit.damage, pos.x, pos.y - 10 - (reduced ? 0 : age * 2));
    }
    ctx.restore();
  }
}
