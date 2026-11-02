import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { compileContent, validateContent, ContentError, canonicalJson, EXPECTED } from '../../packages/content/src/index.ts';
import type { Content } from '../../packages/content/src/index.ts';
import { DATA_DIR, loadContent, loadRawContent, sha256 } from '../../tools/lib/content.ts';

const fresh = (): Content => structuredClone(loadContent());

function rejects(mutate: (c: Content) => void, pattern: RegExp): void {
  const c = fresh();
  mutate(c);
  assert.throws(() => validateContent(c), (err: unknown) => err instanceof ContentError && pattern.test(err.message));
}

test('canonical pack compiles with the full launch scope', () => {
  const c = loadContent();
  assert.equal(c.productName, 'Biblhalla');
  assert.equal(c.campaign.title, 'Biblhalla — The Story Archive');
  assert.equal(c.fighters.fighters.length, EXPECTED.fighters);
  assert.equal(c.attacks.attacks.length, EXPECTED.attacks);
  assert.equal(c.maps.maps.length, EXPECTED.arenas);
  assert.equal(c.campaign.levels.length, EXPECTED.levels);
  assert.match(c.hash, /^[0-9a-f]{16}$/);
});

test('content hash is independent of JSON key order and changes with data', () => {
  const raw = loadRawContent();
  const a = compileContent(raw, sha256).hash;
  const reverseKeys = (v: any): any => Array.isArray(v) ? v.map(reverseKeys)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map(k => [k, reverseKeys(v[k])])) : v;
  const reordered = reverseKeys(raw);
  assert.equal(compileContent(reordered, sha256).hash, a);
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }), canonicalJson({ a: [2, { c: 4, d: 3 }], b: 1 }));
  const changed = structuredClone(raw);
  changed.attacks.attacks[0].damageTenths += 1;
  assert.notEqual(compileContent(changed, sha256).hash, a);
});

test('corrupt content fails clearly before any match starts', () => {
  rejects(c => { c.attacks.attacks.pop(); }, /expected 172 attacks/);
  rejects(c => { c.attacks.attacks[0].totalTicks += 1; }, /totalTicks/);
  rejects(c => { c.attacks.attacks[0].collisionPhases[0].rectUnits[2] = 0; }, /zero or negative hit shape/);
  rejects(c => { c.attacks.attacks[0].input.direction = 'up' as any; }, /unsupported direction/);
  rejects(c => { c.attacks.attacks[0].baseForceQ = 1.5; }, /not a safe integer/);
  rejects(c => { c.fighters.fighters[0].signatureIds.push('missing_move'); }, /unknown signature/);
  rejects(c => { c.maps.maps[0].spawnFeetUnits.pop(); }, /four spawn points/);
  rejects(c => { c.campaign.levels[80].combatEnabled = true; }, /finale levels must be noncombat/);
  rejects(c => { c.campaign.levels[3].requiresNetwork = true; }, /must not require network/);
  rejects(c => { c.rules.requiresNetwork = true; }, /offline-only/);
  rejects(c => { (c as any).physics = undefined; }, /missing physics/);
});

test('sacred figures can never become fighters or bosses', () => {
  rejects(c => { c.fighters.fighters[0].name = 'Jesus'; }, /never playable/);
  rejects(c => { c.campaign.levels.find(l => l.boss)!.boss!.name = 'God'; }, /never bosses/);
});

test('missing or malformed data files are reported by path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'biblhalla-content-'));
  try {
    for (const name of ['fighters', 'weapons', 'attacks', 'maps', 'physics', 'rules']) {
      writeFileSync(join(dir, `${name}.json`), readFileSync(join(DATA_DIR, `${name}.json`)));
    }
    assert.throws(() => loadRawContent(dir), /missing data file .*campaign\.json/);
    writeFileSync(join(dir, 'campaign.json'), '{ not json');
    assert.throws(() => loadRawContent(dir), /campaign\.json is not valid JSON/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
