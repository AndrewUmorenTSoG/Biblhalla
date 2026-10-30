// Canonical content shapes. Source of truth: production-pack/09_Data/*.json.
// Rects: map rectUnits are [leftX, bottomY, width, thickness]; attack rectUnits
// are [leftX, bottomY, width, height] relative to the fighter's feet.

export type Rect = [number, number, number, number];
export type Point = [number, number];

export type Direction = 'neutral' | 'side' | 'down';
export type Button = 'light' | 'heavy';
export type InputContext = 'ground' | 'air' | 'groundOrAirCancel';

export interface CollisionPhase {
  firstTick: number;
  lastTickExclusive: number;
  shape: 'rect';
  rectUnits: Rect;
  anchor: 'fighterFeet';
  hitGroup: number;
}

export interface ProjectileSpec {
  spawnTick: number;
  originUnits: Point;
  travelAngle: number;
  speedQ: number;
  gravityQ: number;
  lifetimeTicks: number;
  collisionUnits: Point;
  maxHits: number;
  capClass: 'light' | 'signature';
  stageCollision: 'despawn';
  homing: boolean;
}

export type MotionEvent =
  | { kind: 'translate'; fromTick: number; toTickExclusive: number; dxQ: number; dyQ: number; blockedBySolid: boolean }
  | { kind: 'setVelocity'; atTick: number; vxQ: number; vyQ: number };

export interface Attack {
  id: string;
  ownerType: 'weapon' | 'fighter';
  ownerId: string;
  weapon?: string;
  displayName: string;
  input: { button: Button; direction: Direction; context: InputContext };
  startup: number;
  active: number;
  recovery: number;
  totalTicks: number;
  damageTenths: number;
  hitstunTicks: number;
  baseForceQ: number;
  growthQPerDamage: number;
  launchAngle: number;
  delivery: 'melee' | 'projectile';
  collisionPhases: CollisionPhase[];
  projectile: ProjectileSpec | null;
  motionEvents: MotionEvent[];
  oneHitPerTarget: boolean;
  totalProjectileHitBudget: number | null;
  hitstopTicks: number;
  invulnerability: boolean;
  chargeable: boolean;
  chargeMaxTicks: number;
  chargeMaxDamagePermille: number;
  chaseCancelOnConfirmedHit: boolean;
  landingRule: 'continueAuthoredAction' | 'endActiveThenRecoveryPlus8';
  visualPose: string;
  resourceCostOnActionStart: { recovery?: number };
}

export interface Stats { power: number; guard: number; speed: number }

export interface FighterDef {
  id: string;
  name: string;
  title: string;
  weaponPair: [string, string];
  stats: Stats;
  hurtboxUnits: { width: number; height: number; shape: 'capsule'; anchor: 'feet' };
  signatureIds: string[];
  scriptureReferences: string;
  storyContext: string;
  conceptImage: string;
  animationStatus: string;
  rosterUnlock: string;
}

export interface WeaponDef {
  id: string;
  identity: string;
  attackIds: string[];
  groundedHeavySource: string;
}

export interface Platform {
  id: string;
  kind: 'solid' | 'oneWay';
  rectUnits: Rect;
  wallRecoverable?: boolean;
}

export interface MapDef {
  id: string;
  name: string;
  scriptureContext: string;
  main: Platform;
  platforms: Platform[];
  blastBoundsUnits: { minX: number; maxX: number; minY: number; maxY: number };
  spawnFeetUnits: Point[];
  pickupSpawnUnits: Point[];
  competitiveCandidate: boolean;
  competitiveApproved: boolean;
  artReference: string;
  artStatus: string;
}

export interface Physics {
  tickRate: number;
  fixedScale: number;
  runMaxQ: number;
  runSpeedPerStatQ: number;
  groundAccelerationQ: number;
  groundBrakeQ: number;
  airAccelerationQ: number;
  gravityQ: number;
  groundJumpQ: number;
  airJumpQ: number;
  jumpCutCapQ: number;
  fallCapQ: number;
  fastFallCapQ: number;
  fastFallGravityMultiplier: number;
  airJumps: number;
  recoveryUses: number;
  dash: { speedQ: number; durationTicks: number; repeatLockTicks: number; invulnerable: boolean; dashJumpCapQ: number };
  dodge: {
    ground: { startup: number; invulnerable: number; recovery: number; cooldown: number };
    air: { startup: number; invulnerable: number; recovery: number; cooldown: number; speedQ: number };
    landingCooldownClamp: number;
  };
  airCancel: { firstActionTick: number; lastActionTickInclusive: number };
  chase: { tokenTicks: number; speedQ: number; durationTicks: number };
  wall: { slideFallCapQ: number; maxCumulativeTicks: number; refreshesPerAirborneJourney: number; jumpAwayQ: number; jumpUpQ: number };
  coyoteTicks: number;
  inputBufferTicks: number;
  dropThroughTicks: number;
  groundResetContactTicks: number;
  knockbackDecayXQ: number;
  knockbackCapQ: number;
  hurtboxUnits: Point;
  powerDamagePermillePerStat: number;
  guardForcePermillePerStat: number;
  statBaseline: number;
  directionScale: number;
  directionLookup: Record<string, Point>;
}

export interface Rules {
  stockDefault: number;
  matchTicks: number;
  respawnDelayTicks: number;
  respawnInvulnerabilityTicks: number;
  suddenDeath: { stocks: number; damageTenths: number; durationTicks: number };
  localMaxPlayers: number;
  pickups: {
    initialTick: number; intervalTicks: number; jitterTicks: number; maxNeutral: number;
    lifetimeTicks: number; acquireTicks: number; radiusUnits: number; maxVerticalUnits: number;
  };
  throw: {
    startup: number; release: number; recovery: number; speedQ: number; gravityQ: number; lifetimeTicks: number;
    damageTenths: number; hitstunTicks: number; baseForceQ: number; growthQPerDamage: number;
  };
  drop: { startup: number; release: number; recovery: number; lifetimeTicks: number };
  offlineOnly: boolean;
  requiresAccount: boolean;
  requiresNetwork: boolean;
  difficultyIds: Difficulty[];
  storyLevelCount: number;
  storyChapterCount: number;
  difficulty: Record<Difficulty, { reactionTicks: number; decisionTicks: number }>;
}

export type Difficulty = 'easy' | 'hard' | 'extreme';

export type LevelKind =
  | 'traversal' | 'exploration' | 'puzzle' | 'escort' | 'waves' | 'survival'
  | 'witness' | 'escape' | 'boss' | 'building' | 'stealth';

export interface Level {
  id: string;
  number: number;
  chapter: number;
  title: string;
  scripture: string;
  kind: LevelKind;
  location: string;
  storyBeat: string;
  objective: string;
  uniqueRule: string;
  combatEnabled: boolean;
  previousLevel: string | null;
  nextLevel: string | null;
  unlockAfter: string | null;
  prompt: string;
  difficulties: Difficulty[];
  implementationStatus: string;
  waves: string[][];
  boss: { name: string; phases: string[]; historicalReenactment?: boolean } | null;
  checkpoints: string[];
  requiresNetwork: boolean;
}

export interface Chapter { id: string; title: string; arc: string; levels: string[] }

export interface Campaign {
  title: string;
  publisher: string;
  offlineOnly: boolean;
  levelCount: number;
  chapterCount: number;
  protagonists: string[];
  chapters: Chapter[];
  levels: Level[];
}

/** Compiled runtime content: the only content object the game consumes. */
export interface Content {
  productName: string;
  hash: string;
  fighters: { fighters: FighterDef[] };
  weapons: { weapons: WeaponDef[] };
  attacks: { attacks: Attack[] };
  maps: { maps: MapDef[] };
  physics: Physics;
  rules: Rules;
  campaign: Campaign;
}
