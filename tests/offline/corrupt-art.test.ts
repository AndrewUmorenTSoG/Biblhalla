import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guardAtlas, guardClips } from '../../apps/game/src/render/art-guard.ts';

const idle = { x: 0, y: 0, w: 40, h: 90, pivotX: 20, pivotY: 90 };

test('corrupt atlas entries are dropped, heroes without idle fall back to the drawn rig', () => {
  const problems: string[] = [];
  const atlas = guardAtlas({ david: { idle, light: { x: 'a' }, run: { ...idle, w: 0 } }, saul: { light: idle }, samson: 'nonsense', moses: null }, problems);
  assert.deepEqual(Object.keys(atlas), ['david']);
  assert.deepEqual(Object.keys(atlas.david), ['idle']);
  assert.ok(problems.length >= 4);
  assert.deepEqual(guardAtlas(undefined), {});
  assert.deepEqual(guardAtlas('garbage'), {});
});

test('clips pointing at missing frames or bad timings are skipped', () => {
  const atlas = guardAtlas({ david: { idle, run1: idle } });
  const clips = guardClips({ david: {
    run: { frames: ['idle', 'run1'], ticks: [4, 4] },
    jump: { frames: ['gone'], ticks: [4] },
    dodge: { frames: ['idle'], ticks: [0] },
    hitstun: { frames: ['idle', 'run1'], ticks: [4] },
    light: { frames: 'idle' },
  }, saul: { run: { frames: ['idle'], ticks: [4] } } }, atlas);
  assert.deepEqual(Object.keys(clips), ['david']);
  assert.deepEqual(Object.keys(clips.david), ['run']);
});

test('the shipped fighter atlas survives the guard intact', () => {
  const raw = JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json', import.meta.url), 'utf8'));
  // Same mapping as tools/build.ts runtimeArt().
  const atlas: Record<string, unknown> = {}, clips: Record<string, unknown> = {};
  for (const [id, entry] of Object.entries(raw as Record<string, any>)) { atlas[id] = entry.frames; if (entry.clips) clips[id] = entry.clips; }
  const problems: string[] = [];
  const kept = guardAtlas(atlas, problems);
  const keptClips = guardClips(clips, kept, problems);
  assert.equal(problems.length, 0, problems.slice(0, 5).join('; '));
  assert.equal(Object.keys(kept).length, Object.keys(atlas).length);
  assert.ok(Object.keys(keptClips).length > 0);
});
