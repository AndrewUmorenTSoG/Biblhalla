// Build the standalone offline game: one self-contained HTML file with content,
// code, styles and runtime-ready art embedded. No network access at runtime.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { loadContent, ROOT, sha256 } from './lib/content.ts';

const APP = join(ROOT, 'apps', 'game');
const DIST = join(ROOT, 'dist');
const RUNTIME_READY = 'runtime_alpha';

/** External-resource patterns that must never appear in the shipped page. */
export const FORBIDDEN_RUNTIME = [
  /\b(?:fetch|WebSocket|XMLHttpRequest|importScripts|EventSource|sendBeacon)\s*\(/,
  /<(?:script|link|img|iframe|audio|video|source)\b[^>]+(?:src|href)=["']https?:\/\//i,
  /url\(\s*["']?https?:\/\//i,
];

/** Embed only art whose manifest entry is runtime-ready; concept sheets stay out. */
function runtimeArt(): { images: Record<string, string>; atlas: Record<string, unknown>; skipped: string[] } {
  const manifestPath = join(ROOT, 'assets', 'manifest.json');
  const images: Record<string, string> = {};
  const skipped: string[] = [];
  if (!existsSync(manifestPath)) return { images, atlas: {}, skipped };
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const atlasPath = join(ROOT, 'assets', 'atlas.json');
  const atlas = existsSync(atlasPath) ? JSON.parse(readFileSync(atlasPath, 'utf8')) : {};
  for (const asset of manifest.assets ?? []) {
    if (asset.readiness !== RUNTIME_READY) { skipped.push(`${asset.id} (${asset.readiness})`); continue; }
    const bytes = readFileSync(join(ROOT, asset.path));
    if (sha256(bytes) !== asset.sha256) throw new Error(`Asset ${asset.id} does not match its manifest hash`);
    images[asset.id] = 'data:image/png;base64,' + bytes.toString('base64');
  }
  const usedAtlas = Object.fromEntries(Object.entries(atlas).filter(([id]) => id in images));
  return { images, atlas: usedAtlas, skipped };
}

export function build(): { html: string; manifest: Record<string, unknown> } {
  const content = loadContent();
  const bundle = buildSync({
    entryPoints: [join(APP, 'src', 'bootstrap.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    charset: 'utf8',
  }).outputFiles[0].text;
  const art = runtimeArt();
  const data = 'globalThis.BiblhallaContent=' + JSON.stringify(content).replace(/</g, '\\u003c')
    + ';globalThis.BiblhallaArt=' + JSON.stringify({ images: art.images, atlas: art.atlas }) + ';';
  const html = readFileSync(join(APP, 'shell.html'), 'utf8')
    .replace('/* STYLE */', () => readFileSync(join(APP, 'style.css'), 'utf8'))
    .replace('/* DATA */', () => data)
    .replace('/* CODE */', () => bundle.replace(/<\/script/gi, '<\\/script'));
  for (const pattern of FORBIDDEN_RUNTIME) {
    if (pattern.test(html)) throw new Error(`Offline check failed: build output matches ${pattern}`);
  }
  const manifest = {
    title: 'Biblhalla',
    publisher: 'Kendrew Games',
    contentHash: content.hash,
    pageSha256: sha256(html),
    bytes: Buffer.byteLength(html),
    roster: content.fighters.fighters.length,
    arenas: content.maps.maps.length,
    attacks: content.attacks.attacks.length,
    levels: content.campaign.levels.length,
    engine: 'Q8 integer, fixed 60 ticks, Canvas 2D',
    offline: true,
    runtimeArt: Object.keys(art.images),
    conceptArtExcluded: art.skipped,
  };
  return { html, manifest };
}

if (import.meta.main) {
  try {
    const { html, manifest } = build();
    mkdirSync(DIST, { recursive: true });
    writeFileSync(join(DIST, 'PLAY.html'), html);
    writeFileSync(join(DIST, 'build-manifest.json'), JSON.stringify({ ...manifest, builtAt: new Date().toISOString() }, null, 2));
    console.log(`Built dist/PLAY.html: ${manifest.bytes} bytes; content ${manifest.contentHash}; page ${String(manifest.pageSha256).slice(0, 16)}`);
    if ((manifest.conceptArtExcluded as string[]).length) console.log(`Concept art not embedded: ${(manifest.conceptArtExcluded as string[]).join(', ')}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
