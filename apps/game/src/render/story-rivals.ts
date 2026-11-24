// Painted original-roster-style cels; no procedural substitute characters.
import type { BossMove, BossRun, Fighter } from '../../../../packages/sim/src/types.ts';
export type Rival = 'kedar' | 'tiras' | 'mage-fire' | 'mage-shadow' | 'mage-lightning';
export type RivalPose = 'idle' | 'run' | 'air' | 'hurt' | 'tell' | 'active' | 'recovery';
export const RIVAL_FRAME_COUNT = 36;
const COUNTS = { idle: 3, run: 6, air: 6, hurt: 3, tell: 3, active: 1, recovery: 2 };
export function rivalFrame(pose: RivalPose, phase: number, move = 0): number {
  const n = COUNTS[pose];
  const frame = Math.min(n - 1, Math.floor(Math.max(0, Math.min(1, phase)) * n));
  const offset =
    pose === 'idle'
      ? 0
      : pose === 'hurt'
        ? 3
        : pose === 'run'
          ? 6
          : pose === 'air'
            ? 12
            : 18 + Math.max(0, Math.min(2, move)) * 6 + (pose === 'tell' ? 0 : pose === 'active' ? 3 : 4);
  return offset + frame;
}
export function rivalAnimation(f: Fighter, run: BossRun, move: BossMove, time: number, stride: number) {
  if (f.stun || f.hitstop) return rivalFrame('hurt', 1 - Math.min(1, Math.max(f.stun, f.hitstop) / 24));
  if (!f.ground) return rivalFrame('air', Math.max(0, Math.min(1, (1200 - f.vy) / 2400)));
  if (run.stage !== 'gap') {
    const duration = run.stage === 'tell' ? move.tell : run.stage === 'active' ? move.active : move.recovery;
    const progress = Math.max(0, Math.min(1, 1 - (run.ticks - (time % 1)) / duration));
    // Carry the contact drawing into its authored follow-through, then settle.
    // Do not crossfade silhouettes or reverse to a windup during recovery.
    if (run.stage === 'active') return 18 + (move.frame ?? 0) * 6 + (progress < 0.6 ? 3 : 4);
    if (run.stage === 'recovery') return 18 + (move.frame ?? 0) * 6 + (progress < 0.25 ? 4 : 5);
    return rivalFrame(run.stage, progress, move.frame ?? 0);
  }
  if (Math.abs(f.vx) > 100) return rivalFrame('run', ((stride % 1) + 1) % 1);
  return rivalFrame('idle', (((time % 72) + 72) % 72) / 72);
}

export function prepareRival(skin: Rival, images: Record<string, HTMLImageElement>) {
  const sheet = images[skin];
  if (sheet) void sheet.decode().catch(() => {});
  return sheet;
}
export function drawRival(
  c: CanvasRenderingContext2D,
  skin: Rival,
  frame: number,
  images: Record<string, HTMLImageElement>,
) {
  const sheet = images[skin];
  if (!sheet?.complete || !sheet.naturalWidth) return;
  const k = 0.58;
  c.drawImage(sheet, (frame % 6) * 512, Math.floor(frame / 6) * 256, 512, 256, -256 * k, -246 * k, 512 * k, 256 * k);
}
export function rivalPortrait(skin: Rival, images: Record<string, HTMLImageElement>) {
  const canvas = document.createElement('canvas');
  canvas.width = 288;
  canvas.height = 200;
  canvas.setAttribute('aria-hidden', 'true');
  const paint = () => {
    const c = canvas.getContext('2d')!;
    c.clearRect(0, 0, 288, 200);
    c.save();
    c.translate(144, 195);
    c.scale(1.5, 1.5);
    drawRival(c, skin, rivalFrame('idle', 0), images);
    c.restore();
  };
  const sheet = prepareRival(skin, images);
  if (sheet)
    void sheet
      .decode()
      .then(paint)
      .catch(() => {});
  return canvas;
}

/** Brief weapon trails and ground chips; bounded by the strike's reach, never a hitbox overlay. */
export function drawRivalAccent(
  c: CanvasRenderingContext2D,
  skin: Rival,
  run: BossRun,
  move: BossMove,
  scale: number,
  fraction: number,
  reduced: boolean,
) {
  if (run.stage !== 'active' && run.stage !== 'recovery') return;
  const age =
    run.stage === 'active'
      ? Math.max(0, move.active + 1 - run.ticks + fraction)
      : move.active + move.recovery - run.ticks + fraction;
  const fade = Math.max(0, 1 - Math.max(0, age - move.active / 2) / (move.active / 2 + 8));
  if (!fade) return;
  const w = move.width / scale,
    h = move.height / scale;
  c.save();
  c.globalAlpha *= fade * (reduced ? 0.25 : 0.65);
  c.lineCap = 'round';
  if (skin === 'kedar') {
    c.strokeStyle = '#e8d8ae';
    c.lineWidth = 1.8;
    const u = reduced ? 1 : Math.min(1, (age + 2) / 5);
    c.beginPath();
    if (move.frame === 2) {
      c.moveTo(w * 0.25, -h * 0.15);
      c.quadraticCurveTo(w, -h * 0.4, w * 0.7, -h * u);
    } else {
      c.moveTo(w * 0.15, -h * 0.65);
      c.quadraticCurveTo(w * 0.65, -h * 0.2, w * u, -h * 0.55);
    }
    c.stroke();
  } else if (move.frame === 1) {
    c.strokeStyle = '#c4d7d6';
    c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(w * 0.15, -h * (0.3 + i * 0.2));
      c.lineTo(w * 0.65, -h * (0.3 + i * 0.2));
      c.stroke();
    }
  } else if (!reduced) {
    const u = Math.min(1, age / 18);
    for (let i = 0; i < 6; i++) {
      const x = w * (0.25 + i * 0.12),
        y = -Math.sin(Math.PI * u) * Math.min(h * 0.35, 12 + i * 2);
      const r = (2 + (i % 3)) * (1 - u * 0.7);
      c.fillStyle = i % 2 ? '#b2a287' : '#7d725f';
      c.beginPath();
      c.moveTo(x - r, y);
      c.lineTo(x - r * 0.3, y - r * 1.4);
      c.lineTo(x + r, y - r * 0.7);
      c.lineTo(x + r * 0.65, y + r * 0.4);
      c.closePath();
      c.fill();
    }
  }
  c.restore();
}
