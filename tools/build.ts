// Build the standalone offline game: one self-contained HTML file with content,
// code, styles and runtime-ready art embedded. No network access at runtime.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { loadContent, ROOT, sha256 } from './lib/content.ts';

const APP = join(ROOT, 'apps', 'game');
const DIST = join(ROOT, 'dist');
/**
 * Readiness levels that may ship in the page. "concept_cut" frames are cleaned,
 * transparent cut-outs of concept poses: labelled stand-ins, never final art.
 */
export const SHIPPABLE_READINESS = ['runtime_alpha', 'concept_cut'];

/** External-resource patterns that must never appear in the shipped page. */
export const FORBIDDEN_RUNTIME = [
  /\b(?:fetch|WebSocket|XMLHttpRequest|importScripts|EventSource|sendBeacon)\s*\(/,
  /<(?:script|link|img|iframe|audio|video|source)\b[^>]+(?:src|href)=["']https?:\/\//i,
  /url\(\s*["']?https?:\/\//i,
];

interface ArtEntry { image: string; sha256: string; readiness: string; frames: Record<string, unknown> }

/** Embed fighter atlases whose manifest entry is shippable and whose bytes match their hash. */
function runtimeArt(): { images: Record<string, string>; atlas: Record<string, unknown>; readiness: Record<string, string>; skipped: string[] } {
  const metaPath = join(ROOT, 'assets', 'runtime', 'fighters', 'fighters.json');
  const images: Record<string, string> = {}, atlas: Record<string, unknown> = {}, readiness: Record<string, string> = {};
  const skipped: string[] = [];
  if (!existsSync(metaPath)) return { images, atlas, readiness, skipped };
  const meta: Record<string, ArtEntry> = JSON.parse(readFileSync(metaPath, 'utf8'));
  for (const [id, entry] of Object.entries(meta)) {
    if (!SHIPPABLE_READINESS.includes(entry.readiness)) { skipped.push(`${id} (${entry.readiness})`); continue; }
    const bytes = readFileSync(join(ROOT, entry.image));
    if (sha256(bytes) !== entry.sha256) throw new Error(`Asset ${entry.image} does not match its manifest hash`);
    images[id] = 'data:image/png;base64,' + bytes.toString('base64');
    atlas[id] = entry.frames;
    readiness[id] = entry.readiness;
  }
  return { images, atlas, readiness, skipped };
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
    + ';globalThis.BiblhallaArt=' + JSON.stringify({ images: art.images, atlas: art.atlas, readiness: art.readiness }) + ';';
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
    runtimeArt: art.readiness,
    artExcluded: art.skipped,
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
    console.log(`Fighter art: ${Object.entries(manifest.runtimeArt as Record<string, string>).map(([id, r]) => `${id}=${r}`).join(', ') || 'procedural rigs only'}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
