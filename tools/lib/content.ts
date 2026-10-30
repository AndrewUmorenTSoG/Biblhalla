// Node-side content loading: reads production-pack/09_Data and compiles it.

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent, SOURCE_FILES, ContentError } from '../../packages/content/src/index.ts';
import type { Content, RawContent } from '../../packages/content/src/index.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = join(ROOT, 'production-pack', '09_Data');

export const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');

export function loadRawContent(dir = DATA_DIR): RawContent {
  const raw: Partial<RawContent> = {};
  const problems: string[] = [];
  for (const name of SOURCE_FILES) {
    const file = join(dir, `${name}.json`);
    if (!existsSync(file)) { problems.push(`missing data file ${file}`); continue; }
    try {
      raw[name] = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      problems.push(`${file} is not valid JSON: ${(err as Error).message}`);
    }
  }
  if (problems.length) throw new ContentError(problems);
  return raw as RawContent;
}

let cached: Content | null = null;

/** Compile canonical content (cached per process). */
export function loadContent(dir = DATA_DIR): Content {
  if (dir !== DATA_DIR) return compileContent(loadRawContent(dir), sha256);
  cached ??= compileContent(loadRawContent(dir), sha256);
  return cached;
}
