// Move showcase: plays a fighter's move on a small canvas in the move list, using the
// real simulation so the preview matches the game exactly.

import type { Attack } from '../../../../packages/content/src/index.ts';
import type { Engine, SimState } from '../../../../packages/sim/src/index.ts';
import { Renderer, type RuntimeArt } from '../render/renderer.ts';

function inputLabel(move: Attack) {
  if (move.id === 'caleb_gauntlets_nsig') return 'Grounded · Hold Heavy with no direction, then release';
  if (move.comboOnly) return 'Airborne · Light after a confirmed aerial light';
  const context =
    move.input.context === 'air'
      ? 'Airborne'
      : move.input.context === 'ground'
        ? 'Grounded'
        : 'Grounded or gravity cancel';
  const direction = { neutral: 'Neutral', side: 'Side', down: 'Down' }[move.input.direction];
  return context + ' · ' + direction + ' + ' + (move.input.button === 'heavy' ? 'Heavy' : 'Light');
}

export function moveShowcase(engine: Engine, art: RuntimeArt, hero: string, reduced: boolean) {
  const panel = document.createElement('div');
  panel.className = 'move-showcase';
  panel.innerHTML = `<div class="move-picker"><label>Weapon<select></select></label>
    <div class="move-list" role="group" aria-label="Moves"></div></div>
    <section class="move-stage"><h3></h3><p class="move-input"></p>
    <canvas width="720" height="400" aria-label="Fighter demonstration"></canvas>
    <div class="move-transport"><button type="button" data-control="play"></button>
    <button type="button" data-control="step">Next frame</button><button type="button" data-control="restart">Replay</button><button type="button" data-control="speed" aria-pressed="false">½ speed</button><span class="move-phase"></span></div>
    <div class="move-data"></div><p class="move-link-tip">Ground combo: land a standing light, then press Side + Light or Down + Light as the hit finishes.</p></section>`;
  const select = panel.querySelector('select')!;
  const list = panel.querySelector<HTMLElement>('.move-list')!;
  const canvas = panel.querySelector('canvas')!;
  const play = panel.querySelector<HTMLButtonElement>('[data-control=play]')!;
  const speed = panel.querySelector<HTMLButtonElement>('[data-control=speed]')!;
  const phase = panel.querySelector<HTMLElement>('.move-phase')!;
  const data = panel.querySelector<HTMLElement>('.move-data')!;
  const renderer = new Renderer(canvas, engine, art);
  renderer.reduced = reduced;
  renderer.showFighterLabels = false;
  // Crop the normal arena camera to a ringside view.
  renderer.ctx.setTransform(1.7, 0, 0, 1.7, 360 - 640 * 1.7, 345 - 520 * 1.7);
  const def = engine.defs[hero];
  for (const weapon of [...def.weaponPair, 'unarmed']) {
    select.add(new Option(weapon[0].toUpperCase() + weapon.slice(1), weapon));
  }
  let move: Attack, world: SimState;
  let playing = !reduced,
    slow = false,
    request = 0,
    last = 0,
    remainder = 0;
  let disposed = false;
  let label = 'Ready';

  function reset() {
    label = 'Ready';
    world = engine.create({ mode: 'training', hero, trainingBot: 'stand', seed: 1 });
    world.phase = 'playing';
    const [fighter, dummy] = world.fighters;
    const [, bottom, , height] = world.map.main.rectUnits;
    const floor = (bottom + height) * engine.Q;
    const air = move.input.context === 'air';
    const distance = move.delivery === 'projectile' ? 135 : 46;
    fighter.x = (-distance * engine.Q) / 2;
    dummy.x = -fighter.x;
    for (const f of [fighter, dummy]) {
      f.y = floor;
      f.ground = world.map.main.id;
      f.invulnerable = f.respawn = 0;
      f.vx = f.vy = 0;
    }
    fighter.facing = 1;
    dummy.facing = -1;
    fighter.weapon = select.value;
    if (air) {
      fighter.ground = null;
      fighter.y += 65 * engine.Q;
      fighter.vy = 4 * engine.Q;
    }
    engine.startAttack(world, fighter, {}, false, move);
    renderer.camera = { x: 0, y: 140, zoom: 0.95 };
    renderer.capture(world);
    last = remainder = 0;
  }

  function advance() {
    const fighter = world.fighters[0];
    const action = fighter.action;
    renderer.capture(world);
    engine.step(world, {});
    if (action?.kind === 'attack') {
      const tick = action.tick;
      const phaseName = tick <= move.startup ? 'Startup' : tick <= move.startup + move.active ? 'Active' : 'Recovery';
      label = phaseName + ' · ' + tick;
      if (fighter.hitstop > 0) label += ' · Hitstop ' + fighter.hitstop;
    } else {
      label = world.projectiles.length ? 'In flight' : 'Ready';
    }
  }

  function draw() {
    renderer.paint(world, null, 1, 1000 / 60, playing);
    if (phase.textContent !== label) phase.textContent = label;
  }

  function frame(now: number) {
    if (disposed || !playing || !panel.isConnected) return;
    remainder += last ? Math.min(now - last, 100) * (slow ? 0.5 : 1) : 0;
    last = now;
    while (remainder >= 1000 / 60) {
      remainder -= 1000 / 60;
      advance();
      if (world.tick > move.totalTicks + 45 && !world.projectiles.length) {
        reset();
        break;
      }
    }
    draw();
    request = requestAnimationFrame(frame);
  }

  function refreshPlayback() {
    cancelAnimationFrame(request);
    last = 0;
    play.textContent = playing ? 'Pause' : 'Play';
    draw();
    if (playing) request = requestAnimationFrame(frame);
  }

  function selectMove(next: Attack) {
    move = next;
    for (const button of list.querySelectorAll('button'))
      button.setAttribute('aria-pressed', String(button.value === move.id));
    panel.querySelector('h3')!.textContent = move.displayName;
    panel.querySelector('.move-input')!.textContent = inputLabel(move);
    const tips: Record<string, string> = {
      moses_staff_dsig:
        'Press Down + Heavy to spin the staff. The hurricane hits four times on either side: three light contacts, then a launching finish.',
      moses_staff_slight:
        'Land Forward + Light, then press Down + Light as the sweep connects to vault into two aerial kicks.',
      moses_staff_dlight:
        'Two airborne kicks. Link from Forward + Light for the vault combo. Tiny sparks mark each successful hit.',
      moses_staff_ssig: 'Forward + Heavy sends a breaking wave ahead. Follow its forward travel to control space.',
    };
    if (hero === 'moses' && select.value === 'staff')
      panel.querySelector('.move-link-tip')!.textContent =
        tips[move.id] ?? 'Vault combo: land Forward + Light, then press Down + Light to leap into two kicks.';
    else if (select.value === 'gauntlets')
      panel.querySelector('.move-link-tip')!.textContent =
        'Confirmed-hit links: Neutral Light → Side Light or Down Light; Side Light → Down Light; Down Light → Neutral Heavy. Release direction before holding Heavy for the uppercut. Air Light → Light chains twice. Whiffs cannot cancel; opponents can escape gaps.';
    else
      panel.querySelector('.move-link-tip')!.textContent =
        'Ground combo: land a standing light, then press Side + Light or Down + Light as the hit finishes.';
    canvas.setAttribute('aria-label', def.name + ' performing ' + move.displayName);
    data.replaceChildren();
    for (const [name, value] of [
      ['Startup', move.startup + 'f'],
      ['Active', move.active + 'f'],
      ['Recovery', move.recovery + 'f'],
      ['Base damage', move.damageTenths / 10],
    ]) {
      const cell = document.createElement('span'),
        number = document.createElement('b');
      number.textContent = String(value);
      cell.append(number, String(name));
      data.append(cell);
    }
    reset();
    refreshPlayback();
  }

  function loadWeapon() {
    const weapon = select.value;
    panel.querySelector('.move-link-tip')!.textContent =
      hero === 'moses' && weapon === 'staff'
        ? 'Vault combo: land Forward + Light, then press Down + Light to leap into two kicks.'
        : 'Ground combo: land a standing light, then press Side + Light or Down + Light as the hit finishes.';
    const moves = engine.content.attacks.attacks.filter(
      m => (m.ownerId === weapon && !engine.moves[hero + '_' + m.id]) || (m.ownerId === hero && m.weapon === weapon),
    );
    list.replaceChildren();
    for (const attack of moves) {
      const button = document.createElement('button');
      button.type = 'button';
      button.value = attack.id;
      button.textContent = attack.displayName;
      button.onclick = () => selectMove(attack);
      list.append(button);
    }
    list.scrollTop = 0;
    selectMove(moves[0]);
  }

  select.onchange = loadWeapon;
  play.onclick = () => {
    playing = !playing;
    refreshPlayback();
  };
  panel.querySelector<HTMLButtonElement>('[data-control=step]')!.onclick = () => {
    playing = false;
    if (!world.fighters[0].action && !world.projectiles.length) reset();
    advance();
    refreshPlayback();
  };
  speed.onclick = () => {
    slow = !slow;
    speed.setAttribute('aria-pressed', String(slow));
  };
  panel.querySelector<HTMLButtonElement>('[data-control=restart]')!.onclick = () => {
    reset();
    playing = true;
    refreshPlayback();
  };
  loadWeapon();
  // A paused preview must still repaint when its lazily loaded sprites arrive.
  for (const f of world!.fighters)
    art.images[f.hero]
      ?.decode()
      .then(() => {
        if (!disposed && !playing) draw();
      })
      .catch(() => {});
  return {
    panel,
    dispose() {
      disposed = true;
      cancelAnimationFrame(request);
    },
  };
}
