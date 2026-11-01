// Local lobby rules: every human needs their own tested device, empty seats can be
// filled by clearly labelled computer players, and teams must be playable.

import type { FighterConfig } from '../../../../packages/sim/src/index.ts';

export const CPU_INPUT = 'cpu';

export interface LobbySlot { hero: string; input: string }
export type LobbyResult = { ok: true; fighters: FighterConfig[] } | { ok: false; message: string };

/**
 * Build the match roster from lobby slots. `ready(inputId)` reports whether a
 * controller has been tested with a button press; computer seats are named "(CPU)".
 */
export function buildRoster(mode: string, slots: LobbySlot[], ready: (inputId: string) => boolean, nameOf: (hero: string) => string = h => h): LobbyResult {
  const fighters: FighterConfig[] = slots.map((slot, n) => {
    const cpu = slot.input === CPU_INPUT;
    return { hero: slot.hero, human: !cpu, inputId: cpu ? `cpu:${n}` : slot.input, team: mode === 'teams' ? n % 2 : n, name: cpu ? `${nameOf(slot.hero)} (CPU)` : undefined };
  });
  const humans = fighters.filter(f => f.human);
  if (!humans.length) return { ok: false, message: 'At least one player needs an input device.' };
  if (slots.some(s => !s.input)) return { ok: false, message: 'Choose an input device or Computer for every seat.' };
  const devices = humans.map(f => f.inputId!);
  if (new Set(devices).size !== devices.length) return { ok: false, message: 'Assign one different input device to each player.' };
  if (devices.some(id => id.startsWith('pad:') && !ready(id))) return { ok: false, message: 'Test each assigned controller with a button press.' };
  if (mode === 'teams') {
    for (const team of [0, 1]) {
      if (!fighters.some(f => f.team === team)) return { ok: false, message: 'Both teams need at least one fighter.' };
    }
  }
  return { ok: true, fighters };
}

/**
 * Ready tracking for the local lobby. Every human seat must ready up after seeing the
 * final rules; any rule or seat change cancels every Ready.
 */
export class ReadyBoard {
  private ready = new Set<number>();
  private rulesKey = '';

  /** Record the current rules; returns true if they changed (and Ready was cleared). */
  setRules(rules: unknown): boolean {
    const key = JSON.stringify(rules);
    if (key === this.rulesKey) return false;
    this.rulesKey = key;
    this.ready.clear();
    return true;
  }

  toggle(seat: number): boolean {
    if (this.ready.has(seat)) this.ready.delete(seat); else this.ready.add(seat);
    return this.ready.has(seat);
  }

  isReady(seat: number): boolean { return this.ready.has(seat); }

  /** Start is allowed only when every human seat is Ready. */
  allReady(slots: LobbySlot[]): boolean {
    return slots.every((s, n) => s.input === CPU_INPUT || this.ready.has(n));
  }
}
