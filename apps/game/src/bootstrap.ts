// Entry point. Content is embedded in the page at build time; it is validated
// before any menu or match starts, and a clear error replaces the game if not.

import { validateContent } from '../../../packages/content/src/index.ts';
import type { Content } from '../../../packages/content/src/index.ts';
import { createEngine } from '../../../packages/sim/src/index.ts';
import { createCampaign } from '../../../packages/campaign/src/index.ts';
import { startApp } from './ui/app.ts';
import type { RuntimeArt } from './render/renderer.ts';
import { guardAtlas, guardClips } from './render/art-guard.ts';
import { lazyMap } from './render/lazy-map.ts';

function showFatal(message: string): void {
  document.body.replaceChildren();
  const box = document.createElement('main');
  box.className = 'fatal';
  const h = document.createElement('h1');
  h.textContent = 'Biblhalla could not start';
  const p = document.createElement('pre');
  p.textContent = message;
  box.append(h, p);
  document.body.append(box);
}

type EmbeddedArt = { images?: Record<string, string>; atlas?: Record<string, unknown>; clips?: RuntimeArt['clips']; arenas?: Record<string, { uri: string; horizon: string; stone: string }> };

function image(uri: string): HTMLImageElement {
  const img = new Image();
  img.src = uri;
  return img;
}

function loadArt(raw: EmbeddedArt | undefined): RuntimeArt {
  // Sheets decode on first use (17_Performance texture budget): a match decodes only its
  // own fighters and arena, and the 2.5 s countdown covers the decode.
  const images = lazyMap(raw?.images ?? {}, uri => image(uri));
  const arenas = lazyMap(raw?.arenas ?? {}, a => ({ image: image(a.uri), horizon: a.horizon, stone: a.stone })) as NonNullable<RuntimeArt['arenas']>;
  const problems: string[] = [];
  const atlas = guardAtlas(raw?.atlas, problems);
  const clips = guardClips(raw?.clips, atlas, problems);
  if (problems.length) console.warn('Biblhalla art skipped:', problems);
  return { images, atlas, clips, arenas };
}

try {
  const root = globalThis as any;
  const content = root.BiblhallaContent as Content;
  validateContent(content);
  const S = createEngine(content);
  startApp(content, S, createCampaign(S, content), loadArt(root.BiblhallaArt));
} catch (err) {
  showFatal((err as Error).message || String(err));
}
