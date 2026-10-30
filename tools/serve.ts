// Tiny local static server for previewing dist/ in a browser during development.
// The game itself never needs a server: dist/PLAY.html opens directly from disk.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { ROOT } from './lib/content.ts';

const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.png': 'image/png' };

createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^[/\\]+/, '');
  const file = join(DIST, path || 'PLAY.html');
  if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
}).listen(PORT, '127.0.0.1', () => console.log(`Serving dist/ at http://127.0.0.1:${PORT}/`));
