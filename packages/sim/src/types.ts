import type { Difficulty, LevelScript, MapDef, Stats } from '../../content/src/index.ts';

/** One tick of semantic input. Axes are -1/0/1 with +y meaning up. */
export interface Input {
  x: number;
  y: number;
  jump: boolean;
  jumpHeld: boolean;
  light: boolean;
  heavy: boolean;
  heavyHeld: boolean;
  dodge: boolean;
  item: boolean;
  interact: boolean;
}
export type InputFrame = Partial<Input>;
/** Inputs for a tick keyed by fighter id or input device id. */
export type InputFrames = Record<string | number, InputFrame>;

export type ActionKind = 'attack' | 'dodge' | 'dash' | 'chase' | 'pickup' | 'drop' | 'throw';

export interface Action {
  kind: ActionKind;
  tick: number;
  duration: number;
  instance: number;
  facing: number;
  move?: string;
  hit: number[];
  charge: number;
  cancelled?: boolean;
  dx?: number;
  dy?: number;
  airborne?: boolean;
  itemId?: number;
  weapon?: string;
  confirmed?: boolean;
  landed?: boolean;
}

export interface Buffered { type: 'jump' | 'light' | 'heavy'; ticks: number; x: number; y: number }

export interface BotMemory {
  next: number;
  intent: Input;
  history: { x: number; y: number; action: string; tick: number }[];
  tell: number;
  tellDir: number;
  phase: number;
}

export interface Fighter {
  id: number;
  hero: string;
  name: string;
  human: boolean;
  inputId: string;
  team: number;
  x: number; y: number; vx: number; vy: number; kx: number;
  facing: number;
  ground: string | null;
  stocks: number;
  damage: number;
  weapon: string;
  nextWeapon: number;
  jumps: number;
  recovery: number;
  dodgeCD: number;
  dashCD: number;
  wallTicks: number;
  wallRefresh: number;
  wallSide: number;
  wallUsed: number;
  groundedTicks: number;
  coyote: number;
  drop: number;
  invulnerable: number;
  respawn: number;
  stun: number;
  hitstop: number;
  chase: number;
  jumpTick: number;
  action: Action | null;
  buffer: Buffered | null;
  jumpCut: boolean;
  ai: BotMemory;
  guard: number | null;
  maxGuard: number | null;
  scale: number;
  stats: Stats;
  score: number;
  damageDealt: number;
  hits: number;
  carry: boolean;
}

export interface Projectile {
  id: number;
  owner: number;
  team: number;
  move: string;
  instance: number;
  facing: number;
  x: number; y: number; vx: number; vy: number;
  gravity: number;
  life: number;
  size: [number, number];
  capClass: string;
  charge: number;
  weapon: string | null;
}

export interface Item {
  id: number;
  x: number; y: number; vy: number;
  life: number;
  neutral: boolean;
  weapon: string | null;
  claim: number | null;
}

export interface SimEvent { id: number; tick: number; type: string; [key: string]: unknown }

export type Mode = 'duel' | 'waves' | 'boss' | 'training' | 'local' | 'teams' | 'ffa' | 'story';
export type Phase = 'countdown' | 'playing' | 'paused' | 'result';

export interface FighterConfig {
  hero: string;
  name?: string;
  human?: boolean;
  inputId?: string;
  team?: number;
  stocks?: number;
  guard?: number | null;
  scale?: number;
}

export interface MatchOptions {
  mode?: Mode | string;
  arena?: string;
  difficulty?: Difficulty | string;
  hero?: string;
  opponent?: string;
  inputId?: string;
  seed?: number | string;
  fighters?: FighterConfig[];
  waves?: string[][];
  /** Gate lists per wave, from the level brief. */
  waveEntries?: LevelScript['waveEntries'];
  friendlyFire?: boolean;
  trainingBot?: string;
  bossName?: string;
}

/** The next wave arrival, shown at its gate before the opponent appears. */
export interface WaveCue { x: number; y: number; role: string; ticks: number }

export interface MatchResult { won: boolean; reason: string; winners: number[]; ticks: number; difficulty: string; mode: string }

export interface SimState {
  version: number;
  contentHash: string;
  tick: number;
  rng: number;
  entityId: number;
  eventId: number;
  phase: Phase;
  countdown: number;
  resumePhase: Phase | null;
  mode: Mode;
  difficulty: Difficulty;
  map: MapDef;
  fighters: Fighter[];
  projectiles: Projectile[];
  items: Item[];
  events: SimEvent[];
  remaining: number;
  result: MatchResult | null;
  wave: number;
  waveWait: number;
  wavePending: string[];
  waves: string[][];
  waveEntries: LevelScript['waveEntries'] | null;
  waveArrivals: number;
  waveResting: boolean;
  cue: WaveCue | null;
  pickupTick: number;
  pickupCycle: number;
  pickupPriority: number;
  friendlyFire: boolean;
  trainingBot: string;
  bossName: string;
  suddenDeath: boolean;
  totalEnemies: number;
  options: MatchOptions;
}
