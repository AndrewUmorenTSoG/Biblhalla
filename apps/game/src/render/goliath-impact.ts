// Draw in stage units, y up. The collision box provides the floor and the limit
// for the art, including the outer tips of the dust and wind strokes.
import { Q, type SimState } from '../../../../packages/sim/src/index.ts';

import { hazardBox } from '../../../../packages/sim/src/boss.ts';

function noise(seed: number): number {
  let hash = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000;
}

function stone(c: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number, shape: number) {
  c.save();
  c.translate(x, y);
  c.rotate(spin);
  c.scale(size, size);
  const corner = 0.35 + shape * 0.5;
  c.beginPath();
  c.moveTo(-1, -0.25);
  c.lineTo(-0.66, 0.57);
  c.lineTo(0.13, 0.88);
  c.lineTo(corner, 0.35);
  c.lineTo(1, -0.34);
  c.lineTo(0.17, -0.72);
  c.closePath();
  c.fillStyle = '#6c594e';
  c.fill();
  c.strokeStyle = '#443833';
  c.lineWidth = 0.12;
  c.stroke();
  c.beginPath();
  c.moveTo(-1, -0.25);
  c.lineTo(-0.66, 0.57);
  c.lineTo(0.13, 0.88);
  c.lineTo(corner, 0.35);
  c.lineTo(-0.24, 0.16);
  c.closePath();
  c.fillStyle = '#cfb28a';
  c.fill();
  c.beginPath();
  c.moveTo(-0.24, 0.16);
  c.lineTo(corner, 0.35);
  c.lineTo(1, -0.34);
  c.lineTo(0.17, -0.72);
  c.closePath();
  c.fillStyle = '#96795d';
  c.fill();
  c.restore();
}

function debris(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  origin: number,
  age: number,
  life: number,
  seed: number,
  quake: boolean,
  sparse: boolean,
) {
  const count = quake ? Math.min(26, Math.ceil(w / 45)) : 5;
  for (let i = 0; i < count; i += sparse ? 2 : 1) {
    const n = noise(seed + i * 4787),
      v = noise(seed + i * 953 + 13);
    const root = (w * (i + 0.2 + 0.6 * n)) / count;
    const distance = Math.abs(root - origin) / w;
    const t = (age - (quake ? distance * 7 : n * 1.8)) / (life * (0.62 + 0.31 * v));
    if (t < 0 || t >= 1) continue;
    const arc = 4 * t * (1 - t);
    const x = root + (quake ? Math.sign(root - origin) : 1) * t * (6 + 12 * v);
    const y = 1 + arc * (quake ? h * (0.28 + 0.52 * n) : 17 + 24 * n);
    const size = quake ? 7 + 9 * v * v : 6 + 8 * v;
    c.save();
    c.globalAlpha *= Math.min(1, (1 - t) * 5);
    const dust = c.createRadialGradient(root, 2, 0, root, 2, 6 + 8 * t);
    dust.addColorStop(0, 'rgba(193,163,125,.58)');
    dust.addColorStop(1, 'rgba(188,158,123,0)');
    c.fillStyle = dust;
    c.save();
    c.translate(0, 1);
    c.scale(1, 0.52);
    c.beginPath();
    c.arc(root, 2, 6 + 8 * t, 0, 2 * Math.PI);
    c.fill();
    c.restore();
    const rotation = (n - 0.5) * 2 + t * (v - 0.5) * 5;
    const split = Math.max(0, (t - 0.54) / 0.46);
    if (!split) stone(c, x, y, size, rotation, n);
    else {
      // Break at the apex and let each facet spin away and erode into grit.
      for (let j = 0; j < 3; j++) {
        const angle = rotation + (j * Math.PI * 2) / 3;
        const spread = size * (0.32 + 1.5 * split);
        stone(
          c,
          x + Math.cos(angle) * spread,
          y + Math.sin(angle) * spread,
          size * (0.57 - 0.52 * split),
          rotation + split * (j - 1) * 3,
          noise(i * 37 + j),
        );
      }
    }
    if (!sparse) {
      c.fillStyle = '#d4ba94';
      c.beginPath();
      c.ellipse(root + (x - root) * 0.6 - 3, y * 0.67, 1.6, 1, v, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#826c55';
      c.beginPath();
      c.ellipse(x + 4, y * 0.44, 1, 1.7, n, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

function wind(c: CanvasRenderingContext2D, w: number, h: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const travel = Math.max(0, Math.min(1, t * 1.5 - i * 0.18));
    const tip = w * (0.38 + 0.6 * travel);
    const y = h * (0.72 + (i - 1) * 0.11),
      bend = (i - 1) * 9 + 2;
    c.save();
    c.transform(1, -0.33, 0, 1, 0, 0);
    c.globalAlpha *= Math.sin(Math.PI * travel) * 0.85;
    const ink = c.createLinearGradient(0, 0, tip, 0);
    ink.addColorStop(0, 'rgba(179,217,220,0)');
    ink.addColorStop(0.7, '#acced0');
    ink.addColorStop(1, '#f7f4dc');
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(tip - w * 0.64, y - bend);
    c.bezierCurveTo(tip - w * 0.4, y + bend * 1.5, tip - w * 0.15, y - bend, tip, y + 2);
    c.bezierCurveTo(tip - w * 0.13, y - bend - 11, tip - w * 0.39, y + bend, tip - w * 0.64, y - bend);
    c.fill();
    // Broken crescent of compressed air rolling ahead of the shaft.
    c.strokeStyle = '#d2e7e3';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(tip - 8, y + 11);
    c.quadraticCurveTo(tip + 3, y + 3, tip - 2, y - 4);
    c.stroke();
    c.restore();
  }
}

export function goliathImpact(world: SimState, alpha: number) {
  const run = world.bossRun;
  if (!run || (run.stage !== 'active' && run.stage !== 'recovery')) return;
  const moves = world.bossScript?.phases[run.phase - 1];
  const move = moves?.[run.index % moves.length];
  if (!move?.impactEffect) return;
  const quake = move.impactEffect === 'shieldQuake';
  const age = (run.stage === 'active' ? move.active - run.ticks : move.active + move.recovery - run.ticks) + alpha;
  const life = quake ? 28 : move.active + 7;
  if (age < 0 || age >= life) return;
  const boss = world.fighters.find(f => f.guard !== null && !f.partner);
  if (!boss) return;
  const box = hazardBox(world, move, run.lockX, Math.floor(age), run.originX, boss);
  return {
    box,
    quake,
    age,
    life,
    activeTicks: move.active,
    facing: boss.facing,
    originX: run.originX,
    seed: run.instance,
  };
}

export function drawGoliathImpacts(
  c: CanvasRenderingContext2D,
  impact: ReturnType<typeof goliathImpact>,
  reduced: boolean,
  low: boolean,
) {
  if (!impact) return;
  const { box, quake, age, life, facing, originX, seed } = impact;
  const [left, floor, w, h] = box.map(n => n / Q);
  c.save();
  c.translate(left, floor);
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
  if (!quake && facing < 0) {
    c.translate(w, 0);
    c.scale(-1, 1);
  }
  if (!quake && age < impact.activeTicks) wind(c, w, h, (age + 0.5) / (impact.activeTicks + 0.5));
  debris(c, w, h, originX / Q - left, age, life, seed * 217, quake, reduced || low);
  c.restore();
}
