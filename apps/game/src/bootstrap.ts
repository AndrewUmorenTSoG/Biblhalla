// Entry point. Content is embedded in the page at build time; it is validated
// before any menu or match starts, and a clear error replaces the game if not.

import { validateContent } from '../../../packages/content/src/index.ts';
import type { Content } from '../../../packages/content/src/index.ts';
import { createEngine } from '../../../packages/sim/src/index.ts';
import { createCampaign } from '../../../packages/campaign/src/index.ts';
import { startApp } from './ui/app.ts';
import type { RuntimeArt } from './render/renderer.ts';

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

function loadArt(raw: { images?: Record<string, string>; atlas?: Record<string, unknown> } | undefined): RuntimeArt {
  const images: Record<string, HTMLImageElement> = {};
  for (const [id, uri] of Object.entries(raw?.images ?? {})) {
    const img = new Image();
    img.src = uri;
    images[id] = img;
  }
  return { images, atlas: (raw?.atlas ?? {}) as Record<string, any> };
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
