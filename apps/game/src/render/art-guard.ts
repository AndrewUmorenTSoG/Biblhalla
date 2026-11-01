// Missing or corrupt art must never stop a match (08_Offline_Runtime_Packaging):
// anything the renderer cannot safely draw is dropped here, and that fighter falls
// back to the drawn rig. Broken images are already skipped at draw time because
// they never report a natural width.

import type { Clip } from './renderer.ts';

export interface Frame { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number }

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function validFrame(f: any): f is Frame {
  return !!f && typeof f === 'object' && finite(f.x) && finite(f.y) && finite(f.pivotX) && finite(f.pivotY)
    && finite(f.w) && finite(f.h) && f.w > 0 && f.h > 0;
}

/** Frames per hero; a hero without a usable idle frame is dropped entirely. */
export function guardAtlas(raw: unknown, problems: string[] = []): Record<string, Record<string, Frame>> {
  const out: Record<string, Record<string, Frame>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [hero, frames] of Object.entries(raw as Record<string, unknown>)) {
    if (!frames || typeof frames !== 'object') { problems.push(`${hero}: atlas entry is not a frame table`); continue; }
    const kept: Record<string, Frame> = {};
    for (const [name, f] of Object.entries(frames as Record<string, unknown>)) {
      if (validFrame(f)) kept[name] = f; else problems.push(`${hero}.${name}: unusable frame`);
    }
    if (!kept.idle) { problems.push(`${hero}: no idle frame, using the drawn fighter`); continue; }
    out[hero] = kept;
  }
  return out;
}

/** Clips whose frames all exist and whose timings are positive whole ticks. */
export function guardClips(raw: unknown, atlas: Record<string, Record<string, Frame>>, problems: string[] = []): Record<string, Record<string, Clip>> {
  const out: Record<string, Record<string, Clip>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [hero, clips] of Object.entries(raw as Record<string, unknown>)) {
    const frames = atlas[hero];
    if (!frames || !clips || typeof clips !== 'object') continue;
    for (const [name, c] of Object.entries(clips as Record<string, any>)) {
      const ok = c && Array.isArray(c.frames) && Array.isArray(c.ticks) && c.frames.length > 0 && c.frames.length === c.ticks.length
        && c.frames.every((f: unknown) => typeof f === 'string' && frames[f]) && c.ticks.every((t: unknown) => Number.isInteger(t) && (t as number) > 0);
      if (!ok) { problems.push(`${hero}.${name}: clip skipped`); continue; }
      (out[hero] ??= {})[name] = { frames: c.frames, ticks: c.ticks, loop: c.loop };
    }
  }
  return out;
}
