// Shared art fixture: the fighter manifest the game ships (assets/runtime/fighters/fighters.json),
// read once per test file instead of every test parsing it again.

import { readFileSync } from 'node:fs';

/** Every fighter's sheets, frames and clips, keyed by fighter id. */
export const fighterMeta: Record<string, any> = JSON.parse(
  readFileSync(new URL('../../assets/runtime/fighters/fighters.json', import.meta.url), 'utf8'),
);
