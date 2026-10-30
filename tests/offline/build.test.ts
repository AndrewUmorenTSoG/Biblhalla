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

test('only cleaned runtime art ships; raw concept sheets never do', async () => {
  const { SHIPPABLE_READINESS } = await import('../../tools/build.ts');
  for (const readiness of Object.values(manifest.runtimeArt as Record<string, string>)) assert.ok(SHIPPABLE_READINESS.includes(readiness));
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = 'production-pack/10_Generated_Artwork/Characters';
  for (const sheet of readdirSync(dir)) {
    const head = readFileSync(`${dir}/${sheet}`).subarray(0, 600).toString('base64').slice(0, 400);
    assert.ok(!html.includes(head), `${sheet} must not be embedded`);
  }
});

test('every inline script parses', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 2);
  for (const source of scripts) new vm.Script(source);
});

test('build output is reproducible', () => {
  assert.equal(build().html, html);
});
