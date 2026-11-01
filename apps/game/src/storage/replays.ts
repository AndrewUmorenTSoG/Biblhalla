// Local replay library (16_Saves_Progression_and_Replays): keeps the 20 newest arena
// replays plus any pinned ones, within a size budget, on this device only.

import type { KeyValueStorage } from './profile.ts';

export const REPLAY_LIBRARY_KEY = 'biblhalla-replays-v1';
export const MAX_UNPINNED = 20;
/** Browser storage is small; stay well under the usual 5 MB per-site limit. */
export const MAX_LIBRARY_BYTES = 3 * 1024 * 1024;

export interface SavedReplay { id: string; label: string; savedAt: string; pinned: boolean; bytes: number; data: string }

export class ReplayLibrary {
  private items: SavedReplay[] = [];
  private storage: KeyValueStorage | null;

  constructor(storage: KeyValueStorage | null) {
    this.storage = storage;
    try {
      const raw = storage?.getItem(REPLAY_LIBRARY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) this.items = parsed.filter(r => r && typeof r.id === 'string' && typeof r.data === 'string');
    } catch { this.items = []; }
  }

  list(): Omit<SavedReplay, 'data'>[] {
    return this.items.map(({ data: _data, ...meta }) => meta);
  }

  get(id: string): string | null { return this.items.find(r => r.id === id)?.data ?? null; }

  /** Add a replay; the oldest unpinned replays are dropped to stay within limits. */
  add(replay: unknown, label: string, now = new Date()): string {
    const data = JSON.stringify(replay);
    const id = `r${now.getTime().toString(36)}${this.items.length.toString(36)}`;
    this.items.unshift({ id, label, savedAt: now.toISOString(), pinned: false, bytes: data.length, data });
    this.trim();
    this.persist();
    return id;
  }

  pin(id: string, pinned = true): void {
    const r = this.items.find(x => x.id === id);
    if (r) { r.pinned = pinned; this.trim(); this.persist(); }
  }

  remove(id: string): void {
    this.items = this.items.filter(r => r.id !== id);
    this.persist();
  }

  private trim(): void {
    let unpinned = 0, bytes = 0;
    this.items = this.items.filter(r => {
      if (!r.pinned && ++unpinned > MAX_UNPINNED) return false;
      bytes += r.bytes;
      return r.pinned || bytes <= MAX_LIBRARY_BYTES;
    });
  }

  private persist(): void {
    try { this.storage?.setItem(REPLAY_LIBRARY_KEY, JSON.stringify(this.items)); } catch { /* storage full or denied: the library stays in memory */ }
  }
}
