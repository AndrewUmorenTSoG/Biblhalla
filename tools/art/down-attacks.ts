// Generate the down-attack drawing brief for the art team (Codex):
// every fighter's downward attacks, armed with each weapon and unarmed, with the
// exact timing each animation must match. Writes docs/art/DOWN_ATTACKS.md.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent } from '../lib/content.ts';
import type { Attack } from '../../packages/content/src/index.ts';

const KINDS: [string, string][] = [
  ['dlight', 'Ground down light (Down + Light on the ground)'],
  ['dair', 'Air down light (Down + Light in the air)'],
  ['ground_pound', 'Ground pound (Down + Heavy in the air)'],
  ['dsig', 'Down signature (Down + Heavy on the ground)'],
];

export function downAttackBrief(): string {
  const content = loadContent();
  const moves = new Map(content.attacks.attacks.map(m => [m.id, m]));
  const metaPath = join(ROOT, 'assets', 'runtime', 'fighters', 'fighters.json');
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
  const lines: string[] = [
    '# Down attacks: drawing task',
    '',
    'One clip per attack below, for every fighter, holding each of their two weapons and unarmed.',
    'Follow docs/ART_INTEGRATION.md: transparent frames, facing right, feet pivot, and clip `ticks` that add up to the total exactly.',
    'Draw the contact pose during the **active** ticks. Startup leads into it; recovery returns to stance.',
    'The hitbox comes from the game data, not the drawing, so keep the weapon or limb inside the listed reach.',
    '',
  ];
  const row = (m: Attack, kind: string) => {
    const box = m.collisionPhases[0]?.rectUnits;
    const reach = box ? `x ${box[0]}..${box[0] + box[2]}, y ${box[1]}..${box[1] + box[3]}` : m.projectile ? `projectile from (${m.projectile.originUnits.join(', ')})` : '—';
    return `| \`${m.id}\` | ${kind} | ${m.startup} / ${m.active} / ${m.recovery} = **${m.totalTicks}** | ${reach} | ${m.visualPose.replace(/\|/g, '/')} |`;
  };
  for (const f of content.fighters.fighters) {
    lines.push(`## ${f.name}`, '');
    for (const weapon of [...f.weaponPair, 'unarmed']) {
      lines.push(`### ${weapon === 'unarmed' ? 'Unarmed' : weapon[0].toUpperCase() + weapon.slice(1)}`, '');
      lines.push('| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |', '| --- | --- | --- | --- | --- |');
      for (const [suffix, kind] of KINDS) {
        const id = suffix === 'dsig' ? (weapon === 'unarmed' ? 'unarmed_dsig' : `${f.id}_${weapon}_dsig`) : `${weapon}_${suffix}`;
        const m = moves.get(id);
        if (m) lines.push(row(m, kind));
      }
      lines.push('');
    }
    const clips = meta[f.id]?.clips ?? {};
    const ids = [...f.weaponPair, 'unarmed'].flatMap(w => KINDS.map(([k]) => k === 'dsig' ? (w === 'unarmed' ? 'unarmed_dsig' : `${f.id}_${w}_dsig`) : `${w}_${k}`));
    const missing = ids.filter(id => !clips[id]);
    lines.push(missing.length ? `Clips not yet delivered for ${f.name}: ${missing.map(id => `\`${id}\``).join(', ')}.` : `All ${ids.length} down-attack clips for ${f.name} have a slot in the atlas; redraw any that reuse a non-downward pose.`, '');
  }
  return lines.join('\n');
}

if (import.meta.main) {
  const dir = join(ROOT, 'docs', 'art');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'DOWN_ATTACKS.md'), downAttackBrief());
  console.log('Wrote docs/art/DOWN_ATTACKS.md');
}
