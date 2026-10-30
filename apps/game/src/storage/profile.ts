// Versioned local profile with previous-valid backup, in-memory fallback when
// storage is denied, and strict validation of imported saves.

import type { Content } from '../../../../packages/content/src/index.ts';

export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

export const SAVE_KEY = 'biblhalla-profile-v1';
export const BACKUP_KEY = SAVE_KEY + '-backup';
export const MAX_SAVE_BYTES = 1048576;
const STAGES = ['entry', 'middle_or_phase_two', 'exit'];
const DIFFICULTIES = ['easy', 'hard', 'extreme'];
const SEEN_CARD = /^L\d{3}:\d{1,2}$/;
const BINDABLE = /^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Control(Left|Right)|Enter|Escape|Backspace|Tab)$/;

export const DEFAULT_BINDINGS = {
  left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', light: 'KeyJ', heavy: 'KeyK',
  dodge: 'ShiftLeft', item: 'KeyL', interact: 'KeyE', pause: 'Escape',
};
export type Bindings = typeof DEFAULT_BINDINGS;

export interface Settings {
  input: 'keyboard' | 'touch' | 'controller';
  difficulty: 'easy' | 'hard' | 'extreme';
  mute: boolean;
  reducedMotion: boolean;
  leftHanded: boolean;
  touchSize: number;
  touchOpacity: number;
  deadzone: number;
  uiScale: number;
  captionSpeed: number;
  symbolicFinale: boolean;
  bindings: Bindings;
}

export interface SavedCheckpoint { level: string; stage: string; seed: number; progress: number[]; combatCleared: boolean; seen: string[] }

export interface Profile {
  schema: 1;
  contentVersion: string;
  completed: string[];
  medals: Record<string, string>;
  checkpoint: SavedCheckpoint | null;
  journal: string[];
  settings: Settings;
  controlChecked: boolean;
}

const RANGES: [keyof Settings, number, number][] = [
  ['touchSize', 64, 100], ['touchOpacity', 0.3, 1], ['deadzone', 0.1, 0.5], ['uiScale', 0.85, 1.3], ['captionSpeed', 0.5, 2],
];

export function createProfiles(content: Content) {
  const ids = new Set(content.campaign.levels.map(l => l.id));

  const defaults = (): Profile => ({
    schema: 1, contentVersion: content.hash || 'main-1', completed: [], medals: {}, checkpoint: null, journal: [],
    settings: {
      input: 'keyboard', difficulty: 'easy', mute: false, reducedMotion: false, leftHanded: false, touchSize: 80, touchOpacity: 0.8,
      deadzone: 0.2, uiScale: 1, captionSpeed: 1, symbolicFinale: true, bindings: { ...DEFAULT_BINDINGS },
    },
    controlChecked: false,
  });

  /** Rebuild a profile from untrusted JSON, keeping only known, in-range values. */
  function validate(raw: any): Profile {
    if (!raw || raw.schema !== 1 || !Array.isArray(raw.completed) || raw.completed.length > ids.size) throw new Error('Unsupported or invalid save');
    const d = defaults();
    d.completed = [...new Set<string>(raw.completed.filter((id: unknown) => typeof id === 'string' && ids.has(id)))].sort();
    if (Array.isArray(raw.journal)) d.journal = [...new Set<string>(raw.journal.filter((id: unknown) => typeof id === 'string' && ids.has(id)))].slice(0, ids.size);
    if (raw.medals && typeof raw.medals === 'object') for (const id of d.completed) if (DIFFICULTIES.includes(raw.medals[id])) d.medals[id] = raw.medals[id];
    const cp = raw.checkpoint;
    if (cp && ids.has(cp.level) && STAGES.includes(cp.stage)) {
      d.checkpoint = {
        level: cp.level, stage: cp.stage, seed: Number.isInteger(cp.seed) ? cp.seed >>> 0 : 613891,
        progress: Array.isArray(cp.progress) ? cp.progress.filter((v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 32) : [],
        combatCleared: !!cp.combatCleared,
        seen: Array.isArray(cp.seen) ? cp.seen.filter((v: unknown) => typeof v === 'string' && SEEN_CARD.test(v)).slice(0, 64) : [],
      };
    }
    const s = raw.settings;
    if (s && typeof s === 'object') {
      for (const k of ['mute', 'reducedMotion', 'leftHanded', 'symbolicFinale'] as const) if (typeof s[k] === 'boolean') d.settings[k] = s[k];
      if (['keyboard', 'touch', 'controller'].includes(s.input)) d.settings.input = s.input;
      if (DIFFICULTIES.includes(s.difficulty)) d.settings.difficulty = s.difficulty;
      for (const [k, min, max] of RANGES) if (typeof s[k] === 'number' && Number.isFinite(s[k])) (d.settings as any)[k] = Math.min(max, Math.max(min, s[k]));
      if (s.bindings && typeof s.bindings === 'object') {
        for (const k of Object.keys(d.settings.bindings) as (keyof Bindings)[]) if (typeof s.bindings[k] === 'string' && BINDABLE.test(s.bindings[k])) d.settings.bindings[k] = s.bindings[k];
      }
    }
    d.controlChecked = !!raw.controlChecked;
    return d;
  }

  class Store {
    data: Profile = defaults();
    status = 'Saved on this device';
    durable = true;
    storage: KeyValueStorage | null;
    constructor(storage: KeyValueStorage | null = null) {
      this.storage = storage;
      this.load();
    }

    load(): void {
      if (!this.storage) { this.durable = false; this.status = 'Storage unavailable — use Export save to keep progress'; return; }
      try {
        let raw = this.storage.getItem(SAVE_KEY);
        if (!raw) {
          raw = this.storage.getItem(BACKUP_KEY);
          if (raw) this.status = 'Recovered previous valid save';
        }
        if (raw) {
          try {
            this.data = validate(JSON.parse(raw));
          } catch (err) {
            const backup = this.storage.getItem(BACKUP_KEY);
            if (!backup) throw err;
            this.data = validate(JSON.parse(backup));
            this.status = 'Recovered previous valid save';
          }
        }
      } catch {
        this.durable = false;
        this.status = 'Storage unavailable — use Export save to keep progress';
      }
    }

    /** Keep the last valid record as backup, then write the new one. */
    save(): boolean {
      try {
        if (!this.storage) throw new Error('No storage');
        const previous = this.storage.getItem(SAVE_KEY);
        if (previous) {
          try { validate(JSON.parse(previous)); this.storage.setItem(BACKUP_KEY, previous); } catch { /* never back up a corrupt record */ }
        }
        this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
        this.durable = true;
        this.status = 'Saved on this device';
      } catch {
        this.durable = false;
        this.status = 'Playing in memory — export to keep progress';
      }
      return this.durable;
    }

    checkpoint(level: string, stage: string, progress: number[] = [], combatCleared = false, seed = 613891, seen: string[] = []): void {
      this.data.checkpoint = { level, stage, progress: [...progress], combatCleared, seed, seen: [...seen] };
      this.save();
    }

    complete(level: string, difficulty: string): boolean {
      if (!ids.has(level)) return false;
      if (!this.data.completed.includes(level)) this.data.completed.push(level);
      this.data.medals[level] = difficulty;
      this.data.checkpoint = { level, stage: 'exit', progress: [], combatCleared: true, seed: 613891, seen: [] };
      if (!this.data.journal.includes(level)) this.data.journal.push(level);
      this.save();
      return true;
    }

    unlocked(level: { unlockAfter: string | null }): boolean {
      return !level.unlockAfter || this.data.completed.includes(level.unlockAfter);
    }

    export(): string { return JSON.stringify(this.data, null, 2); }

    import(text: string): void {
      if (text.length > MAX_SAVE_BYTES) throw new Error('Save is too large');
      this.data = validate(JSON.parse(text));
      this.save();
    }
  }

  return { Store, validate, defaults, key: SAVE_KEY, backupKey: BACKUP_KEY };
}

export type Profiles = ReturnType<typeof createProfiles>;
export type ProfileStore = InstanceType<Profiles['Store']>;
