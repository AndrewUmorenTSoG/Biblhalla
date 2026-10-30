// Compile and validate canonical content into build/content.json.
// `--check` validates only, writing nothing.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, ROOT } from './lib/content.ts';

try {
  const content = loadContent();
  const summary = `${content.fighters.fighters.length} fighters, ${content.attacks.attacks.length} attacks, ${content.maps.maps.length} arenas, ${content.campaign.levels.length} levels`;
  if (process.argv.includes('--check')) {
    console.log(`Content valid: ${summary}; hash ${content.hash}`);
  } else {
    const out = join(ROOT, 'build');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'content.json'), JSON.stringify(content));
    console.log(`Compiled content (${summary}) -> build/content.json; hash ${content.hash}`);
  }
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
