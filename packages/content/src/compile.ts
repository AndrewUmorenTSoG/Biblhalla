// Assemble raw canonical data files into the single runtime Content object.

import type { Content } from './types.ts';
import { validateContent } from './validate.ts';

export const PRODUCT_NAME = 'Biblhalla';
export const SOURCE_FILES = ['fighters', 'weapons', 'attacks', 'maps', 'physics', 'rules', 'campaign'] as const;
export type RawContent = Record<(typeof SOURCE_FILES)[number], any>;

/** Stable JSON: object keys sorted, so the content hash never depends on key order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson((value as any)[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/**
 * Build validated runtime content. `digest` hashes a string (sha256 in the build
 * tool); it is injected so this module stays free of Node APIs.
 */
export function compileContent(raw: RawContent, digest: (text: string) => string): Content {
  const campaign = structuredClone(raw.campaign);
  // The pack's working title predates the product name; the game ships as Biblhalla.
  campaign.sourceTitle = campaign.title;
  campaign.title = `${PRODUCT_NAME} — The Story Archive`;
  const body = {
    productName: PRODUCT_NAME,
    fighters: raw.fighters,
    weapons: raw.weapons,
    attacks: raw.attacks,
    maps: raw.maps,
    physics: raw.physics,
    rules: raw.rules,
    campaign,
  };
  const content = { ...body, hash: digest(canonicalJson(body)).slice(0, 16) } as Content;
  validateContent(content);
  return content;
}
