// Elemental effects: fire, water, wind, rock and light drawn around elemental attacks,
// heavy-attack charge glows, elemental projectiles and the wind behind thrown weapons.
// Drawing only; the simulation decides when each effect happens.

import type { SimState, Fighter, Projectile } from '../../../../packages/sim/src/types.ts';
import { drawFlyingWeapon } from './weapons.ts';
import { drawCalebRocks, drawNehemiahRubble } from './goliath-impact.ts';
type Screen = (x: number, y: number) => { x: number; y: number };

export function flame(c: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#ff6b28bb';
  c.beginPath();
  c.moveTo(-size, 0);
  c.quadraticCurveTo(-size, -size, size * 0.15, -size * 2.4);
  c.quadraticCurveTo(size * 0.2, -size, size, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffe58b';
  c.beginPath();
  c.ellipse(0, -size * 0.3, size * 0.45, size * 0.8, Math.sin(time * 0.2) * 0.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Follow the contact front, then carry the spent whitewater through recovery. */
export function drawBreakingTide(
  c: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  phases: readonly { rectUnits: readonly number[] }[],
  age: number,
) {
  const last = phases.length - 1;
  if (last < 0 || age <= -6 || age >= last + 13 || !sheet.naturalWidth) return;
  const phase = Math.max(0, Math.min(last, age));
  const index = Math.floor(phase);
  const current = phases[index].rectUnits,
    next = phases[Math.min(last, index + 1)].rectUnits;
  const fraction = phase - index;
  const rise = Math.min(1, (age + 6) / 6);
  const wash = Math.max(0, (age - last) / 13);
  const lead = (current[0] + current[2] + (next[0] - current[0]) * fraction) * rise + 18 * wash;
  const height = (current[3] + (next[3] - current[3]) * fraction) * rise * (1 - wash * 0.9);
  const width = (current[2] * 1.35 + phase * 3) * rise + 16 * wash;
  // The rising and plunging cels share a planted baseline and leading edge.
  const cel =
    age < 0
      ? 0
      : age < last * 0.52
        ? age / (last * 0.52)
        : phase < last
          ? 1 + (age - last * 0.52) / (last * 0.48)
          : 2 + Math.min(1, wash * 2);
  const first = Math.floor(cel),
    mix = cel - first;
  const cellWidth = sheet.naturalWidth / 4;
  c.save();
  c.globalAlpha *= rise * (1 - wash * wash);
  const opacity = c.globalAlpha;
  const paint = (frame: number, weight: number) => {
    c.globalAlpha = opacity * weight;
    c.drawImage(sheet, frame * cellWidth, 0, cellWidth, sheet.naturalHeight, lead - width, -height, width, height);
  };
  paint(first, 1 - mix);
  if (mix > 0) paint(first + 1, mix);
  c.restore();
}

/** Water wraps the staff's active spin and settles during the follow-through. */
export function drawWaterHurricane(
  c: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  age: number,
  duration: number,
  reduced: boolean,
) {
  if (age < -4 || age >= duration + 9 || !sheet.naturalWidth) return;
  const rise = Math.max(0, Math.min(1, (age + 4) / 6));
  const fall = Math.max(0, (age - duration) / 9);
  const swell = reduced ? 1 : 1 + Math.sin(age * 0.65) * 0.025;
  c.save();
  c.globalAlpha = 0.87 * rise * (1 - fall);
  const width = 186 * swell * (0.8 + 0.2 * rise),
    height = 114 * (0.65 + 0.35 * rise) * (1 - fall * 0.35);
  const frame = reduced ? 0 : Math.floor(Math.max(0, age) / 2) % 8;
  const cell = sheet.naturalWidth / 8;
  c.drawImage(sheet, frame * cell, 0, cell, sheet.naturalHeight, -width / 2, -height, width, height);
  if (!reduced)
    for (let i = 0; i < 7; i++) {
      const angle = age * 0.34 + (i * Math.PI * 2) / 7;
      const x = Math.cos(angle) * width * 0.46,
        y = -height * (0.18 + (0.7 * i) / 7) + Math.sin(angle) * 6;
      c.fillStyle = i % 2 ? '#e8faf4' : '#80d4d8';
      c.beginPath();
      c.ellipse(x, y, 1.5, 2.5, angle, 0, Math.PI * 2);
      c.fill();
    }
  c.restore();
}

/** Short, deterministic effects follow simulation events, never modify hitboxes. */
export function drawElements(
  c: CanvasRenderingContext2D,
  world: SimState,
  screen: Screen,
  zoom: number,
  reduced: boolean,
) {
  for (const e of world.events) {
    if (e.type !== 'element') continue;
    const age = world.tick - e.tick;
    if (age < 0 || age > 22) continue;
    const hero = String(e.hero),
      weapon = String(e.weapon),
      move = String(e.move);
    let kind = String(e.effect ?? '');
    if (hero === 'caleb' && move.endsWith('ground_pound')) kind = 'rock';
    if (hero === 'samson') kind = 'dust';
    if (hero === 'esther' && weapon === 'blades') kind = 'wind';
    if (!['kickSpark', 'water', 'rock', 'dust', 'wind', 'sun', 'sound', 'shieldBounce'].includes(kind)) continue;
    const p = screen(Number(e.x), Number(e.y)),
      t = age / 22;
    c.save();
    c.translate(p.x, p.y);
    c.scale(zoom * Number(e.facing), zoom);
    c.globalAlpha = 1 - t;
    const reach = reduced ? 65 : 35 + t * 110;
    if (kind === 'kickSpark') {
      c.globalAlpha = Math.max(0, 1 - age / 9);
      const count = reduced ? 3 : 6;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count + 0.35,
          r = 3 + age * 1.4;
        c.strokeStyle = i % 2 ? '#ffe4a3' : '#d6f6f3';
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        c.lineTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3));
        c.stroke();
      }
    } else if (kind === 'shieldBounce') {
      c.strokeStyle = '#f4c874';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, -3, reduced ? 28 : 18 + t * 35, 5 + t * 7, 0, Math.PI, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 6; i++) {
        c.fillStyle = '#c8b38b88';
        c.beginPath();
        c.ellipse(
          (i - 2.5) * (reduced ? 7 : 7 + t * 7),
          -5 - (reduced ? 5 : Math.sin(t * Math.PI) * 18),
          5,
          3,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    } else if (kind === 'water') {
      for (const side of [-1, 1]) {
        c.save();
        c.scale(side, 1);
        c.fillStyle = '#168edbcc';
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(reach * 0.4, -10, reach, -48 * (1 - t));
        c.quadraticCurveTo(reach + 16, -12, reach + 25, 0);
        c.closePath();
        c.fill();
        c.strokeStyle = '#c8f8ff';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(15, -5);
        c.quadraticCurveTo(reach * 0.6, -12, reach, -45 * (1 - t));
        c.stroke();
        c.restore();
      }
    } else if (kind === 'rock' && hero === 'caleb') {
      drawCalebRocks(c, age, e.id, reduced, move === 'caleb_gauntlets_dsig');
    } else if (kind === 'rock' && hero === 'nehemiah') {
      drawNehemiahRubble(c, age, e.id, reduced, move === 'nehemiah_hammer_ssig');
    } else if (kind === 'rock' || kind === 'dust') {
      const massive = kind === 'dust';
      for (let i = 0; i < 12; i++) {
        const spread = (i - 5.5) / 5.5;
        const x = massive || hero === 'caleb' ? spread * reach : Math.abs(spread) * reach;
        const y = -Math.sin(Math.PI * t) * (12 + (i % 4) * 8);
        c.fillStyle = massive ? '#c6b48e88' : '#8c7965';
        c.beginPath();
        if (massive) c.ellipse(x, y - 5, 13 + (i % 3) * 5, 8 + (i % 4) * 3, 0, 0, Math.PI * 2);
        else {
          c.moveTo(x - 6, y);
          c.lineTo(x - 9, y - 9);
          c.lineTo(x + 2, y - 16);
          c.lineTo(x + 8, y - 5);
          c.closePath();
        }
        c.fill();
      }
      c.strokeStyle = '#e3d3b6';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, -3, reach, massive ? 17 : 7, 0, Math.PI, 2 * Math.PI);
      c.stroke();
    } else if (kind === 'wind') {
      c.strokeStyle = '#c7ffef';
      c.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        const spin = reduced ? 0 : age * 0.35 + i;
        c.ellipse(20 + t * 35, -12 - i * 16, 25 + i * 7, 7, 0, spin, spin + Math.PI * 1.5);
        c.stroke();
      }
    } else if (kind === 'sun') {
      c.fillStyle = '#fff0a388';
      c.beginPath();
      c.moveTo(-14, -30);
      c.lineTo(-30, -220);
      c.lineTo(30, -220);
      c.lineTo(14, -30);
      c.closePath();
      c.fill();
      c.fillStyle = '#fffbd1';
      c.fillRect(-4, -210, 8, 175);
    } else if (kind === 'sound') {
      c.strokeStyle = '#d7e9ff';
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(reach + i * 14, -42, 10, 25 + i * 7, 0, -Math.PI * 0.45, Math.PI * 0.45);
        c.stroke();
      }
    }
    c.restore();
  }
}

export function drawCharge(
  c: CanvasRenderingContext2D,
  f: Fighter,
  x: number,
  y: number,
  zoom: number,
  tick: number,
  reduced: boolean,
) {
  const charge = f.action?.charge ?? 0;
  if (!charge || f.action?.kind !== 'attack') return;
  const intensity = Math.min(1, charge / 36);
  c.save();
  c.translate(x, y);
  c.scale(zoom, zoom);
  c.strokeStyle = `rgba(255,235,225,${0.25 + intensity * 0.5})`;
  c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const lift = reduced ? 15 : (tick * 1.3 + i * 13) % 55;
    const xx = (i - 2) * 12;
    c.beginPath();
    c.moveTo(xx, -35 - lift);
    c.bezierCurveTo(xx + 9, -48 - lift, xx - 10, -55 - lift, xx + 3, -70 - lift);
    c.stroke();
  }
  c.restore();
}

export function drawElementProjectile(
  c: CanvasRenderingContext2D,
  p: Projectile,
  owner: Fighter | undefined,
  x: number,
  y: number,
  zoom: number,
  tick: number,
  reduced = false,
  standingHeight = 192,
): boolean {
  c.save();
  c.translate(x, y);
  c.scale(zoom * p.facing, zoom);
  let drawn = true;
  if (p.effect === 'shield') {
    if (p.move === 'gideon_shield_dsig' && !reduced) {
      c.save();
      c.rotate(Math.atan2(-p.vy, p.vx * p.facing));
      c.strokeStyle = '#f4c77988';
      c.lineWidth = 2;
      for (const dy of [-7, 0, 7]) {
        c.beginPath();
        c.moveTo(-16, dy);
        c.lineTo(-40, dy);
        c.stroke();
      }
      c.restore();
    }
    const scale = (96 * (owner?.scale ?? 1)) / standingHeight;
    c.scale(scale, scale);
    drawFlyingWeapon(c, 'shield', 0, 0, 0, reduced ? 0 : tick * 0.65);
  } else if (p.effect === 'rock') {
    c.fillStyle = '#91785f';
    c.beginPath();
    c.moveTo(-17, 17);
    c.lineTo(-9, -12);
    c.lineTo(5, -20);
    c.lineTo(19, 12);
    c.closePath();
    c.fill();
  } else if (p.effect === 'sound') {
    c.strokeStyle = '#c6eaff';
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.ellipse(-i * 8, 0, 8, 20 + i * 3, 0, -1.4, 1.4);
      c.stroke();
    }
  } else if (owner?.hero === 'jonathan' && p.move.includes('bow')) {
    c.strokeStyle = '#bd9c6a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-18, 0);
    c.lineTo(12, 0);
    c.stroke();
    flame(c, 13, 0, 7, tick);
  } else if (p.move.includes('sling')) {
    c.fillStyle = '#d6c3a0';
    c.strokeStyle = '#755a47';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 6, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    if (owner?.hero === 'david') flame(c, 0, 0, 9, tick);
  } else drawn = false;
  c.restore();
  return drawn;
}

/** A few quiet wind strokes behind thrown objects show their travel direction. */
export function drawThrowWind(c: CanvasRenderingContext2D, p: Projectile, x: number, y: number, zoom: number) {
  const speed = Math.hypot(p.vx, p.vy);
  if (speed < 1) return;
  const dx = p.vx / speed,
    dy = -p.vy / speed;
  c.save();
  c.strokeStyle = 'rgba(211,239,245,.55)';
  c.lineWidth = Math.max(1, zoom * 1.4);
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 5 * zoom,
      sideX = -dy * offset,
      sideY = dx * offset;
    c.beginPath();
    c.moveTo(x - dx * (13 + i * 6) * zoom + sideX, y - dy * (13 + i * 6) * zoom + sideY);
    c.lineTo(x - dx * (29 + i * 7) * zoom + sideX, y - dy * (29 + i * 7) * zoom + sideY);
    c.stroke();
  }
  c.restore();
}
