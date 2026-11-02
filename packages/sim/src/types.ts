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
  /** Interact held down (hold-to-secure tasks); `interact` is the press edge. */
  interactHeld: boolean;
  /** Emote pressed this tick (0-3), or -1. Cosmetic, but simulated so replays and every screen agree. */
  emote: number;
}
export type InputFrame = Partial<Input>;
/** Inputs for a tick keyed by fighter id or input device id. */
export type InputFrames = Record<string | number, InputFrame>;

export type ActionKind = 'attack' | 'dodge' | 'dash' | 'chase' | 'pickup' | 'drop' | 'throw';

export interface Action {
  comboDepth?: number;
  pace?: number;
  hitGroups?: Record<number, number[]>;
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
  impactTick?: number;
}

/** A press held briefly until it becomes legal. `chase` is Dodge + direction after a confirmed hit. */
export interface Buffered { type: 'jump' | 'light' | 'heavy' | 'chase'; ticks: number; x: number; y: number }

export interface BotMemory {
  next: number;
  intent: Input;
  history: { x: number; y: number; action: string; tick: number }[];
  tell: number;
  tellDir: number;
  /** Button released when the tell ends (wave archetypes use light or heavy). */
  tellButton?: 'light' | 'heavy';
  phase: number;
  /** Attack instance whose chase was already decided, so each hit is rolled once. */
  chaseFor?: number;
}

export interface Fighter {
  grabbed?: { owner: number; instance: number; until: number };
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
  /** Emote on show until `until`; any action, hit or leaving the ground ends it. */
  emote: { id: number; until: number } | null;
  /** Hits taken while already in hitstun during the current combo. */
  comboLinks?: number;
  /** Tick this fighter lost their last stock; later means a better placement. */
  eliminatedAt?: number;
  /** Wave archetype from the enemy catalog (road_guard, shield_guard, archer, brute). */
  role?: string;
}

export interface Projectile {
  returnAtTick?: number;
  effect?: string;
  originX?: number;
  rangeQ?: number;
  returning?: boolean;
  hit?: number[];
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
  /** Authored boss pattern for Story Archive boss levels. */
  bossScript?: BossScript;
  friendlyFire?: boolean;
  /** Custom rules: lives per fighter (1-9) and match length in minutes (1-10). */
  stocks?: number | string;
  matchMinutes?: number | string;
  trainingBot?: string;
  bossName?: string;
}

/** One authored boss move: a locked tell, an active hazard zone, then recovery. */
export interface BossMove {
  name: string;
  kind: 'lane' | 'sweep' | 'charge' | 'slam';
  tell: number;
  active: number;
  recovery: number;
  /** Hazard size in units, standing on the main stage surface. */
  width: number;
  height: number;
  damageTenths: number;
  forceQ: number;
  angle: number;
  caption: string;
}
/** Three phases (guard above 65%, above 30%, below 30%), each a move sequence. */
export interface BossScript { phases: BossMove[][] }
export interface BossRun { phase: number; index: number; stage: 'gap' | 'tell' | 'active' | 'recovery'; ticks: number; lockX: number; originX: number; instance: number; hit: number[] }
export interface BossHazard { name: string; kind: BossMove['kind']; stage: 'tell' | 'active'; box: [number, number, number, number]; ticks: number }

/** The next wave arrival, shown at its gate before the opponent appears. */
export interface WaveCue { x: number; y: number; role: string; ticks: number }

/** One line of the results screen. Equal places share a number. */
export interface Placement { fighter: number; name: string; human: boolean; team: number; place: number; stocks: number; damage: number; damageDealt: number }

export interface MatchResult { won: boolean; reason: string; winners: number[]; ticks: number; difficulty: string; mode: string; placements: Placement[] }

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
  /** Story defend objectives: x positions (Q) raiders head for when not engaging a player. */
  guardPoints?: number[];
  bossScript: BossScript | null;
  bossRun: BossRun | null;
  bossHazard: BossHazard | null;
  pickupTick: number;
  pickupCycle: number;
  pickupPriority: number;
  friendlyFire: boolean;
  trainingBot: string;
  bossName: string;
  suddenDeath: boolean;
  totalEnemies: number;
  /** Lives each fighter starts with under this match's rules. */
  stocksRule: number;
  options: MatchOptions;
}
