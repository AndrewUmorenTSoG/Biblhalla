import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build, FORBIDDEN_RUNTIME } from '../../tools/build.ts';
import { content } from '../helpers/engine.ts';

const { html, manifest } = build();

test('standalone page embeds everything and makes no network requests', () => {
  for (const pattern of FORBIDDEN_RUNTIME) assert.doesNotMatch(html, pattern);
  assert.match(html, /Content-Security-Policy[^>]+connect-src 'none'/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  assert.equal(manifest.offline, true);
});

test('embedded content is the validated canonical content', () => {
  assert.equal(manifest.contentHash, content.hash);
  assert.ok(html.includes(`"hash":"${content.hash}"`));
  assert.equal(manifest.attacks, 147);
  assert.equal(manifest.levels, 84);
});

test('concept sheets are never embedded as runtime art', () => {
  assert.deepEqual(manifest.runtimeArt, []);
  assert.doesNotMatch(html, /data:image\/png;base64/);
});

test('every inline script parses', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 2);
  for (const source of scripts) new vm.Script(source);
});

test('build output is reproducible', () => {
  assert.equal(build().html, html);
});
