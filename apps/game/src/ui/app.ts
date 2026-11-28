// @ts-nocheck -- legacy menu layer ported as-is; strict typing arrives with the Phase 4 menu rewrite.
// Menu flow, game screens and the display loop. Owns DOM wiring only: the
// simulation and campaign are driven exclusively through their public APIs.

import type { Content } from '../../../../packages/content/src/index.ts';
import type { Engine } from '../../../../packages/sim/src/index.ts';
import { createProfiles, DEFAULT_BINDINGS } from '../storage/profile.ts';
import { ReplayLibrary } from '../storage/replays.ts';
import { GameAudio } from '../audio/audio.ts';
import { Renderer } from '../render/renderer.ts';
import { paintArenaPreview } from '../render/arena-scenes.ts';
import { damageColor } from '../render/feedback.ts';
import { dangerDamage } from '../../../../packages/sim/src/danger.ts';
import { playerGlyph } from '../render/player-marks.ts';
import type { RuntimeArt } from '../render/renderer.ts';
import { Inputs, missingControllers } from '../input/inputs.ts';
import { rebind } from '../input/keymap.ts';
import { FixedStepRunner } from '../runner.ts';
import { ComboTracker, InputHistory } from '../training/combo.ts';
import { MenuNavigator, bindArrowKeys } from '../input/menu-nav.ts';
import { Lesson } from '../training/lesson.ts';
import { DRILLS, DrillRun } from '../training/drills.ts';
import { buildRoster, CPU_INPUT, ReadyBoard } from './lobby.ts';
import { presentResult } from './results.ts';
import { moveShowcase } from './move-showcase.ts';
import { prepareRival, rivalPortrait } from '../render/story-rivals.ts';
import {
  DAVID_CHAPTER,
  DAVID_FIGHTS,
  storyRival,
  davidFightOptions,
  withChapterOpponent,
} from '../../../../packages/campaign/src/david-fights.ts';

import { MOSES_PARTS, mosesFightOptions } from '../../../../packages/campaign/src/moses.ts';
import { mosesCinematic } from './moses-cinematic.ts';

export function startApp(C: Content, S: Engine, art: RuntimeArt): void {
  const root: any = globalThis;
  const $ = (id: string) => document.getElementById(id) as any;

  // ------------------------------------------------------------------------------
  // Shared state: the save profile, replay library, audio, the current match (world) and input.
  // ------------------------------------------------------------------------------
  /** Make an HTML element with optional text and CSS class. */
  const el = (tag: string, text = '', cls = '') => {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  /** Browser storage, or null when the browser blocks it (the game then plays from memory). */
  let localStorageAdapter: any = null;
  try {
    localStorageAdapter = window.localStorage;
  } catch (e) {}
  /** Saved replays (the 20 newest plus pinned ones), the save profile (`store`) and the player's settings. First launch picks sensible defaults from the device. */
  const replayLibrary = new ReplayLibrary(localStorageAdapter);
  const Profiles = createProfiles(C);
  const store = new Profiles.Store(localStorageAdapter),
    settings = store.data.settings;
  if (!store.data.controlChecked) {
    settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    settings.input = matchMedia('(pointer:coarse)').matches ? 'touch' : 'keyboard';
  }
  /** Sound effects and music (generated in code; see audio/audio.ts) and the canvas renderer. */
  const audio = new GameAudio(),
    renderer = new Renderer($('arena'), S, art);
  let newJourney = false;
  let storyRoute = store.data.storyHero,
    mosesEndingShown = false,
    mosesEndingPlaying = false;
  let world: any = null,
    currentScreen = 'home',
    selectedHero = 'david',
    tutorial = false,
    tutorialFinished = false,
    resultShown = false,
    inputNext: any = null,
    inputFromGame = false,
    infoResume = false,
    lastTime = 0,
    hudTick = -1,
    lastReplay: any = null,
    replayRecord: any = null,
    replayPlayback: any = null,
    replayIndex = 0,
    returnFocus: any = null,
    lastControllerUpdate = 0;
  const inputs = new Inputs(settings, () => pause('Take a breath.'));
  inputs.bindTouch($('touch-layer'));

  // ------------------------------------------------------------------------------
  // Screens and dialogs: switching between menu screens and opening or closing pop-ups.
  // ------------------------------------------------------------------------------
  /** Read a message out to screen readers through the hidden live region. */
  function announce(text: string) {
    $('announcements').textContent = text;
  }
  /** Close every open pop-up dialog. */
  function closeDialogs() {
    document.querySelectorAll('dialog[open]').forEach((d: any) => d.close());
  }
  /** Open a pop-up dialog and focus its first control; focus returns where it was on close. */
  function open(d: any) {
    returnFocus = document.activeElement;
    d.showModal();
    d.querySelector('button,input,select')?.focus();
  }
  /** Close one dialog and put keyboard focus back where it was. */
  function close(d: any) {
    d.close();
    if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus();
  }
  function screen(name: string) {
    const previousScreen = currentScreen;
    closeDialogs();
    audio.stopMusic();
    for (const section of document.querySelectorAll('#screens > .screen'))
      (section as HTMLElement).hidden = section.id !== name;
    currentScreen = name;
    $('header').hidden = name === 'game';
    $('footer').hidden = name === 'game';
    document.querySelectorAll('nav button').forEach((b: any) => b.classList.toggle('current', b.dataset.nav === name));
    if (name !== 'game') {
      inputs.active = false;
      world = null;
      tutorial = false;
      replayPlayback = null;
      audio.suspend();
    }
    window.scrollTo(0, 0);
    if (name === 'home' || name === 'story-menu') updateHome();
    if (name === 'modes') {
      const choice = previousScreen === 'setup' ? 'quick' : previousScreen === 'local' ? 'local' : 'story';
      $('mode-' + choice).focus({ preventScroll: true });
    }
    // ------------------------------------------------------------------------------
    // Settings and the first-time control check.
    // ------------------------------------------------------------------------------
    if (name === 'story-fights') renderFights();
    if (name === 'settings') {
      renderSettings();
      renderReplayLibrary();
    }
    announce(name === 'home' ? 'Biblhalla home' : name + ' screen');
  }
  function updateHome() {
    const total = store.data.davidWins + store.data.mosesWins;
    $('home-progress').textContent = total
      ? store.data.davidWins + ' / 5 David · ' + store.data.mosesWins + ' / 5 Moses'
      : '';
    const ongoing = store.data.storyPart !== null;
    $('home-continue').hidden = !ongoing;
    $('story-continue').hidden = !ongoing;
    $('home-continue').textContent = 'Continue';
    $('footer-save').textContent = store.status;
  }
  function applySettings() {
    document.documentElement.style.setProperty('--touch-size', settings.touchSize + 'px');
    document.documentElement.style.setProperty('--touch-opacity', settings.touchOpacity);
    document.documentElement.style.setProperty('--ui-scale', settings.uiScale);
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    $('touch-layer').classList.toggle('left-handed', settings.leftHanded);
    renderer.reduced = settings.reducedMotion;
    renderer.feedback.shakeOn = settings.screenShake;
    renderer.feedback.flashOn = settings.flashes;
    audio.mute = settings.mute;
    audio.setMusic(settings.music);
  }
  function gate(next: any) {
    if (!store.data.controlChecked) {
      chooseInput(() => startTutorial(next));
    } else next();
  }
  /** Open the input-method dialog (keyboard, touch or controller), then run `next`. */
  function chooseInput(next: any = null) {
    inputNext = next;
    inputFromGame = !!world;
    document.querySelectorAll('input[name=input-method]').forEach((r: any) => (r.checked = r.value === settings.input));
    open($('input-dialog'));
    updateControllers();
  }
  /** Show controller status in the input dialog, and pause the match if a player's controller is unplugged. */
  function updateControllers() {
    const pads = inputs.pads(),
      radio = document.querySelector('input[name=input-method]:checked') as HTMLInputElement;
    const ready = pads.find((p: any) => inputs.padSeen.has(p.index));
    $('controller-status').textContent =
      radio?.value === 'controller'
        ? ready
          ? 'Controller ready: ' + ready.id
          : 'Connect a controller and press a button to test it.'
        : 'Ready for ' + (radio?.value || 'keyboard') + '.';
    $('confirm-input').disabled = radio?.value === 'controller' && !ready;
    if (
      world &&
      missingControllers(
        world.fighters,
        pads.map((p: any) => p.index),
      ).length
    )
      pause('Controller disconnected');
  }
  /** The input device id for player 1, based on the chosen input method. */
  function currentInputId() {
    if (settings.input === 'controller') {
      const p = inputs.pads().find((p: any) => inputs.padSeen.has(p.index));
      return p ? 'pad:' + p.index : 'unavailable';
    }
    return settings.input;
  }
  // Training instrumentation: combo/escape-gap tracker and input history (read-only).

  // ------------------------------------------------------------------------------
  // Starting and running matches: arena battles, training, the tutorial, pause and resume.
  // ------------------------------------------------------------------------------
  /** Training aids: combo counter and input history for the Details overlay. */
  let comboTracker: ComboTracker | null = null,
    inputHistory = new InputHistory();
  /** Feed each training tick into the combo counter and input history. */
  function observeTraining(frames: any) {
    if (world?.mode !== 'training') return;
    const p = world.fighters[0],
      d = world.fighters[1];
    if (!d) return;
    if (!comboTracker || comboTracker.defenderId !== d.id) comboTracker = new ComboTracker(p.id, d.id);
    comboTracker.observe(world);
    inputHistory.record(world.tick, frames[p.inputId]);
    renderer.training = { combo: comboTracker.report, history: inputHistory.entries };
  }
  /** Which arena arrangement to play: the arena itself, or the chapter's arena for story routes. */
  function arenaMusic(w: any, chapter = 0) {
    const i = C.maps.maps.findIndex((m: any) => m.id === w.map?.id);
    return i >= 0 ? i : (chapter - 1 + 6) % 6;
  }
  /** Start an arena match, training session or wave/boss challenge from options. */
  function startGame(options: any) {
    if (!options.fighters && currentInputId() === 'unavailable') {
      chooseInput(() => startGame(options));
      return;
    }
    $('caption').textContent = '';
    comboTracker = null;
    inputHistory = new InputHistory();
    renderer.training = null;
    $('tutorial-skip').hidden = true;
    drill = null;
    closeDialogs();
    tutorial = false;
    world = S.create({ ...options, inputId: options.inputId || currentInputId() });
    audio.startMusic(arenaMusic(world));
    resultShown = false;
    mosesEndingShown = false;
    mosesEndingPlaying = false;
    audio.last = 0;
    replayPlayback = null;
    replayRecord = { schema: 1, contentHash: C.hash, initial: S.snapshot(world), entries: [], finalHash: null };
    showGame();
    updateHud();
    $('game-title').textContent =
      options.mode === 'training'
        ? 'Training ground'
        : options.mode === 'waves'
          ? 'Wave challenge'
          : options.mode === 'boss'
            ? 'Champion encounter'
            : 'Arena exhibition';
    $('objective').textContent =
      options.mode === 'training'
        ? 'Practice safely. Open Details to inspect timing and resources.'
        : options.mode === 'waves'
          ? options.endless
            ? 'Endless survival · giant boss every 5 waves · recover 25 damage between waves.'
            : 'Clear three waves. Protect your lives.'
          : options.mode === 'boss'
            ? 'Build damage and launch the champion out of the arena.'
            : 'Build damage. Knock opponents out. Stay on the arena.';
  }
  function showGame() {
    for (const section of document.querySelectorAll('#screens > .screen'))
      (section as HTMLElement).hidden = section.id !== 'game';
    currentScreen = 'game';
    $('header').hidden = $('footer').hidden = true;
    inputs.clear();
    inputs.active = true;
    audio.unlock();
    runner.reset();
    hudTick = -1;
    $('arena').focus({ preventScroll: true });
    $('touch-layer').hidden = settings.input !== 'touch' && !world.fighters.some((f: any) => f.inputId === 'touch');
    $('hud').hidden = false;
    $('game-context').hidden = world.mode === 'training';
    $('training-details').hidden = world.mode !== 'training';
    $('training-reset').hidden = world.mode !== 'training';
    for (const id of ['training-speed-wrap', 'training-freeze', 'training-step'])
      $(id).hidden = world.mode !== 'training';
    trainingFrozen = false;
    trainingSpeed = 1;
    $('training-speed').value = '1';
    $('training-freeze').textContent = 'Freeze';
    $('training-step').disabled = true;
    $('training-bot-wrap').hidden = world.mode !== 'training';
    $('training-bot').value = world.trainingBot || 'idle';
    $('input-hint').textContent =
      settings.input === 'keyboard'
        ? 'W Up/Jump · A D Move · S Down · J Light · K Heavy · Shift Dash/Dodge · L Pickup · E Interact · 0-3 Emotes · Esc Pause'
        : settings.input === 'touch'
          ? 'Move with the stick. Aim while pressing an action.'
          : 'Stick Move · South Jump · West Light · North Heavy · East Dodge · R1 Pickup · L1 Interact';
  }
  function startTutorial(next: any = null) {
    startGame({ mode: 'training', hero: 'david', trainingBot: 'stand' });
    tutorial = true;
    lesson = new Lesson();
    inputNext = next;
    world.fighters[0].x = -80 * S.Q;
    $('game-title').textContent = 'First lesson';
    $('objective').textContent = 'Seven short steps. Each one completes when it actually works in the game.';
    $('caption').textContent = lesson.text;
    $('tutorial-skip').hidden = false;
  }
  /** End the first lesson, remember it is done, and show the results card. */
  function finishTutorial(reason: string) {
    tutorialFinished = true;
    store.data.controlChecked = true;
    store.save();
    tutorial = false;
    $('tutorial-skip').hidden = true;
    world.phase = 'result';
    world.result = { won: true, reason, ticks: world.tick };
    showResult();
  }
  /** Advance the first lesson when the player has really done the current step. */
  function checkTutorial(frames: any) {
    if (!tutorial || !lesson) return;
    lesson.observe(world);
    $('caption').textContent = lesson.progress + ' · ' + lesson.text;
    if (lesson.step === 'done')
      finishTutorial('Lesson complete. You know how to move, attack, dodge, recover and ring someone out.');
  }
  /** Pause the match (or story level): stop the simulation, clear held keys, open the pause menu. */
  function pause(reason = 'Take a breath.') {
    if (!world || world.phase === 'paused' || world.phase === 'result') return;
    {
      S.pause(world, true);
      replayRecord?.entries.push({ kind: 'pause', on: true });
    }
    inputs.active = false;
    inputs.clear();
    audio.suspend();
    $('pause-title').textContent = reason;
    $('pause-copy').textContent = 'The whole match is paused.';
    open($('pause-dialog'));
    announce('Game paused');
  }
  function resume() {
    if (!world) return;
    const required = world.fighters.filter((f: any) => f.human && f.inputId.startsWith('pad:'));
    if (required.some((f: any) => !inputs.pads().some((p: any) => 'pad:' + p.index === f.inputId))) {
      $('pause-title').textContent = 'Reconnect the assigned controller';
      return;
    }
    closeDialogs();
    {
      S.pause(world, false);
      replayRecord?.entries.push({ kind: 'pause', on: false });
    }
    inputs.clear();
    inputs.active = true;
    audio.unlock();
    runner.reset();
    $('arena').focus();
  }
  function retry() {
    if (world?.options.storyFight !== undefined && !replayPlayback) {
      if (world.options.mosesPart !== undefined) startMoses(world.options.mosesPart, true);
      else startFight(world.options.storyFight);
      return;
    }
    if (tutorial) {
      startTutorial(inputNext);
      return;
    }
    const opts = world.options;
    startGame(opts);
  }
  /** Stock-loss cues (13_Audio_VFX): the card flashes for a second when a life is lost; the last life is marked. */

  // ------------------------------------------------------------------------------
  // In-match HUD (the score bar) and the results card.
  // ------------------------------------------------------------------------------
  /** Remembers each fighter's starting lives and when they last lost one, for the HUD flash. */
  const hudStocks = new Map<number, { world: any; start: number; last: number; lostAt: number }>();
  /** Track one fighter's lives for this match (creates the record on first sight). */
  function hudEntry(f: any) {
    let e = hudStocks.get(f.id);
    if (!e || e.world !== world) {
      e = { world, start: f.stocks, last: f.stocks, lostAt: -1e9 };
      hudStocks.set(f.id, e);
    }
    if (f.stocks < e.last) e.lostAt = world.tick;
    e.last = f.stocks;
    return e;
  }
  /** How many lives this fighter started the match with (at least 3 dots are shown). */
  function hudStart(f: any) {
    return hudEntry(f).start;
  }
  /** True for about a second after this fighter lost a life. */
  function hudLost(f: any) {
    return world.tick - hudEntry(f).lostAt < 60;
  }
  function updateHud() {
    if (!world) return;
    if (world.options.endless)
      $('objective').textContent =
        'Wave ' +
        world.wave +
        ' · ' +
        world.difficulty +
        (world.wave % 5 === 0 ? ' · GIANT BOSS' : ' · Boss in ' + (5 - (world.wave % 5)) + ' waves') +
        (world.waveResting ? ' · Recovery: −25 damage' : ' · Survive by ring-out');
    const box = $('hud');
    box.replaceChildren();
    for (const f of world.fighters) {
      if (!f.stocks && !f.human) continue;
      const card = el('div', '', 'hud-card');
      if (world.mode === 'teams' || world.options.waveStyle === 'teams')
        card.append(el('small', f.waveEnemy ? 'Wave opponent' : 'Team ' + (f.team + 1)));
      card.append(
        el('b', (f.human ? playerGlyph(f.id) + ' P' + f.id + ' · ' : '') + f.name),
        el(
          'small',
          f.skin === 'kedar' || (f.guard !== null && storyRival(world.options.storyFight) === 'kedar')
            ? 'Curved blade'
            : f.skin === 'tiras' || (f.guard !== null && storyRival(world.options.storyFight) === 'tiras')
              ? 'Mace & shield'
              : f.skin?.startsWith('mage-')
                ? f.skin.slice(5) + ' staff'
                : f.weapon === 'unarmed'
                  ? 'Unarmed'
                  : f.weapon,
        ),
        (() => {
          const d = el('span', String(Math.floor(f.damage / 10)), 'damage');
          d.style.color = damageColor(dangerDamage(f));
          return d;
        })(),
        el(
          'span',
          '◆'.repeat(f.stocks) +
            '◇'.repeat(Math.max(0, hudStart(f) - f.stocks)) +
            ' · ' +
            (f.stocks ? f.stocks + (f.stocks === 1 ? ' life' : ' lives') : 'out'),
          'life',
        ),
      );
      if (f.redDamage) card.append(el('small', 'Red danger at ' + f.redDamage / 10 + ' damage · ring-out to defeat'));
      if ((world.options.storyFight ?? world.options.exhibitionOpponent) === 2 && f.guard !== null) {
        card.append(
          el(
            'small',
            f.guard > 0 ? 'Armor ' + Math.ceil(f.guard / 10) + ' / ' + Math.ceil(f.maxGuard / 10) : 'Armor broken',
          ),
        );
      }
      const lost = hudLost(f);
      if (lost) card.classList.add('stock-lost');
      if (f.stocks === 1 && hudStart(f) > 1) card.classList.add('last-life');
      if (!f.stocks) card.classList.add('eliminated');
      box.append(card);
    }
    const seconds = Math.max(0, Math.ceil(world.remaining / 60));
    const timer = el('div', Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'), 'timer');
    box.append(timer);
    $('touch-layer').querySelector('[data-action=item]').textContent =
      world.fighters[0].weapon === 'unarmed' ? 'Pickup' : 'Throw';
  }
  function showResult() {
    if (resultShown || mosesEndingPlaying) return;
    if (world.options.mosesPart === 4 && world.result?.won && !replayPlayback && !mosesEndingShown) {
      store.data.mosesWins = 5;
      store.data.storyPart = null;
      store.save();
      mosesEndingShown = true;
      mosesEndingPlaying = true;
      inputs.active = false;
      inputs.clear();
      const finish = () => {
        mosesEndingPlaying = false;
        showResult();
      };
      mosesCinematic(art, 4, true, settings.reducedMotion, finish, finish);
      return;
    }
    resultShown = true;
    inputs.active = false;
    inputs.clear();
    presentResult(
      world,
      art,
      fighterPortrait,
      replayPlayback
        ? S.hash(world) === replayPlayback.finalHash
          ? 'Replay verified'
          : 'Replay checksum differs'
        : undefined,
    );
    $('next-level').hidden = true;
    $('rematch').textContent =
      tutorialFinished && world.mode === 'training' ? 'Continue →' : world.result?.won ? 'Play again →' : 'Rematch →';
    if (replayRecord && world.options.mode !== 'training') {
      replayRecord.finalHash = S.hash(world);
      lastReplay = replayRecord;
      try {
        replayLibrary.add(
          replayRecord,
          (world.mode === 'duel' ? 'Duel' : world.mode) +
            ' · ' +
            world.fighters.map((f: any) => f.name).join(' vs ') +
            ' · ' +
            world.map.name,
        );
      } catch (e) {}
    }
    const fightIndex = world.options.storyFight;
    if (world.options.mosesPart !== undefined && !replayPlayback) {
      const part = world.options.mosesPart,
        won = world.result?.won;
      if (won) {
        store.data.mosesWins = Math.max(store.data.mosesWins, part + 1);
        store.data.storyPart = part < 4 ? part + 1 : null;
        store.save();
      }
      $('next-level').hidden = !won || part >= 4;
      $('next-level').textContent = part < 4 ? 'Next: ' + MOSES_PARTS[part + 1].title + ' →' : 'Chapter complete';
      $('rematch').textContent = won ? 'Replay battle' : 'Retry battle';
      if (won && part === 4) {
        $('result-outcome').textContent = 'Chapter complete';
        $('result-subtitle').textContent = 'Moses and Aaron stand victorious';
      }
    } else if (fightIndex !== undefined && !replayPlayback) {
      const won = world.result?.won;
      if (won) {
        store.data.davidWins = Math.max(store.data.davidWins, fightIndex + 1);
        store.data.storyPart = fightIndex < 4 ? fightIndex + 1 : null;
        store.save();
      }
      $('next-level').hidden = !won || fightIndex >= DAVID_CHAPTER.length - 1;
      $('next-level').textContent =
        won && fightIndex < DAVID_CHAPTER.length - 1
          ? 'Fight ' + DAVID_CHAPTER[fightIndex + 1].name + ' →'
          : 'Next fight';
      $('rematch').textContent = won ? 'Replay fight' : 'Retry fight';
    } else $('next-level').textContent = 'Next level →';
    open($('result-dialog'));
    $('result-dialog').querySelector('button:not([hidden])')?.focus();
    announce($('result-outcome').textContent + ' · ' + $('result-title').textContent);
  }
  const portraitOrder = [
    'samson',
    'david',
    'saul',
    'joshua',
    'deborah',
    'gideon',
    'jonathan',
    'moses',
    'esther',
    'miriam',
    'nehemiah',
    'caleb',
  ];

  // ------------------------------------------------------------------------------
  // Fighter roster and the Fighters page.
  // ------------------------------------------------------------------------------
  /** A fighter's portrait image (or a drawn stand-in) for menus. */
  function fighterPortrait(hero: string) {
    const portrait = el('span', '', 'champion-portrait');
    const index = portraitOrder.indexOf(hero);
    portrait.style.backgroundPosition = ((index % 4) * 100) / 3 + '% ' + Math.floor(index / 4) * 50 + '%';
    portrait.setAttribute('aria-hidden', 'true');
    return portrait;
  }
  /** Build the fighter picker for Quick battle. */
  function renderRoster() {
    const grid = $('roster-grid');
    grid.replaceChildren();
    function choice(id: string, name: string, description: string, portrait?: HTMLElement) {
      const label = el('label', '', 'fighter-choice');
      const radio = el('input') as HTMLInputElement;
      radio.type = 'radio';
      radio.name = 'hero';
      radio.value = id;
      radio.checked = id === selectedHero;
      radio.addEventListener('change', () => {
        selectedHero = id;
        updateSelected();
      });
      label.append(radio);
      if (portrait) label.append(portrait);
      label.append(el('b', name), el('small', description));
      grid.append(label);
    }
    for (const fighter of C.fighters.fighters) {
      choice(fighter.id, fighter.name, fighter.weaponPair.join(' / '), fighterPortrait(fighter.id));
    }
    choice('random', 'Random', 'From the match seed');
    updateSelected();
  }
  /** Show the chosen fighter's details next to the picker. */
  function updateSelected() {
    if (selectedHero === 'random') {
      $('selected-info').replaceChildren(
        el('h2', 'Random fighter'),
        el('p', 'Chosen from the match seed and shown before the countdown.'),
      );
      return;
    }
    const f = S.defs[selectedHero],
      box = $('selected-info');
    box.replaceChildren(fighterPortrait(f.id), el('h2', f.name), el('p', f.title));
    const stats = el('div', '', 'stat-line');
    for (const [key, val] of Object.entries(f.stats)) stats.append(el('span', key + ' ' + val));
    box.append(stats);
  }
  // ------------------------------------------------------------------------------
  // Story mode: David's chapter fights and context panels.
  // ------------------------------------------------------------------------------
  function renderFights() {
    $('story-david').setAttribute('aria-pressed', String(storyRoute === 'david'));
    $('story-moses').setAttribute('aria-pressed', String(storyRoute === 'moses'));
    $('story-chapter').textContent = storyRoute === 'moses' ? 'STORY MODE · CHAPTER TWO' : 'STORY MODE · CHAPTER ONE';
    $('story-heading').textContent = storyRoute === 'moses' ? 'Moses: The Calling' : 'David and Goliath';
    if (storyRoute === 'moses') {
      renderMosesFights();
      return;
    }
    const wins = store.data.davidWins,
      grid = $('fight-grid');
    $('fight-progress').textContent =
      wins + ' of ' + DAVID_CHAPTER.length + ' fights won · Chapter One + 2 original rival trials';
    $('fight-difficulty').value = settings.difficulty;
    $('fight-continue').textContent = newJourney
      ? 'New game as David →'
      : wins >= DAVID_CHAPTER.length
        ? 'Replay journey →'
        : 'Fight as David →';
    grid.replaceChildren();
    DAVID_CHAPTER.forEach((fight, index) => {
      if (index === 3) {
        const heading = el('div', '', 'rival-chapter-heading');
        heading.append(
          el('h2', 'The road beyond Elah'),
          el('p', 'Two original story trials. Read the windup, evade the strike, and punish the recovery.'),
        );
        grid.append(heading);
      }
      const button = el('button', '', 'level-card') as HTMLButtonElement;
      button.disabled = index > wins;
      const rival = storyRival(index);
      if (rival) {
        const portrait = rivalPortrait(rival, art.images);
        portrait.className = 'rival-preview';
        button.append(portrait);
      }
      button.append(
        el(
          'small',
          'PART ' +
            fight.part +
            ' · ' +
            (index >= 3 ? 'ORIGINAL RIVAL TRIAL' : index === 2 ? 'BOSS' : 'FIGHT ' + (index + 1)),
        ),
        el('h2', fight.name),
        el('p', fight.intro),
        el(
          'span',
          index < wins
            ? 'Won · replay'
            : button.disabled
              ? 'Defeat ' + DAVID_CHAPTER[index - 1].name + ' to unlock'
              : 'Enter fight →',
        ),
      );
      if (rival) {
        button.append(el('p', [...new Set(fight.phases.flat().map(move => move.name))].join(' · '), 'rival-moves'));
        button.append(el('small', '2 lives · ring-outs only · story opponent'));
      }
      button.addEventListener('click', () => startFight(index));
      grid.append(button);
    });
  }
  function renderMosesFights() {
    const wins = store.data.mosesWins,
      grid = $('fight-grid');
    grid.replaceChildren();
    $('fight-progress').textContent = wins + ' of 5 parts complete · Moses and the road to Egypt';
    $('fight-difficulty').value = settings.difficulty;
    $('fight-continue').textContent = newJourney
      ? 'New game as Moses →'
      : wins >= 5
        ? 'Replay Moses journey →'
        : 'Continue as Moses →';
    MOSES_PARTS.forEach((part, index) => {
      const b = el('button', '', 'level-card moses-level-card');
      b.disabled = index > wins;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 220;
      canvas.className = 'moses-card-art';
      const image = art.images['moses-arenas'];
      const draw = () => {
        if (!image?.naturalWidth) return;
        const cw = image.naturalWidth / 2,
          ch = image.naturalHeight / 3;
        canvas
          .getContext('2d')
          .drawImage(image, (index % 2) * cw + 2, Math.floor(index / 2) * ch + 2, cw - 4, ch - 4, 0, 0, 640, 220);
      };
      if (image?.complete) draw();
      else image?.addEventListener('load', draw, { once: true });
      b.append(
        canvas,
        el('small', 'PART ' + String(index + 1).padStart(3, '0') + (index === 4 ? ' · FINAL BOSS' : '')),
        el('h2', part.title),
        el('p', part.map),
        el('p', part.objective),
        el(
          'span',
          index < wins ? 'Complete · replay' : b.disabled ? 'Complete the previous part to unlock' : 'Begin story →',
        ),
      );
      b.onclick = () => startMoses(index);
      grid.append(b);
    });
  }
  function startMoses(index: number, skipIntro = false) {
    if (index > store.data.mosesWins || !MOSES_PARTS[index]) return;
    if (currentInputId() === 'unavailable') {
      chooseInput(() => startMoses(index, skipIntro));
      return;
    }
    storyRoute = 'moses';
    store.data.storyHero = 'moses';
    store.data.storyStarted = true;
    store.data.storyPart = index;
    store.save();
    closeDialogs();
    const begin = () => {
      startGame(mosesFightOptions(index, settings.difficulty, currentInputId()));
      $('game-title').textContent = 'Part ' + String(index + 1).padStart(3, '0') + ' · ' + MOSES_PARTS[index].title;
      $('objective').textContent = MOSES_PARTS[index].objective;
    };
    if (skipIntro) {
      begin();
      return;
    }
    world = null;
    inputs.active = false;
    screen('story-fights');
    mosesCinematic(art, index, false, settings.reducedMotion, begin, () => screen('story-fights'));
  }
  /** Start one of David's chapter fights. */
  function startFight(index: number) {
    if (index > store.data.davidWins || !DAVID_CHAPTER[index]) return;
    if (currentInputId() === 'unavailable') {
      chooseInput(() => startFight(index));
      return;
    }
    storyRoute = 'david';
    store.data.storyHero = 'david';
    store.data.storyStarted = true;
    store.data.storyPart = index;
    store.save();
    const fight = DAVID_CHAPTER[index];
    const rival = storyRival(index);
    if (rival) prepareRival(rival, art.images);
    startGame(davidFightOptions(index, settings.difficulty, currentInputId()));
    $('game-title').textContent = 'Part ' + fight.part + ' · David vs ' + fight.name;
    $('objective').textContent = 'Launch ' + fight.name + ' beyond the arena boundary.';
  }
  /** Continue David's fights from the next unbeaten one. */
  function resumeFights() {
    if (storyRoute === 'moses') {
      startMoses(store.data.storyPart ?? (store.data.mosesWins >= 5 ? 0 : store.data.mosesWins));
      return;
    }
    startFight(store.data.storyPart ?? (store.data.davidWins >= DAVID_CHAPTER.length ? 0 : store.data.davidWins));
  }
  // ------------------------------------------------------------------------------
  // Information dialogs: context, controls, move lists, and the fighter library.
  // ------------------------------------------------------------------------------
  function info(title: string, label: string, nodes: any[], resumeAfter = false) {
    $('info-dialog').classList.remove('controls-dialog');
    infoResume = resumeAfter;
    $('info-title').textContent = title;
    $('info-label').textContent = label;
    $('info-content').replaceChildren(...nodes);
    open($('info-dialog'));
  }
  function context() {
    if (!world) return;
    const wasRunning = world.phase === 'playing' || world.phase === 'countdown';
    if (wasRunning) pause('Context');
    const nodes: any[] = [];
    if (world.options.mosesPart !== undefined) {
      const part = MOSES_PARTS[world.options.mosesPart];
      nodes.push(
        el('h3', part.title),
        el('p', part.reference, 'reference'),
        el(
          'p',
          'A dramatic retelling with original arena battles. Pharaoh is a spectator; Moses is the playable hero.',
        ),
        el('p', part.objective),
      );
    } else if ((world.options.storyFight ?? world.options.exhibitionOpponent) !== undefined) {
      const index = world.options.storyFight ?? world.options.exhibitionOpponent;
      const fight = world.options.storyFight !== undefined ? DAVID_CHAPTER[index] : DAVID_FIGHTS[index];
      nodes.push(
        el('h3', fight.name),
        el(
          'p',
          index >= 3
            ? 'Original fictional encounter · David’s journey'
            : index === 2
              ? '1 Samuel 17:40–50'
              : '1 Samuel 17:34–37',
          'reference',
        ),
        el('p', fight.intro),
      );
    } else {
      nodes.push(
        el(
          'p',
          'This exhibition brings characters from different historical periods together in a fictional sporting setting. Arena meetings and moves are inventions. A victory does not express divine preference.',
          'context-note',
        ),
      );
      for (const f of world.fighters.slice(0, 2)) {
        const def = S.defs[f.hero];
        nodes.push(el('h3', def.name), el('p', def.scriptureReferences || ''), el('p', def.storyContext || ''));
      }
    }
    info('Story & context', 'BACKGROUND AND INVENTION', nodes, false);
  }
  /** Show the controls reference, using the player's current key bindings. */
  function controls() {
    const k = (a: string) => keyLabel(settings.bindings[a]);
    const groups = [
      [
        'Movement',
        [
          ['Move left / right', k('left') + ' / ' + k('right'), 'Left stick / D-pad'],
          ['Jump', k('jump'), 'South button'],
          ['Aim up', k('up'), 'Stick up'],
          ['Down / crouch', k('down'), 'Stick down'],
          ['Drop through thin platforms', 'Hold ' + k('down'), 'Hold stick down'],
        ],
      ],
      [
        'Combat',
        [
          ['Light attack', k('light'), 'West button'],
          ['Heavy / charge', k('heavy') + ' · hold / release', 'North button'],
          ['Dodge / dash', k('dodge'), 'East button'],
          ['Pickup / throw', k('item'), 'R1'],
          ['Drop weapon', k('down') + ' + ' + k('item'), 'Down + R1'],
          ['Interact / carry', k('interact'), 'L1'],
        ],
      ],
      [
        'Other',
        [
          ['Emotes', [0, 1, 2, 3].map(n => k('emote' + n)).join(' / '), '—'],
          ['Pause', 'Esc / P', 'Menu'],
        ],
      ],
    ];
    const panel = el('div', '', 'controls-panel'),
      tabs = el('div', '', 'controls-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Control device');
    const body = el('div', '', 'controls-body');
    const show = (device: string) => {
      body.replaceChildren();
      for (const button of tabs.children) {
        button.setAttribute('aria-selected', String(button.textContent === device));
      }
      if (device === 'Touch') {
        body.append(
          el('h3', 'Touch controls'),
          el(
            'p',
            'Move with the left stick. Use the labelled Jump, Light, Heavy, Dodge, Pickup and Interact buttons. Hold the stick down for down attacks.',
            'controls-help',
          ),
        );
        return;
      }
      const table = el('table', '', 'controls-table');
      const head = el('thead'),
        hr = el('tr');
      for (const label of ['Action', device === 'Keyboard' ? 'Key binding' : 'Controller binding'])
        hr.append(el('th', label));
      head.append(hr);
      table.append(head);
      for (const [title, rows] of groups) {
        const section = el('tbody'),
          heading = el('tr', '', 'controls-section'),
          cell = el('th', title);
        cell.colSpan = 2;
        heading.append(cell);
        section.append(heading);
        for (const [action, key, pad] of rows) {
          const row = el('tr'),
            name = el('th', action),
            value = el('td');
          name.scope = 'row';
          value.append(el('kbd', device === 'Keyboard' ? key : pad));
          row.append(name, value);
          section.append(row);
        }
        table.append(section);
      }
      body.append(table);
    };
    for (const device of ['Keyboard', 'Controller', 'Touch']) {
      const tab = el('button', device);
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.onclick = () => show(device);
      tabs.append(tab);
    }
    show('Keyboard');
    panel.append(
      tabs,
      body,
      el(
        'p',
        'Down + attack selects down moves. After a confirmed aerial Light, press Light during recovery for up to two follow-ups. Hold Heavy to charge; release to strike. Remap keys in Settings.',
        'controls-help',
      ),
    );
    info('Controls', 'OPTIONS / CONTROLS', [panel]);
    $('info-dialog').classList.add('controls-dialog');
  }
  /** Show a fighter's full move list for each of their weapons and unarmed. */
  function movesInfo(hero = selectedHero) {
    if (!S.defs[hero]) {
      info('Random fighter', 'MOVES', [el('p', 'Pick a specific fighter to see their moves.')]);
      return;
    }
    const demo = moveShowcase(S, art, hero, settings.reducedMotion);
    info(S.defs[hero].name, 'MOVE SHOWCASE', [demo.panel]);
    const dialog = $('info-dialog');
    dialog.classList.add('showcase-dialog');
    dialog.addEventListener(
      'close',
      () => {
        demo.dispose();
        dialog.classList.remove('showcase-dialog');
      },
      { once: true },
    );
  }
  /** Build the Fighters page: portraits, stats and move buttons. */
  function renderLibrary() {
    const grid = $('fighter-library');
    grid.replaceChildren();
    for (const f of C.fighters.fighters) {
      const card = el('article', '', 'fighter-profile');
      card.append(fighterPortrait(f.id), el('small', f.weaponPair.join(' / ')), el('h2', f.name), el('p', f.title));
      const movesButton = el('button', 'Moves'),
        contextButton = el('button', 'Context');
      movesButton.addEventListener('click', () => movesInfo(f.id));
      contextButton.addEventListener('click', () =>
        info(f.name + ' — context', 'BIBLE BACKGROUND · INVENTED MOVES', [
          el('p', f.scriptureReferences, 'reference'),
          el('p', f.storyContext),
          el(
            'p',
            'Arena weapons and actions are invented sporting moves, separate from the biblical account.',
            'context-note',
          ),
        ]),
      );
      card.append(movesButton, contextButton);
      grid.append(card);
    }
  }
  // ------------------------------------------------------------------------------
  // Settings screen: key remapping, save export and import.
  // ------------------------------------------------------------------------------
  function renderSettings() {
    for (const [id, key] of [
      ['mute', 'mute'],
      ['reduced-motion', 'reducedMotion'],
      ['left-handed', 'leftHanded'],
      ['charge-toggle', 'chargeToggle'],
      ['music', 'music'],
      ['screen-shake', 'screenShake'],
      ['flashes', 'flashes'],
    ])
      $(id).checked = settings[key];
    for (const [id, key] of [
      ['touch-size', 'touchSize'],
      ['touch-opacity', 'touchOpacity'],
      ['deadzone', 'deadzone'],
      ['ui-scale', 'uiScale'],
      ['caption-speed', 'captionSpeed'],
    ])
      $(id).value = settings[key];
    $('save-status').textContent = store.status;
    $('export-replay').disabled = !lastReplay;
    const box = $('bindings');
    box.replaceChildren();
    stopKeyCapture();
    for (const key of Object.keys(settings.bindings)) {
      const b = el('button');
      b.type = 'button';
      b.append(
        el('span', (key[0].toUpperCase() + key.slice(1)).replace(/(\d)$/, ' $1')),
        el('kbd', keyLabel(settings.bindings[key])),
      );
      b.addEventListener('click', () => {
        stopKeyCapture();
        b.textContent = 'Press a key for ' + key + ' (Esc cancels)';
        b.classList.add('capturing');
        const handler = (event: KeyboardEvent) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (event.repeat) return;
          if (event.code === 'Escape' && key !== 'pause') {
            renderSettings();
            return;
          }
          const r = rebind(settings.bindings, key, event.code);
          if (r.error) {
            b.textContent = r.error;
            return;
          }
          settings.bindings = r.bindings as typeof settings.bindings;
          store.save();
          renderSettings();
          $('binding-note').textContent = r.swappedWith
            ? keyLabel(event.code) +
              ' moved to ' +
              key +
              '; ' +
              r.swappedWith +
              ' now uses ' +
              keyLabel(settings.bindings[r.swappedWith]) +
              '.'
            : key + ' set to ' + keyLabel(event.code) + '.';
        };
        keyCapture = handler;
        window.addEventListener('keydown', handler, true);
      });
      box.append(b);
    }
    const restore = el('button', 'Restore default keys') as HTMLButtonElement;
    restore.type = 'button';
    restore.addEventListener('click', () => {
      settings.bindings = { ...DEFAULT_BINDINGS };
      store.save();
      renderSettings();
      $('binding-note').textContent = 'Default keys restored.';
    });
    box.append(restore, el('p', '', 'binding-note'));
    box.lastElementChild!.id = 'binding-note';
    box.lastElementChild!.setAttribute('aria-live', 'polite');
  }
  let keyCapture: ((e: KeyboardEvent) => void) | null = null;
  /** Stop waiting for a new key. */
  function stopKeyCapture() {
    if (keyCapture) window.removeEventListener('keydown', keyCapture, true);
    keyCapture = null;
  }
  /** A short readable name for a key code ("KeyW" becomes "W"). */
  function keyLabel(code: string) {
    return code
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Arrow/, 'Arrow ')
      .replace(/(Left|Right)$/, m => (code.startsWith('Arrow') ? m : ' ' + m[0]));
  }
  /** Save some text as a file on the player's device. */
  function download(text: string, name: string) {
    const blob = new Blob([text], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = el('a') as HTMLAnchorElement;
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  /** Download the save profile as a JSON file. */
  function exportSave() {
    download(store.export(), 'biblhalla-save.json');
  }
  // Lobby rules everyone readies against; any change clears every Ready.

  // ------------------------------------------------------------------------------
  // Local multiplayer lobby: seats, devices, rules and the Ready check.
  // ------------------------------------------------------------------------------
  /** Who in the lobby has pressed Ready; changing the rules clears it. */
  const readyBoard = new ReadyBoard();
  /** Read each lobby seat's fighter and input device. */
  function lobbySlots() {
    return Array.from($('local-players').children).map((slot: any) => ({
      hero: slot.querySelector('.local-hero').value,
      input: slot.querySelector('.local-input').value,
    }));
  }
  /** Read the lobby's match rules (mode, players, arena, lives, time). */
  function lobbyRules() {
    return {
      mode: $('local-mode').value,
      count: $('local-count').value,
      arena: $('local-arena').value,
      difficulty: $('local-difficulty').value,
      stocks: $('local-stocks').value,
      minutes: $('local-minutes').value,
      friendlyFire: $('friendly-fire').checked,
      seats: lobbySlots(),
    };
  }
  /** Show whether everyone in the lobby is ready. */
  function lobbyStatus() {
    const slots = lobbySlots();
    $('local-status').textContent = readyBoard.allReady(slots)
      ? 'Everyone is ready.'
      : 'Each player checks the rules, then presses Ready.';
  }
  /** Build the local multiplayer lobby seats. */
  function renderLocal() {
    const mode = $('local-mode').value;
    if (mode === 'teams' || mode === 'teams-waves') $('local-count').value = '4';
    if (mode === 'local' || mode === 'waves') $('local-count').value = '2';
    $('local-count').disabled = mode !== 'ffa' && mode !== 'ffa-waves';
    $('local-minutes').disabled = mode.includes('waves');
    $('local-minutes').parentElement.hidden = mode.includes('waves');
    $('friendly-fire').checked = false;
    $('local-rule-note').textContent = mode.includes('waves')
      ? 'Unlimited waves · giant boss every 5 · 25 damage healed between waves. ' +
        (mode === 'waves'
          ? 'Both seats are allies; a computer partner is supported.'
          : 'Outlast rival players or teams while fighting the wave. Play continues until all contenders are out.')
      : 'Players 1–2 are Team 1; players 3–4 are Team 2. Teammates cannot damage each other.';
    const count = Number($('local-count').value),
      grid = $('local-players');
    const previous = Array.from(grid.querySelectorAll('.player-slot')).map((slot: any) => ({
      hero: slot.querySelector('.local-hero').value,
      input: slot.querySelector('.local-input').value,
    }));
    grid.replaceChildren();
    const pads = inputs.pads();
    for (let n = 0; n < count; n++) {
      const card = el('div', '', 'player-slot');
      card.append(
        el(
          'h2',
          'Player ' +
            (n + 1) +
            (mode === 'teams' || mode === 'teams-waves'
              ? ' · Team ' + (Math.floor(n / 2) + 1)
              : mode === 'waves'
                ? ' · Allies'
                : ''),
        ),
      );
      const heroLabel = el('label', 'Fighter'),
        heroSelect = el('select', '', 'local-hero') as HTMLSelectElement;
      for (const f of C.fighters.fighters) {
        const opt = el('option', f.name) as HTMLOptionElement;
        opt.value = f.id;
        heroSelect.append(opt);
      }
      const randomOpt = el('option', 'Random (from match seed)') as HTMLOptionElement;
      randomOpt.value = 'random';
      heroSelect.append(randomOpt);
      heroSelect.value = previous[n]?.hero || C.fighters.fighters[n].id;
      heroLabel.append(heroSelect);
      if (heroSelect.value !== 'random') card.append(fighterPortrait(heroSelect.value));
      const inputLabel = el('label', 'Input'),
        inputSelect = el('select', '', 'local-input') as HTMLSelectElement;
      const blank = el('option', 'Choose a unique device') as HTMLOptionElement;
      blank.value = '';
      inputSelect.append(blank);
      const cpuOption = el('option', 'Computer player') as HTMLOptionElement;
      cpuOption.value = CPU_INPUT;
      inputSelect.append(cpuOption);
      if (n === 0)
        for (const id of ['keyboard', 'touch']) {
          const opt = el('option', id) as HTMLOptionElement;
          opt.value = id;
          inputSelect.append(opt);
        }
      for (const p of pads) {
        const opt = el(
          'option',
          'Controller ' + (p.index + 1) + (inputs.padSeen.has(p.index) ? ' · tested' : ' · press a button'),
        ) as HTMLOptionElement;
        opt.value = 'pad:' + p.index;
        opt.disabled = !inputs.padSeen.has(p.index);
        inputSelect.append(opt);
      }
      inputSelect.value =
        previous[n]?.input || (n === 0 ? (settings.input === 'touch' ? 'touch' : 'keyboard') : CPU_INPUT);
      inputLabel.append(inputSelect);
      const readyButton = el(
        'button',
        readyBoard.isReady(n) ? '✓ Ready' : 'Ready?',
        'ready-toggle',
      ) as HTMLButtonElement;
      readyButton.type = 'button';
      if (inputSelect.value === CPU_INPUT) {
        readyButton.textContent = 'Computer ready';
        readyButton.disabled = true;
      }
      readyButton.setAttribute('aria-pressed', String(readyBoard.isReady(n)));
      readyButton.addEventListener('click', () => {
        const on = readyBoard.toggle(n);
        readyButton.textContent = on ? '✓ Ready' : 'Ready?';
        readyButton.setAttribute('aria-pressed', String(on));
        lobbyStatus();
      });
      card.append(heroLabel, inputLabel, readyButton);
      grid.append(card);
    }
  }
  /** Start a local multiplayer match from the lobby. */
  function localSubmit(e: Event) {
    e.preventDefault();
    const mode = $('local-mode').value,
      slots = Array.from($('local-players').children).map((slot: any) => ({
        hero: slot.querySelector('.local-hero').value,
        input: slot.querySelector('.local-input').value,
      }));
    if (!readyBoard.allReady(slots)) {
      $('local-status').textContent = 'Every player must press Ready after the final rule change.';
      return;
    }
    const roster = buildRoster(
      mode,
      slots,
      (id: string) => inputs.pads().some((p: any) => 'pad:' + p.index === id && inputs.padSeen.has(p.index)),
      (h: string) => S.defs[h]?.name || h,
    );
    if (!roster.ok) {
      $('local-status').textContent = roster.message;
      return;
    }
    startGame({
      mode: mode.includes('waves') ? 'waves' : mode,
      endless: mode.includes('waves'),
      waveStyle: mode === 'ffa-waves' ? 'ffa' : mode === 'teams-waves' ? 'teams' : 'coop',
      arena: $('local-arena').value,
      difficulty: $('local-difficulty').value,
      fighters: roster.fighters,
      friendlyFire: $('friendly-fire').checked,
      stocks: Number($('local-stocks').value),
      matchMinutes: Number($('local-minutes').value),
    });
  }

  // ------------------------------------------------------------------------------
  // The game loop: one simulation tick, replays, drills and the per-frame display loop.
  // ------------------------------------------------------------------------------
  /** Play back one recorded entry of a replay; ends with a verified or mismatched result. */
  function tickReplay() {
    const entry = replayPlayback.entries[replayIndex++];
    if (!entry) {
      world.phase = 'result';
      world.result = {
        won: true,
        reason: 'Replay finished' + (S.hash(world) === replayPlayback.finalHash ? ' — checksum verified' : ''),
        ticks: world.tick,
      };
      showResult();
      return;
    }
    if (entry.kind === 'pause') S.pause(world, entry.on);
    else S.step(world, entry.frames);
  }
  /** Turns real time into exact 60 Hz simulation ticks (see runner.ts). */
  const runner = new FixedStepRunner();
  /** The first lesson in progress, if any. */
  let lesson: Lesson | null = null,
    drill: DrillRun | null = null;
  /** Start one of the advanced training drills. */
  function startDrill(id: string) {
    const def = DRILLS.find(d => d.id === id);
    if (!def) return;
    startGame({ mode: 'training', hero: 'david', trainingBot: 'stand' });
    drill = new DrillRun(def);
    def.setup?.(world);
    $('game-title').textContent = 'Lesson: ' + def.title;
    $('objective').textContent = def.goal;
    $('caption').textContent = drill.text;
  }
  /** Finish a drill when the player has really done it. */
  function checkDrill() {
    if (!drill || !world) return;
    if (drill.observe(world, S.P.fastFallCapQ, S.P.fallCapQ)) {
      const title = drill.drill.title;
      drill = null;
      world.phase = 'result';
      world.result = {
        won: true,
        reason: title + ' — done. Try it in a match, or pick another lesson.',
        ticks: world.tick,
      };
      showResult();
    } else $('caption').textContent = drill.text;
  }
  for (const d of DRILLS) {
    const b = el('button', d.title) as HTMLButtonElement;
    b.type = 'button';
    b.addEventListener('click', () => gate(() => startDrill(d.id)));
    $('drill-list').append(b);
  }
  $('tutorial-skip').addEventListener('click', () => {
    if (tutorial) finishTutorial('Lesson skipped. You can replay it any time from Learn.');
  });
  /** Training slow-motion: 1, 0.5 or 0.25 of normal speed (display time only). */
  let trainingSpeed = 1,
    trainingFrozen = false;
  /** One fixed simulation tick of whatever is running; false stops the batch. */
  function simTick(): boolean {
    const frames = inputs.readAll();
    renderer.capture(world);
    if (replayPlayback) tickReplay();
    else {
      S.step(world, frames);
      if (replayRecord && replayRecord.entries.length < 24000) {
        replayRecord.entries.push({ kind: 'input', frames });
        S.maybeCheckpoint(replayRecord, world);
      }
      checkTutorial(frames);
      checkDrill();
      observeTraining(frames);
    }
    audio.play(world.events);
    return !(world.phase === 'paused' || world.phase === 'result');
  }

  // Controller/arrow-key menu navigation whenever gameplay input is not active.
  const menuNav = new MenuNavigator();
  menuNav.onBack = () => {
    if (['setup', 'local', 'story-fights'].includes(currentScreen)) screen('modes');
    else if (currentScreen !== 'home' && currentScreen !== 'game') screen('home');
  };
  bindArrowKeys(() => !inputs.active);
  /** How long the final KO plays out before the results card (ms). */
  const RESULT_OUTRO_MS = 1300;
  let outroWorld: any = null,
    outroStart = 0;
  /** Called every display frame: advance the simulation, draw the game, update the HUD and results. */
  function frame(now: number) {
    if (!inputs.active) menuNav.poll(inputs.pads(), now);
    const dt = lastTime ? now - lastTime : 1000 / 60;
    lastTime = now;
    if (!world) {
      inputs.readAll();
      if (now - lastControllerUpdate > 400) {
        updateControllers();
        lastControllerUpdate = now;
      }
    }
    if (world) {
      const artwork = renderer.ready(world);
      if (artwork !== 'ready') {
        runner.reset();
        renderer.loading(
          artwork === 'error' ? 'Artwork could not load. Return to the menu and retry.' : 'Preparing fighters...',
        );
        requestAnimationFrame(frame);
        return;
      }

      const active = replayPlayback
        ? replayIndex < replayPlayback.entries.length && world.phase !== 'result'
        : world.phase === 'playing' || world.phase === 'countdown';
      if (active) {
        // Training can run slower (wall-clock only; still exact 60 Hz ticks) or freeze for frame-stepping.
        const trainingOnly = !replayPlayback && world.mode === 'training';
        const { sustained } =
          trainingOnly && trainingFrozen
            ? { sustained: false }
            : runner.advance(trainingOnly ? dt * trainingSpeed : dt, simTick);
        if (sustained) pause('Performance pause');
      } else runner.reset();
      // Arena matches hold on the final KO for a moment (burst, shake, KO callout) before the results card.
      const finished = world.phase === 'result';
      const outro = finished && !resultShown && !replayPlayback && world.mode !== 'training';
      if (outro && outroWorld !== world) {
        outroWorld = world;
        outroStart = now;
      }
      renderer.paint(world, null, runner.accumulator / (1000 / 60), dt, active || outro);
      if (world.tick - hudTick >= 5 || world.phase === 'result') {
        updateHud();
        hudTick = world.tick;
      }
      if (finished && !resultShown && (!outro || now - outroStart >= RESULT_OUTRO_MS)) showResult();
      if (now - lastControllerUpdate > 400) {
        updateControllers();
        lastControllerUpdate = now;
      }
    }
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------------------
  // Button wiring: what each menu button, dialog and key does.
  // ------------------------------------------------------------------------------
  $('brand').addEventListener('click', () => screen('home'));
  document
    .querySelectorAll('[data-nav]')
    .forEach((button: any) => button.addEventListener('click', () => screen(button.dataset.nav)));
  document
    .querySelectorAll<HTMLButtonElement>('[data-home-mode]')
    .forEach(button => button.addEventListener('click', () => $(button.dataset.homeMode!).click()));
  const playMenu = $('modes');
  playMenu.dataset.preview = 'story';
  for (const choice of document.querySelectorAll<HTMLButtonElement>('#modes .mode-card')) {
    const preview = () => {
      playMenu.dataset.preview = choice.id.slice('mode-'.length);
    };
    choice.addEventListener('pointerenter', preview);
    choice.addEventListener('focus', preview);
  }
  $('home-play').addEventListener('click', () => screen('modes'));
  const continueStory = () => {
    newJourney = false;
    storyRoute = store.data.storyHero;
    gate(resumeFights);
  };
  $('home-continue').onclick = continueStory;
  $('story-continue').onclick = continueStory;
  $('mode-story').onclick = () => screen('story-menu');
  $('story-new').onclick = () => {
    newJourney = true;
    screen('story-fights');
  };
  $('fight-continue').onclick = () =>
    gate(() => {
      if (newJourney) {
        newJourney = false;
        if (storyRoute === 'moses') startMoses(0);
        else startFight(0);
      } else resumeFights();
    });
  $('splash-enter').onclick = () => {
    $('splash-dialog').close();
    screen('home');
  };
  $('home-exit').onclick = () => {
    store.save();
    audio.stopMusic();
    inputs.active = false;
    try {
      sessionStorage.setItem('biblhalla-show-splash', '1');
      location.reload();
    } catch {
      $('splash-dialog').showModal();
    }
  };
  try {
    if (sessionStorage.getItem('biblhalla-show-splash') === '1') {
      sessionStorage.removeItem('biblhalla-show-splash');
      $('splash-dialog').showModal();
    }
  } catch {}
  $('story-david').onclick = () => {
    storyRoute = 'david';
    renderFights();
  };
  $('story-moses').onclick = () => {
    storyRoute = 'moses';
    renderFights();
  };

  $('fight-difficulty').addEventListener('change', () => {
    settings.difficulty = $('fight-difficulty').value;
    store.save();
  });
  $('mode-quick').addEventListener('click', () => screen('setup'));
  $('mode-local').addEventListener('click', () => {
    screen('local');
    renderLocal();
  });
  $('confirm-input').addEventListener('click', () => {
    const selected = (document.querySelector('input[name=input-method]:checked') as HTMLInputElement).value;
    if (selected === 'controller' && !inputs.pads().some((p: any) => inputs.padSeen.has(p.index))) return;
    settings.input = selected;
    store.save();
    close($('input-dialog'));
    applySettings();
    if (inputFromGame && world) {
      world.fighters.find((f: any) => f.human).inputId = currentInputId();
      showGame();
      inputs.active = false;
      open($('pause-dialog'));
    } else if (inputNext) {
      const fn = inputNext;
      inputNext = null;
      fn();
    }
  });
  document.querySelectorAll('input[name=input-method]').forEach(r => r.addEventListener('change', updateControllers));
  // Pause at once on unplug rather than at the next 400 ms poll.
  addEventListener('gamepaddisconnected', () => updateControllers());
  $('battle-form').addEventListener('submit', (e: Event) => {
    e.preventDefault();
    if (currentInputId() === 'unavailable') {
      $('battle-status').textContent = 'Reconnect your controller or choose another input in Settings.';
      return;
    }
    const values = new FormData($('battle-form'));
    const options = Object.fromEntries(values.entries());
    if (options.mode === 'waves') options.endless = true;
    gate(() => startGame(withChapterOpponent(options, currentInputId())));
  });
  function encounterRules() {
    const mode = $('battle-form').elements.mode.value;
    const difficulty = $('battle-form').elements.difficulty.value;
    $('opponent-stocks').disabled = mode !== 'duel';
    $('opponent-select').disabled = mode === 'waves';
    $('battle-form').elements.matchMinutes.disabled = mode === 'waves';
    $('battle-form').elements.matchMinutes.parentElement.hidden = mode === 'waves';
    $('encounter-rules').textContent =
      mode === 'boss'
        ? (difficulty === 'easy'
            ? '750 damage to red · 1 life.'
            : difficulty === 'hard'
              ? '1,000 damage to red · 1 life.'
              : '1,100 damage to red · second life: 100 damage to red.') + ' Defeat by ring-out.'
        : mode === 'waves'
          ? 'Unlimited mixed opponents. Giant boss every 5 waves. Difficulty rises; 25 damage heals between waves.'
          : 'Choose opponent lives independently of your own. Win by ring-out.';
  }
  $('battle-form').addEventListener('change', encounterRules);
  encounterRules();
  $('setup-moves').addEventListener('click', () => movesInfo());
  $('local-form').addEventListener('change', () => {
    if (readyBoard.setRules(lobbyRules())) renderLocal();
    lobbyStatus();
  });
  $('local-mode').addEventListener('change', renderLocal);
  $('local-count').addEventListener('change', renderLocal);
  $('refresh-controllers').addEventListener('click', renderLocal);
  $('local-form').addEventListener('submit', localSubmit);
  $('start-tutorial').addEventListener('click', () => chooseInput(() => startTutorial(() => screen('modes'))));
  $('start-training').addEventListener('click', () => gate(() => startGame({ mode: 'training', hero: selectedHero })));
  $('show-controls').addEventListener('click', controls);
  $('change-input').addEventListener('click', () => chooseInput());
  $('export-save').addEventListener('click', exportSave);
  // Deleting progress asks twice and always downloads an export first; settings are kept.
  let deleteArmedUntil = 0;
  $('delete-progress').addEventListener('click', () => {
    const now = performance.now();
    if (now < deleteArmedUntil) {
      deleteArmedUntil = 0;
      exportSave();
      store.resetProgress();
      $('delete-progress').textContent = 'Delete local progress';
      $('save-status').textContent = 'Progress deleted. A copy was exported first, and your settings are kept.';
      updateHome();
      return;
    }
    deleteArmedUntil = now + 6000;
    $('delete-progress').textContent = 'Press again to delete — an export downloads first';
  });
  $('export-replay').addEventListener('click', () => {
    if (lastReplay) download(JSON.stringify(lastReplay), 'biblhalla-replay.json');
  });
  $('import-save').addEventListener('change', async () => {
    const file = $('import-save').files[0];
    if (!file) return;
    try {
      if (file.size > 1048576) throw Error('Save is too large');
      store.import(await file.text());
      Object.assign(settings, store.data.settings);
      store.data.settings = settings;
      applySettings();
      renderSettings();
      $('import-status').textContent = 'Save imported successfully.';
    } catch (e) {
      $('import-status').textContent = 'Import failed: ' + (e as Error).message;
    } finally {
      $('import-save').value = '';
    }
  });
  // Replay playback from a file or the local library; validation lives in the simulation package.
  function playReplay(text: string) {
    const raw = S.validateReplay(JSON.parse(text));
    tutorial = false;
    world = S.snapshot(raw.initial);
    replayPlayback = raw;
    replayRecord = null;
    replayIndex = 0;
    resultShown = false;
    showGame();
    $('game-title').textContent = 'Local replay';
    $('objective').textContent = 'Playing recorded semantic inputs. No network connection.';
  }
  $('import-replay').addEventListener('change', async () => {
    const file = $('import-replay').files[0];
    if (!file) return;
    try {
      if (file.size > 8 * 1048576) throw Error('Replay is too large');
      playReplay(await file.text());
    } catch (e) {
      $('import-status').textContent = 'Replay failed: ' + (e as Error).message;
    } finally {
      $('import-replay').value = '';
    }
  });
  /** Build the saved-replays list in Settings. */
  function renderReplayLibrary() {
    const box = $('replay-library');
    box.replaceChildren();
    const items = replayLibrary.list();
    if (!items.length) {
      box.append(el('p', 'Finished arena matches are kept here: the 20 newest, plus any you pin.'));
      return;
    }
    for (const r of items) {
      const row = el('div', '', 'replay-row');
      const play = el('button', 'Play') as HTMLButtonElement,
        pin = el('button', r.pinned ? 'Unpin' : 'Pin') as HTMLButtonElement,
        exp = el('button', 'Export') as HTMLButtonElement,
        del = el('button', 'Delete') as HTMLButtonElement;
      play.addEventListener('click', () => {
        try {
          playReplay(replayLibrary.get(r.id)!);
        } catch (e) {
          $('import-status').textContent = 'Replay failed: ' + (e as Error).message;
        }
      });
      pin.addEventListener('click', () => {
        replayLibrary.pin(r.id, !r.pinned);
        renderReplayLibrary();
      });
      exp.addEventListener('click', () => download(replayLibrary.get(r.id)!, 'biblhalla-replay-' + r.id + '.json'));
      del.addEventListener('click', () => {
        replayLibrary.remove(r.id);
        renderReplayLibrary();
      });
      row.append(
        el('span', (r.pinned ? '📌 ' : '') + r.label + ' · ' + new Date(r.savedAt).toLocaleString()),
        play,
        pin,
        exp,
        del,
      );
      box.append(row);
    }
  }
  for (const [id, key, isBoolean] of [
    ['mute', 'mute', true],
    ['reduced-motion', 'reducedMotion', true],
    ['left-handed', 'leftHanded', true],
    ['charge-toggle', 'chargeToggle', true],
    ['music', 'music', true],
    ['screen-shake', 'screenShake', true],
    ['flashes', 'flashes', true],
    ['touch-size', 'touchSize', false],
    ['touch-opacity', 'touchOpacity', false],
    ['deadzone', 'deadzone', false],
    ['ui-scale', 'uiScale', false],
    ['caption-speed', 'captionSpeed', false],
  ] as any)
    $(id).addEventListener('input', () => {
      settings[key] = isBoolean ? $(id).checked : Number($(id).value);
      applySettings();
      store.save();
      $('save-status').textContent = store.status;
    });
  $('game-pause').addEventListener('click', () => pause());
  $('resume').addEventListener('click', resume);
  $('restart').addEventListener('click', retry);
  $('pause-controls').addEventListener('click', controls);
  $('pause-input').addEventListener('click', () => chooseInput()); // Quitting a match asks once: the first press arms, a second press within 5 s leaves.
  /** Leaving a match needs a second press within 5 seconds. */
  let leaveArmedUntil = 0;
  /** Reset the Leave button to its first-press label. */
  function resetLeave() {
    leaveArmedUntil = 0;
    $('leave-game').textContent = 'Return to menu';
  }
  $('leave-game').addEventListener('click', () => {
    const now = performance.now();
    if (now < leaveArmedUntil) {
      resetLeave();
      screen(world?.options.storyFight !== undefined ? 'story-fights' : 'modes');
      return;
    }
    leaveArmedUntil = now + 5000;
    $('leave-game').textContent = 'Leave the match? Press again — this match will not be saved';
  });
  $('pause-dialog').addEventListener('close', resetLeave);
  $('game-context').addEventListener('click', context);
  $('training-details').addEventListener('click', () => {
    renderer.debug = !renderer.debug;
    $('training-details').textContent = renderer.debug ? 'Hide details' : 'Details';
  });
  $('training-speed').addEventListener('change', () => {
    trainingSpeed = Number($('training-speed').value) || 1;
  });
  $('training-freeze').addEventListener('click', () => {
    trainingFrozen = !trainingFrozen;
    $('training-freeze').textContent = trainingFrozen ? 'Resume' : 'Freeze';
    $('training-step').disabled = !trainingFrozen;
  });
  $('training-step').addEventListener('click', () => {
    if (trainingFrozen && world) simTick();
  }); // In-match buttons and dropdowns hand focus back to the arena, so Space, Enter and the
  // arrow keys keep driving the fighter instead of re-pressing a button or changing a dropdown.
  $('game').addEventListener('change', e => {
    if (!(e.target as HTMLElement).closest('dialog')) $('arena').focus();
  });
  $('game').addEventListener('click', e => {
    const el = (e.target as HTMLElement).closest('button');
    if (el && !el.closest('dialog')) $('arena').focus();
  });
  // Reset keeps the chosen dummy and skips the 3-2-1: training restarts instantly.
  $('training-reset').addEventListener('click', () => {
    if (!world) return;
    const bot = $('training-bot').value;
    if (tutorial || drill) {
      const fresh = S.create(world.options);
      world.fighters.forEach((f: any, k: number) => {
        const g = fresh.fighters[k];
        if (g)
          Object.assign(f, {
            x: g.x,
            y: g.y,
            vx: 0,
            vy: 0,
            kx: 0,
            facing: g.facing,
            action: null,
            buffer: null,
            stun: 0,
            hitstop: 0,
            damage: 0,
            ground: null,
            respawn: 0,
          });
      });
      renderer.capture(world);
      return;
    }
    startGame({
      ...world.options,
      trainingBot: bot,
      ...(['easy', 'hard', 'extreme'].includes(bot) ? { difficulty: bot } : {}),
    });
    if (world.options.mode === 'training') {
      while (world.phase === 'countdown') S.step(world);
      replayRecord = null;
      renderer.capture(world);
    }
  });
  $('training-bot').addEventListener('change', () => {
    world.trainingBot = $('training-bot').value;
    if (['easy', 'hard', 'extreme'].includes(world.trainingBot)) world.difficulty = world.trainingBot;
  });
  $('next-level').addEventListener('click', () => {
    if (world?.options.mosesPart !== undefined && !replayPlayback) startMoses(world.options.mosesPart + 1);
    else if (world?.options.storyFight !== undefined && !replayPlayback) startFight(world.options.storyFight + 1);
  });
  $('rematch').addEventListener('click', () => {
    if (tutorialFinished && world?.options.mode === 'training') {
      const fn = inputNext;
      inputNext = null;
      tutorialFinished = false;
      screen('modes');
      if (fn) fn();
    } else retry();
  });
  $('result-menu').addEventListener('click', () => screen('home'));
  $('result-select').addEventListener('click', () => {
    if (['local', 'ffa', 'teams'].includes(world.mode) || (world.mode === 'waves' && world.options.fighters)) {
      screen('local');
      renderLocal();
    } else screen('setup');
  });
  document
    .querySelectorAll('[data-close]')
    .forEach((b: any) => b.addEventListener('click', () => close($(b.dataset.close))));
  $('info-dialog').addEventListener('close', () => {
    if (infoResume) resume();
    else if (world && world.phase === 'paused' && !$('pause-dialog').open) open($('pause-dialog'));
  });
  $('pause-dialog').addEventListener('cancel', (e: Event) => {
    e.preventDefault();
    resume();
  });
  $('result-dialog').addEventListener('cancel', (e: Event) => {
    e.preventDefault();
    screen(world?.options.storyFight !== undefined ? 'story-fights' : 'modes');
  });
  window.addEventListener('blur', () => pause('Window lost focus'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause('Game backgrounded');
  });
  window.addEventListener('orientationchange', () => pause('Screen rotated — ready when you are'));
  // The renderer keeps no GPU-side caches, so a restored context just paints the next frame.
  $('arena').addEventListener('contextlost', (e: Event) => {
    e.preventDefault();
    pause('Graphics were reset — ready when you are');
  });
  for (const id of ['arena-select', 'local-arena']) {
    const select = $(id) as HTMLSelectElement;
    for (const m of C.maps.maps) {
      const opt = el('option', m.name) as HTMLOptionElement;
      opt.value = m.id;
      select.append(opt);
    }
    const preview = el('figure', '', 'arena-preview');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    canvas.setAttribute('aria-hidden', 'true');
    const caption = el('figcaption');
    preview.append(canvas, caption);
    select.closest('label')?.after(preview);
    const draw = () => {
      const map = C.maps.maps.find((m: any) => m.id === select.value) ?? C.maps.maps[0];
      const backdrop = art.arenas?.[map.id]?.image;
      caption.textContent = map.name + ' · ' + map.scriptureContext;
      paintArenaPreview(canvas, map, backdrop);
      if (backdrop && !backdrop.complete) backdrop.addEventListener('load', draw, { once: true });
    };
    select.addEventListener('change', draw);
    draw();
  }
  for (const f of C.fighters.fighters) {
    const opt = el('option', f.name) as HTMLOptionElement;
    opt.value = f.id;
    $('opponent-select').append(opt);
  }
  {
    const opt = el('option', 'Random (from match seed)') as HTMLOptionElement;
    opt.value = 'random';
    $('opponent-select').append(opt);
  }
  for (const fight of DAVID_FIGHTS.slice(0, 3)) $('opponent-select').add(new Option(fight.name, fight.skin));
  $('opponent-select').value = 'samson';
  renderRoster();
  renderLibrary();
  applySettings();
  updateHome();
  root.BiblhallaLifecycle = { suspend: () => pause('App backgrounded') };
  // advanceFrame lets automated QA drive the display loop where requestAnimationFrame is throttled.
  root.BiblhallaGame = {
    advanceFrame: (now: number) => frame(now),
    status: () => ({
      screen: currentScreen,
      phase: world?.phase || 'menu',
      tick: world?.tick || 0,
      mode: world?.mode,
      level: world?.options.storyFight,
      roster: C.fighters.fighters.length,
      arenas: C.maps.maps.length,
      moves: C.attacks.attacks.length,
      levels: DAVID_CHAPTER.length + MOSES_PARTS.length,
      completed: [
        ...DAVID_CHAPTER.slice(0, store.data.davidWins).map(f => f.part),
        ...MOSES_PARTS.slice(0, store.data.mosesWins).map((_, i) => 'moses-' + (i + 1)),
      ],
      storage: store.status,
      player: world ? S.snapshot(world.fighters[0]) : null,
    }),
    snapshot: () => (world ? S.snapshot(world) : null),
  };
  // Portrait touch play: suggest rotating, but allow continuing.
  $('rotate-continue').addEventListener('click', () => document.documentElement.classList.add('portrait-ok'));
  requestAnimationFrame(frame);
}
