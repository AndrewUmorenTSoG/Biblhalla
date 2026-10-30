// Content validation. Pure functions: no Node, DOM or clock access, so the same
// checks run in the build tool, the tests, and at game startup.

import type { Attack, Content } from './types.ts';

export const EXPECTED = {
  fighters: 12,
  arenas: 6,
  attacks: 147,
  sharedAttacks: 75,
  signatureAttacks: 72,
  weaponFamilies: 8,
  levels: 84,
  chapters: 14,
  witnessFinaleFrom: 79,
} as const;

const SACRED_NAMES = /\b(jesus|god|holy spirit|lord|christ)\b/i;
const DIRECTIONS = ['neutral', 'side', 'down'] as const;
const SIG_SUFFIX = { neutral: 'nsig', side: 'ssig', down: 'dsig' } as const;
const WEAPON_SLOTS = ['nlight', 'slight', 'dlight', 'nair', 'sair', 'dair', 'recovery', 'ground_pound'];

export class ContentError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(`Biblhalla content failed validation (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n- ` + problems.slice(0, 40).join('\n- '));
    this.name = 'ContentError';
    this.problems = problems;
  }
}

function isSafeInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n);
}

/** Every number anywhere in the content must be a finite safe integer (Q8 contract). */
function checkIntegers(value: unknown, path: string, problems: string[]): void {
  if (typeof value === 'number') {
    if (!isSafeInt(value)) problems.push(`${path}: ${value} is not a safe integer`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => checkIntegers(v, `${path}[${i}]`, problems));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) checkIntegers(v, `${path}.${k}`, problems);
  }
}

function checkAttack(m: Attack, angles: Set<string>, problems: string[]): void {
  const at = `attack ${m.id}`;
  if (!m.id) problems.push('attack with missing id');
  if (m.startup < 1 || m.active < 1 || m.recovery < 0) problems.push(`${at}: invalid frame windows`);
  if (m.totalTicks !== m.startup + m.active + m.recovery) problems.push(`${at}: totalTicks ${m.totalTicks} != startup+active+recovery`);
  if (!DIRECTIONS.includes(m.input?.direction)) problems.push(`${at}: unsupported direction ${m.input?.direction}`);
  if (m.input?.button !== 'light' && m.input?.button !== 'heavy') problems.push(`${at}: unsupported button`);
  if (!angles.has(String(m.launchAngle))) problems.push(`${at}: launchAngle ${m.launchAngle} missing from directionLookup`);
  if (m.damageTenths <= 0 || m.hitstunTicks < 0 || m.baseForceQ < 0) problems.push(`${at}: invalid damage/stun/force`);
  if (m.delivery === 'melee' && m.collisionPhases.length === 0) problems.push(`${at}: melee attack has no collision phase`);
  if (m.delivery === 'projectile' && !m.projectile) problems.push(`${at}: projectile attack has no projectile`);
  for (const p of m.collisionPhases) {
    if (p.firstTick < 0 || p.lastTickExclusive <= p.firstTick || p.lastTickExclusive > m.totalTicks) problems.push(`${at}: collision phase timing out of range`);
    if (p.rectUnits.length !== 4 || p.rectUnits[2] <= 0 || p.rectUnits[3] <= 0) problems.push(`${at}: zero or negative hit shape`);
  }
  const pr = m.projectile;
  if (pr) {
    if (pr.spawnTick < 0 || pr.spawnTick >= m.totalTicks) problems.push(`${at}: projectile spawn outside action`);
    if (pr.lifetimeTicks <= 0 || pr.speedQ <= 0) problems.push(`${at}: projectile has no lifetime or speed`);
    if (pr.collisionUnits[0] <= 0 || pr.collisionUnits[1] <= 0) problems.push(`${at}: projectile has zero size`);
    if (!angles.has(String(pr.travelAngle))) problems.push(`${at}: travelAngle ${pr.travelAngle} missing from directionLookup`);
    if (pr.homing) problems.push(`${at}: homing projectiles are not supported`);
  }
  if (m.chargeable && m.chargeMaxTicks <= 0) problems.push(`${at}: chargeable without charge window`);
  if (m.invulnerability) problems.push(`${at}: attack-granted invulnerability is not allowed`);
}

/** Validate compiled content. Returns nothing; throws ContentError listing every problem. */
export function validateContent(c: Content): void {
  const problems: string[] = [];
  const need = (cond: unknown, msg: string) => { if (!cond) problems.push(msg); };

  need(c && typeof c === 'object', 'content is missing');
  if (!c || typeof c !== 'object') throw new ContentError(problems);
  for (const key of ['fighters', 'weapons', 'attacks', 'maps', 'physics', 'rules', 'campaign'] as const) need(c[key], `missing ${key} data`);
  if (problems.length) throw new ContentError(problems);

  checkIntegers({ physics: c.physics, rules: c.rules, maps: c.maps, attacks: c.attacks }, 'content', problems);

  const attacks = c.attacks.attacks ?? [];
  const fighters = c.fighters.fighters ?? [];
  const weapons = c.weapons.weapons ?? [];
  const maps = c.maps.maps ?? [];
  const levels = c.campaign.levels ?? [];
  const chapters = c.campaign.chapters ?? [];
  const angles = new Set(Object.keys(c.physics.directionLookup ?? {}));

  need(attacks.length === EXPECTED.attacks, `expected ${EXPECTED.attacks} attacks, found ${attacks.length}`);
  need(fighters.length === EXPECTED.fighters, `expected ${EXPECTED.fighters} fighters, found ${fighters.length}`);
  need(maps.length === EXPECTED.arenas, `expected ${EXPECTED.arenas} arenas, found ${maps.length}`);
  need(levels.length === EXPECTED.levels, `expected ${EXPECTED.levels} levels, found ${levels.length}`);
  need(chapters.length === EXPECTED.chapters, `expected ${EXPECTED.chapters} chapters, found ${chapters.length}`);

  const ids = new Map<string, Attack>();
  for (const m of attacks) {
    if (ids.has(m.id)) problems.push(`duplicate attack id ${m.id}`);
    ids.set(m.id, m);
    checkAttack(m, angles, problems);
  }
  need(attacks.filter(m => m.ownerType === 'fighter').length === EXPECTED.signatureAttacks, 'expected 72 fighter signatures');
  need(attacks.filter(m => m.ownerType === 'weapon').length === EXPECTED.sharedAttacks, 'expected 75 shared/unarmed attacks');

  // Weapon grammar: every family has the eight base slots; unarmed also has three grounded heavies.
  const families = weapons.filter(w => w.id !== 'unarmed');
  need(families.length === EXPECTED.weaponFamilies, `expected ${EXPECTED.weaponFamilies} weapon families`);
  for (const w of weapons) {
    for (const slot of WEAPON_SLOTS) need(ids.has(`${w.id}_${slot}`), `weapon ${w.id} missing ${w.id}_${slot}`);
    for (const id of w.attackIds) need(ids.has(id), `weapon ${w.id} references unknown attack ${id}`);
  }
  for (const d of DIRECTIONS) need(ids.has(`unarmed_${SIG_SUFFIX[d]}`), `unarmed kit missing unarmed_${SIG_SUFFIX[d]}`);

  const weaponIds = new Set(weapons.map(w => w.id));
  const fighterIds = new Set<string>();
  for (const f of fighters) {
    need(!fighterIds.has(f.id), `duplicate fighter ${f.id}`);
    fighterIds.add(f.id);
    need(!SACRED_NAMES.test(f.name), `fighter ${f.id}: sacred figures are never playable`);
    need(f.weaponPair?.length === 2 && f.weaponPair[0] !== f.weaponPair[1], `fighter ${f.id}: needs two distinct weapons`);
    for (const w of f.weaponPair ?? []) {
      need(weaponIds.has(w), `fighter ${f.id}: unknown weapon ${w}`);
      for (const d of DIRECTIONS) need(ids.has(`${f.id}_${w}_${SIG_SUFFIX[d]}`), `fighter ${f.id}: missing signature ${f.id}_${w}_${SIG_SUFFIX[d]}`);
    }
    for (const id of f.signatureIds ?? []) need(ids.has(id), `fighter ${f.id}: unknown signature ${id}`);
    for (const k of ['power', 'guard', 'speed'] as const) need(isSafeInt(f.stats?.[k]) && f.stats[k] >= 1 && f.stats[k] <= 10, `fighter ${f.id}: stat ${k} out of range`);
  }

  for (const m of maps) {
    const at = `map ${m.id}`;
    for (const p of [m.main, ...m.platforms]) need(p && p.rectUnits?.length === 4 && p.rectUnits[2] > 0 && p.rectUnits[3] > 0, `${at}: invalid platform ${p?.id}`);
    need(m.main?.kind === 'solid', `${at}: main stage must be solid`);
    need(m.spawnFeetUnits?.length === 4, `${at}: needs four spawn points`);
    need(m.pickupSpawnUnits?.length >= 1, `${at}: needs pickup spawns`);
    const b = m.blastBoundsUnits;
    need(b && b.minX < b.maxX && b.minY < b.maxY, `${at}: invalid blast bounds`);
    for (const [x, y] of m.spawnFeetUnits ?? []) need(b && x > b.minX && x < b.maxX && y > b.minY && y < b.maxY, `${at}: spawn outside blast bounds`);
  }

  // Campaign: a single sequential chain, offline, finale noncombat.
  const levelIds = new Set(levels.map(l => l.id));
  levels.forEach((l, i) => {
    const at = `level ${l.id}`;
    need(l.number === i + 1, `${at}: out of order`);
    need(l.requiresNetwork === false, `${at}: must not require network`);
    need(l.previousLevel === (i ? levels[i - 1].id : null), `${at}: previousLevel breaks the chain`);
    need(l.nextLevel === (i < levels.length - 1 ? levels[i + 1].id : null), `${at}: nextLevel breaks the chain`);
    need(!l.unlockAfter || levelIds.has(l.unlockAfter), `${at}: unknown unlockAfter`);
    if (l.number >= EXPECTED.witnessFinaleFrom) need(!l.combatEnabled, `${at}: finale levels must be noncombat witness scenes`);
    if (l.boss) need(!SACRED_NAMES.test(l.boss.name), `${at}: sacred figures are never bosses`);
    for (const wave of l.waves) need(Array.isArray(wave) && wave.length > 0 && wave.length <= 8, `${at}: invalid wave`);
  });
  for (const ch of chapters) for (const id of ch.levels) need(levelIds.has(id), `chapter ${ch.id}: unknown level ${id}`);
  const scripts = c.campaign.scripts ?? [];
  need(scripts.length === levels.length, `expected ${levels.length} level scripts, found ${scripts.length}`);
  scripts.forEach((sc, i) => {
    const l = levels[i];
    if (!l) return;
    need(sc.id === l.id, `level script ${i + 1} is ${sc.id}, expected ${l.id}`);
    need(!!sc.opening?.text && !!sc.closing?.text, `${sc.id}: missing companion lines`);
    need(sc.waveEntries.length === l.waves.length, `${sc.id}: ${sc.waveEntries.length} wave entries for ${l.waves.length} waves`);
  });

  need(c.rules.offlineOnly === true && c.rules.requiresNetwork === false && c.rules.requiresAccount === false, 'rules must be offline-only with no account');
  for (const d of ['easy', 'hard', 'extreme'] as const) need(c.rules.difficulty?.[d], `rules missing difficulty ${d}`);

  if (problems.length) throw new ContentError(problems);
}
