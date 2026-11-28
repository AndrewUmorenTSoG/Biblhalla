import type { SimState } from '../../../../packages/sim/src/types.ts';
import { hazardBox } from '../../../../packages/sim/src/boss.ts';
import { Q } from '../../../../packages/sim/src/fixed.ts';

export function drawMosesBackdrop(
  c: CanvasRenderingContext2D,
  images: Record<string, HTMLImageElement>,
  s: SimState,
  reduced: boolean,
) {
  const part = s.options.mosesPart!;
  const image = images[part === 4 ? 'moses-throne' : 'moses-arenas'];
  c.fillStyle = '#192a33';
  c.fillRect(0, 0, 1280, 720);
  if (image?.complete && image.naturalWidth) {
    if (part === 4) c.drawImage(image, 0, 0, 1280, 720);
    else {
      const cw = image.naturalWidth / 2,
        ch = image.naturalHeight / 3;
      const cropW = ((ch - 4) * 1280) / 720;
      c.drawImage(
        image,
        (part % 2) * cw + (cw - cropW) / 2,
        Math.floor(part / 2) * ch + 2,
        cropW,
        ch - 4,
        0,
        0,
        1280,
        720,
      );
    }
  }
  // Repaint narrow strips of the painted royal banners with a tiny fabric sway.
  if (part === 4 && !reduced && image?.complete && image.naturalWidth) {
    for (const u of [0.383, 0.555]) {
      c.save();
      c.translate(u * 1280, 0);
      c.transform(1, 0, Math.sin(s.tick / 95 + u) * 0.006, 1, 0, 0);
      c.drawImage(
        image,
        u * image.naturalWidth,
        0,
        0.062 * image.naturalWidth,
        0.31 * image.naturalHeight,
        0,
        0,
        0.062 * 1280,
        0.31 * 720,
      );
      c.restore();
    }
  }
  c.fillStyle = 'rgba(7,20,30,.24)';
  c.fillRect(0, 0, 1280, 720);
  const t = reduced ? 0 : s.tick / 60;
  if (part >= 3) {
    // Quiet environmental movement stays behind the fighting silhouettes.
    for (const x of part === 4 ? [128, 1152] : [155, 1125]) {
      c.save();
      c.translate(x, part === 4 ? 299 : 390);
      const glow = c.createRadialGradient(0, 0, 1, 0, 0, 65);
      glow.addColorStop(0, 'rgba(255,200,95,' + (reduced ? 0.12 : 0.12 + 0.04 * Math.sin(t * 7 + x)) + ')');
      glow.addColorStop(1, 'rgba(255,200,95,0)');
      c.fillStyle = glow;
      c.fillRect(-65, -65, 130, 130);
      c.restore();
    }
    for (const x of part === 4 ? [] : [345, 930]) {
      c.fillStyle = '#5d2839';
      c.strokeStyle = '#c3a055';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, 80);
      c.lineTo(x + 30, 80);
      c.quadraticCurveTo(x + 35 + Math.sin(t) * 3, 140, x + 27, 207);
      c.lineTo(x + 15, 197);
      c.lineTo(x + 2, 208);
      c.quadraticCurveTo(x + Math.sin(t + 1) * 3, 145, x, 80);
      c.fill();
      c.stroke();
    }
  }
  if (part === 4) {
    const pharaoh = images['moses-pharaoh-sprites'];
    if (pharaoh?.complete && pharaoh.naturalWidth) {
      const left = s.fighters.filter(f => !f.human && f.stocks > 0).length;
      const frame = left < 3 ? 3 : reduced ? 0 : [0, 0, 1, 0, 2, 0][Math.floor(t / 4) % 6];
      c.drawImage(
        pharaoh,
        (frame * pharaoh.naturalWidth) / 4,
        0,
        pharaoh.naturalWidth / 4,
        pharaoh.naturalHeight,
        567,
        176,
        146,
        194,
      );
    }
  }
}
export function drawMosesPlatform(c: CanvasRenderingContext2D, rect: readonly number[], solid: boolean) {
  const [x, y, w, h] = rect;
  c.save();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#343c42');
  g.addColorStop(1, solid ? '#8d7758' : '#c39951');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.fillStyle = '#e7c47f';
  c.fillRect(x, y + h - 4, w, 4);
  c.strokeStyle = '#1a2831';
  c.lineWidth = 2;
  c.strokeRect(x, y, w, h);
  c.strokeStyle = '#15212a80';
  c.lineWidth = 1;
  for (let row = 0; row < (solid ? 3 : 1); row++) {
    const yy = y + (row * h) / 3;
    c.beginPath();
    c.moveTo(x, yy);
    c.lineTo(x + w, yy);
    c.stroke();
    for (let i = (row % 2) * 42; i < w; i += 84) {
      c.beginPath();
      c.moveTo(x + i, yy);
      c.lineTo(x + i, Math.min(y + h - 6, yy + h / 3));
      c.stroke();
    }
  }
  c.fillStyle = '#fff1ba55';
  c.fillRect(x + 4, y + h - 7, w - 8, 1);
  c.restore();
}
/** Spell art is clipped to the actual hazard; tells never expose collision rectangles. */
export function drawMosesSpells(c: CanvasRenderingContext2D, s: SimState, reduced: boolean) {
  if (s.options.mosesPart !== 4) return;
  for (const f of s.fighters) {
    if (!f.skin?.startsWith('mage-') || !f.stocks || f.respawn || f.stun || f.hitstop) continue;
    const run = f.partner?.run ?? s.bossRun,
      script = f.partner?.script ?? s.bossScript;
    if (!run || !script || run.stage === 'gap') continue;
    const moves = script.phases[run.phase - 1],
      move = moves[run.index % moves.length];
    if (!move.element) continue;
    const box = hazardBox(s, move, run.lockX, 0, run.originX, f).map(n => n / Q);
    const [x, y, w, h] = box,
      t = reduced ? 0 : s.tick / 60,
      active = run.stage === 'active',
      fade = run.stage === 'recovery' ? Math.min(1, run.ticks / move.recovery) * 0.25 : active ? 1 : 0.42;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.globalAlpha = fade;
    const colors =
      move.element === 'fire'
        ? ['#e67825', '#ffd27a', '#fff0c0']
        : move.element === 'shadow'
          ? ['#635594', '#c59ced', '#ece0ff']
          : ['#4b9ecc', '#a7e3ff', '#f4fcff'];
    if (!active) {
      c.strokeStyle = colors[1];
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x + w / 2, y + 4, w * 0.43, 4, 0, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 7; i++) {
        c.fillStyle = colors[i % 3];
        c.beginPath();
        c.arc(x + 12 + (i * (w - 24)) / 6, y + 6 + ((i * 7 + t * 18) % 24), 1.5, 0, Math.PI * 2);
        c.fill();
      }
    } else if (move.element === 'lightning') {
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = colors[k];
        c.lineWidth = 7 - k * 2.5;
        c.beginPath();
        for (let j = 0; j < 10; j++) {
          const px = x + w / 2 + Math.sin(j * 8 + Math.floor(t * 18)) * w * 0.34,
            py = y + (j * h) / 9;
          if (j) c.lineTo(px, py);
          else c.moveTo(px, py);
        }
        c.stroke();
      }
    } else if (move.element === 'fire') {
      for (let i = 0; i < 7; i++) {
        const px = x + ((i + 0.5) * w) / 7,
          tip = h * (0.6 + 0.3 * Math.sin(t * 12 + i) ** 2);
        c.fillStyle = colors[i % 3];
        c.beginPath();
        c.moveTo(px - w / 7, y);
        c.quadraticCurveTo(px - 18, y + tip * 0.5, px + Math.sin(t * 9 + i) * 8, y + tip);
        c.quadraticCurveTo(px + 25, y + tip * 0.35, px + w / 7, y);
        c.fill();
      }
    } else {
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = colors[i % 3];
        c.lineWidth = 6 - i * 0.6;
        c.beginPath();
        const cy = y + (h * (i + 0.5)) / 6;
        c.ellipse(x + w / 2 + Math.sin(t * 6 + i) * 8, cy, w * 0.32, h / 8, t * 0.5 + i, 0, Math.PI * 1.65);
        c.stroke();
      }
    }
    c.restore();
  }
}
