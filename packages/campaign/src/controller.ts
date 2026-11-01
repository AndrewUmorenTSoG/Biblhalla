// Story Archive scene controller. Wraps an arena simulation with objectives,
// companions, hazards and checkpoints. Deterministic and DOM-free.

import type { Content, Level, MapDef } from '../../content/src/index.ts';
import type { Engine, InputFrame, SimState } from '../../sim/src/index.ts';
import { Q } from '../../sim/src/index.ts';
import { LEVEL_SPECS, SUMMARIES } from './specs.ts';
import { BOSS_SCRIPTS } from './bosses.ts';
import { createGoliath, stepGoliath } from './goliath.ts';
import type { GoliathState } from './goliath.ts';
import type { LevelSpec, TaskType } from './specs.ts';

export type Stage = 'entry' | 'middle_or_phase_two' | 'exit';
export type ScenePhase = 'intro' | 'active' | 'paused' | 'complete' | 'failed';

export interface Marker {
  id: number; x: number; y: number; type: TaskType; label: string;
  stage: number; done: boolean; carried: boolean; dropped: boolean; targetX: number;
}
export interface Hazard { id: number; x: number; y: number; period: number; tell: number; active: number; state?: 'tell' | 'active' | 'safe' }
export interface Checkpoint { level: string; stage: Stage; progress: number[]; combatCleared: boolean; seed: number; seen?: string[] }
/** Storm gusts: a captioned warning, then a headwind that slows grounded movement. */
export interface Wind { period: number; tell: number; gust: number; state: 'calm' | 'warning' | 'gust' | 'over' }
/** Rising water: a telegraphed surge that sweeps the floor; ledges and the air stay safe. */
export interface Water { period: number; tell: number; active: number; state: 'calm' | 'rising' | 'high'; ticksToSurge: number }
export interface Card {
  heading: string; text: string; reference: string; label: string;
  puzzle: boolean; choices: string[]; answer: number; prompt: string;
}

export interface Scene {
  version: number;
  levelId: string;
  level: Level;
  kind: Level['kind'];
  difficulty: string;
  phase: ScenePhase;
  tick: number;
  stage: Stage;
  done: number[];
  carry: number | null;
  pendingCard: number | null;
  combatCleared: boolean;
  caption: string;
  captionUntil: number;
  markers: Marker[];
  hazards: Hazard[];
  companion: { x: number; y: number; following: boolean };
  checkpointEvent: Checkpoint | null;
  result: { won: boolean; level?: string; next?: string | null; reason?: string } | null;
  goliath: GoliathState;
  sourceSummary: string;
  config: LevelSpec;
  world: SimState;
  waitingPlatforms?: MapDef['platforms'] | null;
  satchelClosed?: boolean;
  /** Story cards seen this level (never removed by a retry). */
  seen: string[];
  closingLine: string;
  water: Water | null;
  /** Storm headwind gusts; they stop once the scene's tasks are complete. */
  wind: Wind | null;
  /** Route sections held back until the narrated crossing cue. */
  parted?: MapDef['platforms'] | null;
}

const GOLIATH_LEVEL = 41;
const RETURN_ROUTE_LEVELS = [13, 42];
const PARABLE_LEVELS = [69, 74];
const RISING_WATER = /water rises/i;
const STORM = /storm ends on the narrative cue/i;
const PARTING = /sea opens on the authored narrative cue/i;
/** Route sections beyond this x wait for the crossing cue. */
const FAR_SHORE_X = 2400;
const GUST_PUSH_UNITS = 3;
const SAFE_X = 80, MIDDLE_X = 1850, ROUTE_END_X = 3650;

const EMPTY_TOMB_CARDS: [string, string][] = [
  ['Matthew 28', 'Matthew describes the opened tomb, the announcement to the women and the message about meeting in Galilee.'],
  ['Mark 16:1–8', 'Mark describes the women arriving at the tomb and receiving the announcement that Jesus has risen; the passage ends with fear and amazement.'],
  ['Luke 24', 'Luke describes the women at the tomb, the announcement by two men and their report to the apostles.'],
  ['John 20', 'John describes Mary Magdalene at the tomb and the visits of Peter and the other disciple. Mary’s encounter is told in this account.'],
];

export function createCampaign(S: Engine, content: Content) {
  const levels = content.campaign.levels;

  const spec = (level: Level): LevelSpec => LEVEL_SPECS[level.number - 1];

  /** Long side-scrolling archive route used by noncombat scenes. */
  function routeMap(level: Level): MapDef {
    const quiet = level.kind === 'witness';
    const base = {
      id: 'story_' + level.id, name: level.location,
      main: { id: 'floor0', kind: 'solid', rectUnits: [-120, -120, 1260, 200], wallRecoverable: true },
      platforms: [] as MapDef['platforms'],
      blastBoundsUnits: { minX: -400, maxX: 4180, minY: -600, maxY: 950 },
      spawnFeetUnits: [[80, 82], [160, 82]], pickupSpawnUnits: [[200, 160], [1800, 160], [3100, 160]],
    } as unknown as MapDef;
    base.platforms.push(
      { id: 'floor1', kind: 'solid', rectUnits: [quiet ? 1140 : 1200, -120, quiet ? 1260 : 1200, 200], wallRecoverable: true },
      { id: 'floor2', kind: 'solid', rectUnits: [quiet ? 2400 : 2460, -120, quiet ? 1400 : 1340, 200], wallRecoverable: true },
    );
    if (!quiet) for (let n = 0; n < 6; n++) base.platforms.push({ id: 'ledge' + n, kind: 'oneWay', rectUnits: [400 + n * 500, 150 + (n % 2) * 50, 210, 16] });
    return base;
  }

  function create(levelId: string, difficulty = 'easy', checkpoint: Checkpoint | null = null): Scene {
    const level = levels.find(l => l.id === levelId);
    if (!level) throw new Error('Unknown level');
    const cfg = spec(level);
    const script = content.campaign.scripts?.find(sc => sc.id === level.id);
    const combat = level.combatEnabled && level.number !== GOLIATH_LEVEL;
    const arena = content.maps.maps[(level.chapter - 1) % 6];
    const world = S.create({
      mode: combat ? (level.kind === 'waves' ? 'story' : 'boss') : 'training',
      hero: level.number === GOLIATH_LEVEL ? 'david' : 'dru', inputId: 'keyboard', arena: arena.id, difficulty,
      waves: level.waves, waveEntries: script?.waveEntries, bossScript: BOSS_SCRIPTS[level.id], bossName: level.boss?.name, seed: checkpoint?.seed || 613891 + level.number,
    });
    const s: Scene = {
      version: 1, levelId, level, kind: level.kind, difficulty, phase: 'intro', tick: 0, stage: 'entry', done: [], carry: null,
      pendingCard: null, combatCleared: false, caption: script ? `${script.opening.speaker}: ${script.opening.text}` : 'Ken: Let’s follow the path together.', captionUntil: 240,
      seen: [...(checkpoint?.level === levelId ? checkpoint.seen ?? [] : [])],
      closingLine: script ? `${script.closing.speaker}: ${script.closing.text}` : 'Dru: We can keep going. Stay beside me.',
      water: null,
      wind: null,
      markers: [], hazards: [], companion: { x: 160 * Q, y: 82 * Q, following: true }, checkpointEvent: null, result: null,
      goliath: createGoliath(), sourceSummary: SUMMARIES[level.number - 1], config: cfg, world,
    };
    if (!combat) {
      world.fighters = world.fighters.slice(0, 1);
      world.map = routeMap(level);
      world.fighters[0].x = SAFE_X * Q;
      world.fighters[0].y = 82 * Q;
    }
    world.countdown = 60;
    // The far shore waits for the narrated crossing; the player never causes it.
    if (!combat && PARTING.test(level.uniqueRule)) {
      s.parted = world.map.platforms.filter(p => p.rectUnits[0] >= FAR_SHORE_X);
      world.map.platforms = world.map.platforms.filter(p => p.rectUnits[0] < FAR_SHORE_X);
    }
    // Level 1: platforms appear only after the narration beat.
    if (level.number === 1) {
      s.waitingPlatforms = world.map.platforms.filter(p => p.kind === 'oneWay');
      world.map.platforms = world.map.platforms.filter(p => p.kind !== 'oneWay');
    }
    const spread = combat ? 650 : 3200;
    for (let n = 0; n < cfg.count; n++) {
      const x = combat ? -330 + spread * (cfg.count === 1 ? 0.5 : n / (cfg.count - 1)) : 360 + (spread * (n + 0.5)) / cfg.count;
      const y = !combat && cfg.type === 'route' && level.number !== 75 ? (n % 2 === 0 ? 166 : 80) : 80;
      s.markers.push({
        id: n, x: Math.round(x) * Q, y: y * Q, type: cfg.type, label: cfg.label + ' ' + (n + 1), stage: 0, done: false, carried: false, dropped: false,
        targetX: combat ? (180 + n * 45) * Q : Math.round(Math.min(3600, x + 190)) * Q,
      });
    }
    // The reenactment runs its own stages (goliath.ts); there are no task markers.
    if (level.number === GOLIATH_LEVEL) s.markers = [];
    if (level.number === 71) for (const m of s.markers) m.label = m.id < 5 ? 'Model loaf ' + (m.id + 1) : 'Model fish ' + (m.id - 4);
    if ([32, 36, 75].includes(level.number)) {
      const extra: TaskType = level.number === 75 ? 'route' : level.number === 36 ? 'escort' : 'building';
      for (let n = 0; n < 2; n++) {
        const label = extra === 'route' ? 'Observation climb ' + (n + 1) : extra === 'escort' ? 'Traveler gate ' + (n + 1) : 'Camp station ' + (n + 1);
        s.markers.push({ id: s.markers.length, x: (2800 + n * 350) * Q, y: (extra === 'route' ? 166 : 80) * Q, type: extra, label, stage: 0, done: false, carried: false, dropped: false, targetX: (3000 + n * 350) * Q });
      }
    }
    if (level.number === 80) {
      s.satchelClosed = false;
      s.markers[0].label = 'Close weapon satchel';
      s.markers[1].label = 'Listen to arrest context';
    }
    if (!combat && RISING_WATER.test(level.uniqueRule)) {
      // Easy gives 1.5x the surge warning; the surge itself is the same length on every setting.
      const tell = difficulty === 'easy' ? 135 : 90;
      s.water = { period: difficulty === 'extreme' ? 300 : 360, tell, active: 45, state: 'calm', ticksToSurge: 0 };
      // Latches sit on the upper ledges, above the surge line.
      const ledges = world.map.platforms.filter(p => p.kind === 'oneWay');
      s.markers.forEach((m, n) => {
        const ledge = ledges[Math.min(ledges.length - 1, 1 + n * 2)];
        if (!ledge) return;
        m.x = (ledge.rectUnits[0] + ledge.rectUnits[2] / 2) * Q;
        m.y = (ledge.rectUnits[1] + ledge.rectUnits[3]) * Q;
      });
    } else if (!combat && STORM.test(level.uniqueRule)) {
      s.wind = { period: difficulty === 'easy' ? 300 : difficulty === 'hard' ? 260 : 220, tell: difficulty === 'easy' ? 135 : 90, gust: 60, state: 'calm' };
    } else if (!combat && ['survival', 'escape', 'stealth'].includes(level.kind)) {
      for (let n = 0; n < 4; n++) {
        s.hazards.push({ id: n, x: (700 + n * 740) * Q, y: 80 * Q, period: difficulty === 'easy' ? 240 : difficulty === 'hard' ? 180 : 140, tell: difficulty === 'easy' ? 90 : 60, active: 30 });
      }
    }
    if (checkpoint && checkpoint.level === levelId && checkpoint.stage !== 'exit') {
      for (const idx of checkpoint.progress || []) if (s.markers[idx]) { s.markers[idx].done = true; s.done.push(idx); }
      s.combatCleared = !!checkpoint.combatCleared;
      s.stage = checkpoint.stage;
      if (s.combatCleared) { world.phase = 'playing'; world.fighters = world.fighters.slice(0, 1); world.mode = 'training'; }
      if (!combat && s.stage === 'middle_or_phase_two') { world.fighters[0].x = 1900 * Q; s.companion.x = 1780 * Q; }
    }
    return s;
  }

  function begin(s: Scene): void {
    if (s.phase !== 'intro') return;
    s.phase = 'active';
    if (s.waitingPlatforms) { s.world.map.platforms.push(...s.waitingPlatforms); s.waitingPlatforms = null; }
  }

  function pause(s: Scene, on = true): void {
    if (on && s.phase === 'active') { s.phase = 'paused'; S.pause(s.world, true); }
    else if (!on && s.phase === 'paused') { s.phase = 'active'; S.pause(s.world, false); }
  }

  function nearest(s: Scene): Marker | undefined {
    const f = s.world.fighters[0];
    return s.markers
      .filter(m => !m.done && !(s.level.number === 1 && m.id > s.done.length)
        && Math.abs((m.carried || (m.type === 'escort' && m.stage) ? m.targetX : m.x) - f.x) < 90 * Q && Math.abs(m.y - f.y) < 40 * Q)
      .sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x) || a.id - b.id)[0];
  }

  function checkpoint(s: Scene): void {
    s.stage = 'middle_or_phase_two';
    s.checkpointEvent = { level: s.levelId, stage: s.stage, progress: [...s.done], combatCleared: s.combatCleared, seed: Number(s.world.options.seed), seen: [...s.seen] };
  }

  function say(s: Scene, text: string, ticks: number): void {
    s.caption = text;
    s.captionUntil = s.tick + ticks;
  }

  function mark(s: Scene, m: Marker): void {
    if (m.done) return;
    m.done = true;
    m.carried = false;
    s.done.push(m.id);
    s.carry = null;
    s.world.fighters[0].carry = false;
    say(s, 'Checkpoint: ' + m.label + ' complete.', 180);
    if (s.done.length >= Math.ceil(s.markers.length / 2)) checkpoint(s);
  }

  function interact(s: Scene): void {
    const f = s.world.fighters[0];
    if (f.respawn || f.stun || f.action) return;
    const m = nearest(s);
    if (s.carry !== null) {
      const carried = s.markers[s.carry];
      if (Math.abs(f.x - carried.targetX) < 100 * Q) { mark(s, carried); return; }
      // Set down safely anywhere; it can be recovered.
      carried.carried = false; carried.dropped = true; carried.x = f.x; carried.y = f.y;
      s.carry = null; f.carry = false;
      say(s, 'Supply set down safely. Interact to recover it.', 180);
      return;
    }
    if (!m) return;
    if (m.type === 'carry' || m.type === 'building') {
      m.carried = true; m.stage = 1; s.carry = m.id; f.carry = true; f.action = null;
      say(s, 'Carry to the outlined station. Interact to set down or deliver.', 240);
      return;
    }
    if (m.type === 'escort') {
      if (!m.stage) { m.stage = 1; s.companion.following = true; say(s, 'Regroup: Ken will follow to the safe gate.', 200); return; }
      if (Math.abs(s.companion.x - f.x) < 180 * Q) mark(s, m);
      else say(s, 'Wait for Ken at the safe gate.', 160);
      return;
    }
    if (s.level.number === 80 && m.id === 0) s.satchelClosed = true;
    if (m.type === 'witness' || m.type === 'puzzle' || (m.type === 'route' && s.level.number === 1)) { s.pendingCard = m.id; return; }
    mark(s, m);
  }

  function card(s: Scene, index: number): Card | null {
    const m = s.markers[index];
    if (!m) return null;
    const seenId = `${s.levelId}:${index}`;
    if (!s.seen.includes(seenId)) s.seen.push(seenId);
    let text = s.sourceSummary, heading = m.label;
    if (s.level.number === 84) [heading, text] = EMPTY_TOMB_CARDS[index];
    const labels = s.level.number === 1 ? ['Light', 'Sky', 'Land and plants', 'Lights in the sky', 'Living creatures', 'Humanity and rest']
      : s.level.number === 3 ? ['Goodness and trust', 'Broken choice', 'Life outside the garden']
      : ['Observe the account', 'Connect the context', 'Follow the account’s order', 'Remember the source'];
    return {
      heading, text, reference: s.level.scripture,
      label: PARABLE_LEVELS.includes(s.level.number) ? 'Parable context' : 'Bible account — original summary',
      puzzle: m.type === 'puzzle',
      choices: [labels[index % labels.length], labels[(index + 1) % labels.length], labels[(index + 2) % labels.length]],
      answer: 0,
      prompt: 'Select the panel for step ' + (index + 1) + ': ' + labels[index % labels.length],
    };
  }

  /** Puzzle retries are free: a wrong answer never costs progress. */
  function resolveCard(s: Scene, answer = 0): boolean {
    const idx = s.pendingCard;
    if (idx === null) return false;
    const c = card(s, idx)!;
    if (c.puzzle && answer !== c.answer) { say(s, 'Try the panel again. There is no penalty.', 180); return false; }
    mark(s, s.markers[idx]);
    s.pendingCard = null;
    return true;
  }

  function complete(s: Scene): void {
    if (s.phase === 'complete') return;
    s.phase = 'complete';
    s.result = { won: true, level: s.levelId, next: s.level.nextLevel };
    s.caption = s.closingLine;
    checkpoint(s);
    s.checkpointEvent!.stage = 'exit';
    s.stage = 'exit';
  }

  const safeX = (s: Scene) => (s.stage === 'middle_or_phase_two' ? MIDDLE_X : SAFE_X) * Q;

  function step(s: Scene, frame: InputFrame = {}): void {
    if (s.phase !== 'active' || s.pendingCard !== null) return;
    s.tick++;
    s.checkpointEvent = null;
    const f = s.world.fighters[0];
    const priorRespawn = f.respawn;
    const i = S.input(frame);
    if (!s.level.combatEnabled || s.combatCleared || s.level.number === GOLIATH_LEVEL) { i.light = i.heavy = i.item = false; i.heavyHeld = false; }
    // Witness scenes: walking only.
    if (s.kind === 'witness') { i.jump = i.dodge = false; i.y = 0; }
    // Carrying disables attacks until set down.
    if (f.carry) { i.light = i.heavy = i.item = false; }
    S.step(s.world, { [f.id]: i });
    // Every boss tell is captioned, so no warning depends on colour or animation alone.
    for (const e of s.world.events) {
      if (e.type === 'bossTell' && e.caption) say(s, String(e.caption), 90);
      if (e.type === 'bossOpening') say(s, 'Opening! The boss is recovering.', Number(e.ticks) || 30);
      if (e.type === 'arrivalCue') say(s, `Arrival marked: ${String(e.role).replace(/_/g, ' ')}.`, 90);
    }
    if (priorRespawn === 1 && !s.level.combatEnabled) { f.x = (s.stage === 'middle_or_phase_two' ? 1850 : 80) * Q; f.y = 82 * Q; f.vx = f.vy = 0; }
    if (f.respawn && s.carry !== null) {
      const m = s.markers[s.carry];
      m.carried = false; m.dropped = true; m.x = safeX(s); m.y = 80 * Q;
      s.carry = null; f.carry = false;
    }
    if (s.world.phase === 'result') {
      if (!s.world.result!.won) { s.phase = 'failed'; s.result = { won: false, reason: s.world.result!.reason }; return; }
      s.combatCleared = true;
      s.world.phase = 'playing'; s.world.result = null; s.world.mode = 'training';
      s.world.fighters = s.world.fighters.slice(0, 1); s.world.projectiles = [];
      checkpoint(s);
      say(s, 'Training encounter cleared. Finish the marked archive task.', 240);
    }
    // Companion follows at a fixed spacing and never takes damage.
    const distance = f.x - s.companion.x, maxSpeed = 5 * Q;
    s.companion.x += Math.max(-maxSpeed, Math.min(maxSpeed, distance - (distance > 0 ? 100 : -100) * Q));
    s.companion.y = f.ground ? f.y : s.companion.y;
    if (s.kind === 'witness') { s.companion.x = f.x - 80 * Q; s.companion.y = f.y; }
    if (s.water) {
      const w = s.water, phase = s.tick % w.period, surgeAt = w.period - w.active;
      w.state = phase >= surgeAt ? 'high' : phase >= surgeAt - w.tell ? 'rising' : 'calm';
      w.ticksToSurge = w.state === 'rising' ? surgeAt - phase : 0;
      if (w.state === 'rising' && phase === surgeAt - w.tell) say(s, 'The water is rising — climb to a ledge or jump as it surges.', w.tell);
      const onFloor = !!f.ground && s.world.map.platforms.concat(s.world.map.main).some(p => p.id === f.ground && p.kind === 'solid');
      if (w.state === 'high' && onFloor) {
        f.x = safeX(s); f.y = 82 * Q; f.vx = f.vy = 0;
        say(s, 'Swept back to the safe deck. No progress lost.', 180);
      }
    }
    if (s.kind === 'exploration' && s.tick % 240 === 1 && s.tick > s.captionUntil) {
      const next = s.markers.find(m => !m.done);
      if (next) say(s, `Listen: the river sounds are ${next.x > f.x ? 'to the right' : 'to the left'}.`, 150);
    }
    if (s.wind) {
      const w = s.wind;
      if (s.done.length === s.markers.length) {
        if (w.state !== 'over') { w.state = 'over'; say(s, 'The account tells of the storm being stilled. The deck is calm.', 220); }
      } else {
        const phase = s.tick % w.period, gustAt = w.period - w.gust;
        w.state = phase >= gustAt ? 'gust' : phase >= gustAt - w.tell ? 'warning' : 'calm';
        if (phase === gustAt - w.tell) say(s, 'A gust is coming — hold Down to brace, or keep to the middle of the deck.', w.tell);
        // A headwind slows grounded walkers but never pushes anyone off their footing.
        const footing = [s.world.map.main, ...s.world.map.platforms].find(p => p.id === f.ground);
        if (w.state === 'gust' && footing && i.y >= 0) {
          const minX = (footing.rectUnits[0] + 30) * Q;
          if (f.x - GUST_PUSH_UNITS * Q > minX) f.x -= GUST_PUSH_UNITS * Q;
        }
      }
    }
    if (s.parted && s.done.length >= 1) {
      s.world.map.platforms.push(...s.parted);
      s.parted = null;
      say(s, 'The account describes the sea opening. The far route is now in place.', 240);
    }
    if (!s.water && !s.wind && (s.kind === 'survival' || s.kind === 'escape' || s.kind === 'stealth')) {
      for (const h of s.hazards) {
        const phase = s.tick % h.period;
        h.state = phase < h.tell ? 'tell' : phase < h.tell + h.active ? 'active' : 'safe';
        if (h.state === 'active' && Math.abs(f.x - h.x) < 45 * Q && f.y < 150 * Q && !(s.kind === 'stealth' && i.y < 0)) {
          f.x = Math.max(80 * Q, safeX(s)); f.y = 82 * Q; f.vx = f.vy = 0;
          say(s, s.kind === 'stealth' ? 'Seen by an archive lookout. Return to the safe route.' : 'Obstacle touched. Back to the safe checkpoint.', 180);
        }
      }
    }
    if (s.level.number === GOLIATH_LEVEL) {
      stepGoliath(s.goliath, f, s.tick, i.interact, s.difficulty, { say: (text, ticks) => say(s, text, ticks), complete: () => { s.combatCleared = true; complete(s); } });
      return;
    }
    if (i.interact) interact(s);
    if (!s.level.combatEnabled) s.combatCleared = true;
    if (s.level.number === GOLIATH_LEVEL) s.combatCleared = false;
    if (s.done.length === s.markers.length && s.combatCleared) {
      const returnRoute = RETURN_ROUTE_LEVELS.includes(s.level.number);
      const exit = returnRoute ? 120 * Q : s.level.combatEnabled ? 350 * Q : ROUTE_END_X * Q;
      if (returnRoute ? f.x <= exit : f.x >= exit) {
        if (s.kind === 'witness' || s.level.number >= 79) complete(s);
        else if (i.interact) complete(s);
      }
    }
    if (f.x > 1800 * Q && !s.level.combatEnabled && s.stage === 'entry') checkpoint(s);
    if (f.respawn) {
      f.stocks = 3;
      if (f.respawn === 1) { f.x = safeX(s); f.y = 82 * Q; }
    }
  }

  return { create, begin, pause, step, spec, card, resolveCard, interact, mark, complete };
}

export type CampaignApi = ReturnType<typeof createCampaign>;
