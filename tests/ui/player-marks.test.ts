import test from 'node:test';
import assert from 'node:assert/strict';
import { playerShape, playerGlyph, PLAYER_COLORS, drawPlayerMark } from '../../apps/game/src/render/player-marks.ts';

test('the four local players each get a different shape and glyph', () => {
  const shapes = [1, 2, 3, 4].map(playerShape), glyphs = [1, 2, 3, 4].map(playerGlyph);
  assert.equal(new Set(shapes).size, 4);
  assert.equal(new Set(glyphs).size, 4);
  assert.equal(playerShape(5), playerShape(1));
});

test('player colours also differ in lightness, not only hue', () => {
  const lum = (hex: string) => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const values = PLAYER_COLORS.map(lum).sort();
  for (let i = 1; i < values.length; i++) assert.ok(values[i] - values[i - 1] > 0.02);
});

test('every shape draws a closed, filled and outlined path', () => {
  for (const id of [1, 2, 3, 4]) {
    const calls: string[] = [];
    const c: any = new Proxy({}, { get: (_t, k) => (k === 'save' || k === 'restore' || typeof k !== 'string') ? () => {} : (...a: unknown[]) => { calls.push(String(k)); } , set: () => true });
    drawPlayerMark(c, id, 10, 10);
    assert.ok(calls.includes('fill') && calls.includes('stroke'), `player ${id}`);
  }
});
