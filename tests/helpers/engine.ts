// Shared test fixtures: canonical content compiled straight from production-pack.

import { loadContent } from '../../tools/lib/content.ts';
import { createEngine } from '../../packages/sim/src/index.ts';

export const content = loadContent();
export const S = createEngine(content);
export const Q = 256;
