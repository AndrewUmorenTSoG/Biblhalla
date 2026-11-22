// Painted original-roster-style cels; no procedural substitute characters.
import type { BossMove, BossRun, Fighter } from '../../../../packages/sim/src/types.ts';
export type Rival = 'kedar' | 'tiras';
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
    return rivalFrame(run.stage, 1 - (run.ticks - (time % 1)) / duration, move.frame ?? 0);
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
