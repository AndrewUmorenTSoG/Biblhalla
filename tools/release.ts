// Build a release folder with the evidence Task 05 asks for: the standalone game,
// content hash, test output, implementation matrix, asset readiness, checksums and
// known limits. Refuses to package if typecheck, tests or the art contract fail.
//
// Usage: node tools/release.ts   ->   dist/release/

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, sha256 } from './lib/content.ts';
import { build } from './build.ts';
import { validateArt } from './art/validate-art.ts';

const OUT = join(ROOT, 'dist', 'release');

export interface ReleaseCheck { name: string; ok: boolean; output: string }

function run(name: string, args: string[]): ReleaseCheck {
  try {
    const output = execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
    return { name, ok: true, output };
  } catch (err: any) {
    return { name, ok: false, output: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

/** Known limits that must ship with every release until they are closed. */
export function knownLimits(art: Record<string, string>): string[] {
  const limits = [
    'Development build: not shipping-ready until final art approval, device QA and narrative review are complete.',
    'No physical-device certification: PC controllers, iPad touch, rotation, background pause and airplane-mode launch need manual testing.',
    'iPad: platform/ipad is unsigned source; a Mac, Xcode and a signing team are required to produce an installable app.',
    'Story Archive: some levels still use shared controllers rather than their bespoke mechanics (see the implementation matrix).',
    'Bots: balance and win rates are unmeasured against human players.',
  ];
  const unapproved = Object.entries(art).filter(([, r]) => r !== 'runtime_alpha').map(([id]) => id);
  if (unapproved.length) limits.push(`Fighter art not yet approved as final (${unapproved.length} fighters at concept_cut).`);
  return limits;
}

if (import.meta.main) {
  const checks = [
    run('typecheck', [join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json']),
    run('tests', ['--test', 'tests/**/*.test.ts']),
  ];
  const art = validateArt();
  checks.push({ name: 'art contract', ok: art.errors.length === 0, output: art.errors.join('\n') || 'No art contract errors.' });
  const failed = checks.filter(c => !c.ok);
  if (failed.length) {
    for (const c of failed) console.error(`FAILED ${c.name}\n${c.output.slice(-4000)}`);
    process.exit(1);
  }

  const { html, manifest } = build();
  const content = loadContent();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const files: Record<string, string | Buffer> = {
    'PLAY.html': html,
    'build-manifest.json': JSON.stringify({ ...manifest, builtAt: new Date().toISOString(), node: process.version }, null, 2),
    'test-output.txt': checks.map(c => `## ${c.name}\n${c.output}`).join('\n\n'),
    'asset-readiness.json': JSON.stringify({ fighters: manifest.runtimeArt, artCoverage: art.coverage }, null, 2),
    'KNOWN_LIMITS.md': '# Known limits\n\n' + knownLimits(manifest.runtimeArt as Record<string, string>).map(l => `- ${l}`).join('\n') + '\n',
    'IMPLEMENTATION_MATRIX.md': readFileSync(join(ROOT, 'docs', 'IMPLEMENTATION_MATRIX.md')),
  };
  for (const [name, data] of Object.entries(files)) writeFileSync(join(OUT, name), data);
  copyFileSync(join(ROOT, 'platform', 'ipad', 'README.md'), join(OUT, 'IPAD_SIGNING.md'));
  const sums = Object.keys(files).concat('IPAD_SIGNING.md').sort()
    .map(name => `${sha256(readFileSync(join(OUT, name)))}  ${name}`).join('\n') + '\n';
  writeFileSync(join(OUT, 'SHA256SUMS'), sums);
  const passed = (checks[1].output.match(/ℹ pass (\d+)/) ?? [])[1] ?? '?';
  console.log(`Release written to dist/release: content ${content.hash}, page ${String(manifest.pageSha256).slice(0, 16)}, ${passed} tests passed.`);
}
