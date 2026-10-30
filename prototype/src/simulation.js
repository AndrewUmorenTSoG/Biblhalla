(function (root) {
  'use strict';

  const TICK_RATE = 60;
  const ARENAS = {
    elah: { name: 'Elah Training Terrace', art: 'elah', floor: { x: 148, y: 414, w: 990, h: 82 }, shelves: [{ x: 260, y: 258, w: 252 }, { x: 770, y: 258, w: 252 }] },
    susa: { name: 'Susa Garden Balcony', art: 'susa', floor: { x: 80, y: 454, w: 1120, h: 82 }, shelves: [{ x: 252, y: 290, w: 225 }, { x: 804, y: 290, w: 225 }] },
    builders: { name: 'Builders’ Court', art: 'builders', floor: { x: 180, y: 414, w: 920, h: 82 }, shelves: [{ x: 280, y: 277, w: 220 }, { x: 762, y: 277, w: 220 }] }
  };
  const HEROES = {
    david: { name: 'David', weapons: ['Sling', 'Sword'], power: 4, guard: 4, speed: 7, color: '#4ba9ee' },
    samson: { name: 'Samson', weapons: ['Mallet', 'Gauntlets'], power: 8, guard: 5, speed: 2, color: '#e98a4e' }
  };
  const DIFFICULTIES = {
    easy: { name: 'Easy', reactionTicks: 27, decisionTicks: 14, dodgeChance: 0.08, attackChance: 0.42, aimError: 40 },
    hard: { name: 'Hard', reactionTicks: 12, decisionTicks: 6, dodgeChance: 0.50, attackChance: 0.82, aimError: 14 },
    extreme: { name: 'Extremely Hard', reactionTicks: 6, decisionTicks: 3, dodgeChance: 0.82, attackChance: 0.98, aimError: 3 }
  };
  const EMPTY_INPUT = Object.freeze({ x: 0, y: 0, jump: false, jumpHeld: false, light: false, heavy: false, dodge: false, item: false });
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const toward = (value, target, amount) => value < target ? Math.min(target, value + amount) : Math.max(target, value - amount);

  function inputFrame(value = {}) {
    return {
      x: Math.sign(Number(value.x) || 0), y: Math.sign(Number(value.y) || 0),
      jump: !!value.jump, jumpHeld: !!value.jumpHeld,
      light: !!value.light, heavy: !!value.heavy, dodge: !!value.dodge, item: !!value.item
    };
  }

  function random(match) {
    let seed = match.seed >>> 0;
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    match.seed = seed >>> 0;
    return match.seed / 4294967296;
  }

  function makeFighter(id, hero, x, y, isPlayer, options = {}) {
    return {
      id, hero, isPlayer, team: isPlayer ? 0 : 1, x, y, vx: 0, vy: 0, launchX: 0,
      width: options.boss ? 56 : 38, height: options.boss ? 128 : 82,
      scale: options.boss ? 1.52 : 1, boss: !!options.boss, guardMeter: options.boss ? 170 : null,
      face: isPlayer ? 1 : -1, onGround: true, platform: 'floor', airJumps: 2, recoveryReady: true,
      damage: 0, stocks: options.stocks || 3, stun: 0, invincible: 0, respawn: 0,
      attack: null, dodge: 0, dodgeX: 0, dash: 0, dodgeCooldown: 0, dashCooldown: 0,
      weaponIndex: 0, nextWeapon: 1, itemCooldown: 0, dropThrough: 0,
      wallTicks: 0, wallRefresh: true, jumpCut: false, lastHitBy: null,
      ai: { nextDecision: 0, intent: inputFrame(), recentTargets: [] }
    };
  }

  function createMatch(options = {}) {
    const arenaId = ARENAS[options.arena] ? options.arena : 'elah';
    const hero = HEROES[options.hero] ? options.hero : 'david';
    const mode = ['duel', 'waves', 'boss'].includes(options.mode) ? options.mode : 'duel';
    const difficulty = DIFFICULTIES[options.difficulty] ? options.difficulty : 'easy';
    const arena = ARENAS[arenaId];
    const match = {
      schema: 1, seed: (options.seed || 235811) >>> 0, tick: 0, phase: 'countdown', countdown: 150,
      arenaId, arena, hero, mode, difficulty, fighters: [], projectiles: [], events: [], history: [],
      nextId: 2, attackSerial: 0, wave: 1, waveWait: 0, clearedEnemies: 0,
      pickup: { x: 640, y: arena.floor.y - 26 }, pickupTimer: 480, remainingTicks: 18000,
      result: null, playerDamageDealt: 0, playerHits: 0
    };
    match.fighters.push(makeFighter(1, hero, 420, arena.floor.y, true));
    if (mode === 'duel') match.fighters.push(makeFighter(2, hero === 'david' ? 'samson' : 'david', 880, arena.floor.y, false));
    else if (mode === 'boss') match.fighters.push(makeFighter(2, 'samson', 860, arena.floor.y, false, { boss: true, stocks: 1 }));
    else spawnWave(match);
    return match;
  }

  function spawnWave(match) {
    const count = match.wave === 3 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const x = clamp(800 + i * 110, match.arena.floor.x + 80, match.arena.floor.x + match.arena.floor.w - 65);
      match.fighters.push(makeFighter(match.nextId++, i % 2 ? 'david' : 'samson', x, match.arena.floor.y, false, { stocks: 1 }));
    }
    match.events.push({ type: 'wave', wave: match.wave });
  }

  function weaponName(fighter) {
    return fighter.weaponIndex < 0 ? 'Unarmed' : HEROES[fighter.hero].weapons[fighter.weaponIndex];
  }

  function hurtbox(fighter) {
    return { x: fighter.x - fighter.width / 2, y: fighter.y - fighter.height, w: fighter.width, h: fighter.height };
  }
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function attackBox(fighter) {
    const a = fighter.attack;
    if (!a) return null;
    if (a.kind === 'recovery') return { x: fighter.x - 46, y: fighter.y - fighter.height - 65, w: 92, h: 105 };
    if (a.kind === 'pound' || a.direction === 'down' && !a.grounded) return { x: fighter.x - 33, y: fighter.y - 12, w: 66, h: 96 };
    if (a.direction === 'neutral') return { x: fighter.x - 56, y: fighter.y - fighter.height - 42, w: 112, h: 105 };
    return { x: fighter.face > 0 ? fighter.x + 14 : fighter.x - a.range - 14, y: fighter.y - (a.direction === 'down' ? 30 : 75), w: a.range, h: a.direction === 'down' ? 34 : 62 };
  }

  function startAttack(match, fighter, heavy, input) {
    const direction = input.y > 0 ? 'down' : input.x ? 'side' : 'neutral';
    const weapon = weaponName(fighter);
    let kind = 'strike';
    if (heavy && !fighter.onGround) {
      if (direction === 'down') kind = 'pound';
      else if (fighter.recoveryReady) { kind = 'recovery'; fighter.recoveryReady = false; }
      else return false;
    }
    const projectile = weapon === 'Sling' && kind === 'strike' && !(direction === 'down' && !fighter.onGround);
    const startup = kind === 'recovery' ? 9 : kind === 'pound' ? 15 : heavy ? 19 : 7;
    const active = projectile ? 1 : kind === 'pound' ? 16 : heavy ? 6 : 4;
    const recovery = heavy ? 27 : 16;
    fighter.attack = {
      id: ++match.attackSerial, kind, heavy, direction, grounded: fighter.onGround, projectile,
      frame: 0, startup, active, recovery, charge: 0, emitted: false, hitTargets: [],
      range: (weapon === 'Mallet' ? 115 : weapon === 'Sword' ? 100 : 72) + (heavy ? 35 : 0),
      damage: (heavy ? 24 : 11) * (1 + (HEROES[fighter.hero].power - 5) * 0.02),
      sprite: heavy ? 'heavy' : 'light'
    };
    fighter.invincible = 0;
    return true;
  }

  function emitProjectile(match, fighter, attack) {
    if (match.projectiles.filter(p => p.owner === fighter.id).length >= 2) return;
    const up = attack.direction === 'neutral' && attack.heavy;
    match.projectiles.push({ id: ++match.attackSerial, owner: fighter.id, team: fighter.team,
      x: fighter.x + fighter.face * 28, y: fighter.y - (attack.direction === 'down' ? 17 : 58),
      vx: fighter.face * (up ? 8 : 12), vy: up ? -10 : -0.4, life: 66, damage: attack.damage,
      heavy: attack.heavy, thrown: false });
    match.events.push({ type: 'release', x: fighter.x, y: fighter.y - 50 });
  }

  function itemAction(match, fighter, input) {
    if (fighter.itemCooldown) return;
    if (fighter.weaponIndex < 0) {
      if (match.pickup && Math.abs(match.pickup.x - fighter.x) < 64 && Math.abs(match.pickup.y - fighter.y) < 90) {
        fighter.weaponIndex = fighter.nextWeapon;
        fighter.nextWeapon = 1 - fighter.nextWeapon;
        match.pickup = null; match.pickupTimer = 180;
        match.events.push({ type: 'pickup', x: fighter.x, y: fighter.y - 50 });
      }
      return;
    }
    if (input.y <= 0) {
      match.projectiles.push({ id: ++match.attackSerial, owner: fighter.id, team: fighter.team,
        x: fighter.x + fighter.face * 24, y: fighter.y - 50, vx: fighter.face * 10, vy: -2,
        life: 65, damage: 10, heavy: false, thrown: true });
    }
    fighter.weaponIndex = -1; fighter.itemCooldown = 24;
    match.events.push({ type: 'release', x: fighter.x, y: fighter.y - 45 });
  }

  function chooseBotInput(match, fighter) {
    const level = DIFFICULTIES[match.difficulty];
    const target = match.fighters[0];
    if (match.tick < fighter.ai.nextDecision) {
      return { ...fighter.ai.intent, jump: false, light: false, heavy: false, dodge: false, item: false };
    }
    fighter.ai.nextDecision = match.tick + level.decisionTicks;
    const past = match.history[Math.max(0, match.history.length - 1 - level.reactionTicks)] || { x: target.x, y: target.y, vx: target.vx, vy: target.vy, attacking: false };
    const input = inputFrame();
    const floor = match.arena.floor;
    const offstage = fighter.x < floor.x + 18 || fighter.x > floor.x + floor.w - 18;
    if (offstage || fighter.y > floor.y + 40) {
      input.x = Math.sign(640 - fighter.x);
      if (!fighter.onGround && !fighter.attack && fighter.stun === 0) {
        if (fighter.airJumps > 0 && (fighter.y > floor.y - 35 || fighter.vy > 2)) input.jump = input.jumpHeld = true;
        else if (fighter.recoveryReady && fighter.y > floor.y - 90) input.heavy = true;
      }
      fighter.ai.intent = input;
      return input;
    }
    const aim = past.x + past.vx * (match.difficulty === 'extreme' ? 5 : 1) + (random(match) - .5) * level.aimError;
    const distance = aim - fighter.x;
    const vertical = past.y - fighter.y;
    const ranged = weaponName(fighter) === 'Sling';
    const desiredRange = ranged ? 225 : 70;
    if (Math.abs(distance) > desiredRange) input.x = Math.sign(distance);
    else if (ranged && Math.abs(distance) < 120) input.x = -Math.sign(distance);
    fighter.face = Math.sign(distance) || fighter.face;
    if (vertical < -85 && fighter.onGround) input.jump = input.jumpHeld = true;
    if (!fighter.onGround && vertical > 70) input.y = 1;
    if (fighter.weaponIndex < 0 && match.pickup) {
      input.x = Math.sign(match.pickup.x - fighter.x);
      if (Math.abs(match.pickup.x - fighter.x) < 58) input.item = true;
    }
    if (past.attacking && Math.abs(distance) < 180 && Math.abs(vertical) < 100 && fighter.dodgeCooldown === 0 && random(match) < level.dodgeChance) {
      input.dodge = true;
      input.x = fighter.onGround ? 0 : -Math.sign(distance);
    } else if (Math.abs(distance) < (ranged ? 460 : 148) && Math.abs(vertical) < (ranged ? 75 : 120) && random(match) < level.attackChance) {
      input.x = Math.abs(distance) > 22 ? Math.sign(distance) : 0;
      input.y = vertical < -60 ? -1 : vertical > 32 ? 1 : 0;
      input.heavy = random(match) < (past.attacking ? 0.62 : 0.29);
      input.light = !input.heavy;
    }
    if (match.difficulty === 'easy' && random(match) < .12) input.x = 0;
    fighter.ai.intent = input;
    return input;
  }

  function moveFighter(match, fighter, rawInput) {
    const input = inputFrame(rawInput);
    if (!fighter.stocks) return;
    for (const key of ['stun', 'invincible', 'dodgeCooldown', 'dashCooldown', 'itemCooldown', 'dropThrough']) if (fighter[key] > 0) fighter[key]--;
    if (fighter.respawn > 0) {
      fighter.respawn--;
      if (fighter.respawn === 0) {
        const opposite = match.fighters[0].x < 640 ? 860 : 420;
        fighter.x = fighter.isPlayer ? 420 : opposite; fighter.y = match.arena.floor.y - 110;
        fighter.vx = fighter.vy = fighter.launchX = 0; fighter.damage = 0; fighter.attack = null;
        fighter.airJumps = 2; fighter.recoveryReady = true; fighter.invincible = 100;
        fighter.weaponIndex = 0; fighter.onGround = false; fighter.wallRefresh = true; fighter.wallTicks = 0;
      }
      return;
    }
    const legal = !fighter.stun && !fighter.attack && !fighter.dodge && !fighter.dash;
    if (legal) {
      if (input.x) fighter.face = input.x;
      if (input.dodge && fighter.onGround && input.x && !fighter.dashCooldown) {
        fighter.dash = 8; fighter.dashCooldown = 18; fighter.vx = input.x * 9;
      } else if (input.dodge && !fighter.dodgeCooldown) {
        fighter.dodge = 20; fighter.dodgeX = input.x * 7; fighter.dodgeCooldown = fighter.onGround ? 55 : 100;
      } else if (input.item) itemAction(match, fighter, input);
      else if (input.heavy || input.light) startAttack(match, fighter, input.heavy, input);
      if (input.jump && !fighter.attack && !fighter.dodge) {
        if (input.y > 0 && fighter.onGround && fighter.platform !== 'floor') {
          fighter.dropThrough = 14; fighter.y += 5; fighter.onGround = false;
        } else if (fighter.onGround || fighter.airJumps > 0) {
          if (!fighter.onGround) fighter.airJumps--;
          fighter.vy = fighter.onGround ? -11.8 : -10.3; fighter.onGround = false; fighter.jumpCut = false; fighter.dash = 0;
          match.events.push({ type: 'jump', x: fighter.x, y: fighter.y });
        }
      }
    }
    if (!input.jumpHeld && fighter.vy < -5.5 && !fighter.jumpCut && fighter.attack?.kind !== 'recovery' && fighter.stun === 0) { fighter.vy = -5.5; fighter.jumpCut = true; }
    if (fighter.attack) {
      const a = fighter.attack;
      a.frame++;
      if (a.frame === a.startup) {
        if (a.projectile) emitProjectile(match, fighter, a);
        if (a.kind === 'recovery') fighter.vy = -11;
        if (a.kind === 'pound') fighter.vy = 13;
      }
      if (a.frame >= a.startup + a.active + a.recovery) fighter.attack = null;
    }
    if (fighter.dodge) { fighter.dodge--; if (fighter.dodge > 5) fighter.vx = fighter.dodgeX; }
    if (fighter.dash) fighter.dash--;
    if (!fighter.dodge && !fighter.dash) {
      const maxSpeed = 4.9 + (HEROES[fighter.hero].speed - 5) * .2;
      const desired = !fighter.stun && !fighter.attack ? input.x * maxSpeed : 0;
      fighter.vx = toward(fighter.vx, desired, fighter.onGround ? .65 : .22);
    }
    fighter.launchX = toward(fighter.launchX, 0, .085);
    const oldX = fighter.x, oldY = fighter.y;
    fighter.x += fighter.vx + fighter.launchX;
    fighter.vy = Math.min(input.y > 0 && fighter.vy > 0 ? 14 : 10.5, fighter.vy + (input.y > 0 && fighter.vy > 0 ? .60 : .30));
    fighter.y += fighter.vy;
    fighter.onGround = false;
    const surfaces = [{ ...match.arena.floor, id: 'floor' }, ...match.arena.shelves.map((p, i) => ({ ...p, id: 'shelf' + i }))];
    for (const surface of surfaces) {
      if (surface.id !== 'floor' && fighter.dropThrough) continue;
      if (fighter.vy >= 0 && oldY <= surface.y + .5 && fighter.y >= surface.y && fighter.x + fighter.width / 2 > surface.x && fighter.x - fighter.width / 2 < surface.x + surface.w) {
        fighter.y = surface.y; fighter.vy = 0; fighter.onGround = true; fighter.platform = surface.id;
        fighter.airJumps = 2; fighter.recoveryReady = true; fighter.wallTicks = 0; fighter.wallRefresh = true;
        if (fighter.attack && fighter.attack.kind === 'pound' && fighter.attack.frame < fighter.attack.startup + fighter.attack.active) fighter.attack.frame = fighter.attack.startup + fighter.attack.active;
        break;
      }
    }
    const floor = match.arena.floor;
    const insideFloorHeight = fighter.y > floor.y + 8 && fighter.y - fighter.height < floor.y + floor.h;
    if (insideFloorHeight) {
      const fromLeft = oldX + fighter.width / 2 <= floor.x && fighter.x + fighter.width / 2 > floor.x;
      const fromRight = oldX - fighter.width / 2 >= floor.x + floor.w && fighter.x - fighter.width / 2 < floor.x + floor.w;
      if (fromLeft || fromRight) {
        fighter.x = fromLeft ? floor.x - fighter.width / 2 : floor.x + floor.w + fighter.width / 2;
        fighter.vx = 0; fighter.launchX = 0;
        if (fighter.wallTicks < 75 && !fighter.stun) {
          fighter.vy = Math.min(fighter.vy, 2); fighter.wallTicks++;
          if (fighter.wallRefresh) { fighter.airJumps = Math.max(1, fighter.airJumps); fighter.recoveryReady = true; fighter.wallRefresh = false; }
        }
      }
    }
    if (fighter.x < -120 || fighter.x > 1400 || fighter.y > 840 || fighter.y < -350) knockOut(match, fighter);
  }

  function knockOut(match, fighter) {
    if (fighter.respawn || !fighter.stocks) return;
    fighter.stocks--; fighter.attack = null; fighter.respawn = fighter.stocks ? 70 : 0;
    fighter.vx = fighter.vy = fighter.launchX = 0;
    match.projectiles = match.projectiles.filter(p => p.owner !== fighter.id);
    if (!fighter.isPlayer) match.clearedEnemies++;
    match.events.push({ type: 'ko', x: clamp(fighter.x, 0, 1280), y: clamp(fighter.y, 60, 650), player: fighter.isPlayer });
  }

  function resolveHits(match) {
    const hits = [];
    for (const attacker of match.fighters) {
      const a = attacker.attack;
      if (!a || attacker.respawn || !attacker.stocks || a.projectile || a.frame < a.startup || a.frame >= a.startup + a.active) continue;
      const box = attackBox(attacker);
      for (const target of match.fighters) {
        if (target.team === attacker.team || !target.stocks || target.respawn || target.invincible || target.dodge >= 6 && target.dodge <= 17 || a.hitTargets.includes(target.id)) continue;
        if (overlaps(box, hurtbox(target))) {
          a.hitTargets.push(target.id);
          hits.push({ target, attacker, damage: a.damage, heavy: a.heavy, direction: a.direction, kind: a.kind });
        }
      }
    }
    for (const p of match.projectiles) {
      p.x += p.vx; p.y += p.vy; p.life--; if (p.thrown) p.vy += .12;
      for (const target of match.fighters) {
        if (target.team === p.team || !target.stocks || target.respawn || target.invincible || target.dodge >= 6 && target.dodge <= 17) continue;
        if (overlaps({ x: p.x - 8, y: p.y - 8, w: 16, h: 16 }, hurtbox(target))) {
          const attacker = match.fighters.find(f => f.id === p.owner);
          if (attacker) hits.push({ target, attacker, damage: p.damage, heavy: p.heavy, direction: 'side', kind: 'projectile' });
          p.life = 0; break;
        }
      }
      if (p.x < -100 || p.x > 1380 || p.y > 850) p.life = 0;
    }
    match.projectiles = match.projectiles.filter(p => p.life > 0);
    // Resolve from the collected contacts so simultaneous attacks can trade.
    for (const hit of hits) {
      const { target, attacker, damage, heavy, direction, kind } = hit;
      target.damage = Math.min(999, target.damage + damage);
      target.attack = null; target.dash = 0; target.dodge = 0; target.stun = heavy ? 21 : 13;
      const force = (heavy ? 6 : 3.5) + target.damage * (heavy ? .055 : .032);
      const guard = 1 - (HEROES[target.hero].guard - 5) * .025;
      target.launchX = direction === 'neutral' || kind === 'recovery' ? attacker.face * force * .28 : attacker.face * force * guard * (target.boss ? .55 : 1);
      target.vy = direction === 'down' && !attacker.onGround ? force * .8 : -(direction === 'neutral' || kind === 'recovery' ? force : force * .58);
      target.onGround = false; target.lastHitBy = attacker.id;
      if (target.boss) target.guardMeter = Math.max(0, target.guardMeter - damage);
      if (attacker.isPlayer) { match.playerDamageDealt += damage; match.playerHits++; }
      match.events.push({ type: 'hit', x: target.x, y: target.y - target.height * .55, heavy, player: attacker.isPlayer });
    }
  }

  function finish(match, won, reason) {
    match.phase = 'result';
    match.result = { won, reason, ticks: match.tick, damageDealt: Math.round(match.playerDamageDealt), hits: match.playerHits, difficulty: match.difficulty, mode: match.mode };
    match.events.push({ type: 'result', won });
  }

  function stepMatch(match, playerInput = EMPTY_INPUT) {
    match.events = [];
    if (match.phase === 'paused' || match.phase === 'result') return match;
    if (match.phase === 'countdown') { if (--match.countdown <= 0) match.phase = 'playing'; return match; }
    match.tick++; match.remainingTicks--;
    const player = match.fighters[0];
    match.history.push({ x: player.x, y: player.y, vx: player.vx + player.launchX, vy: player.vy, attacking: !!player.attack });
    if (match.history.length > 90) match.history.shift();
    if (!match.pickup && --match.pickupTimer <= 0) match.pickup = { x: 640, y: match.arena.floor.y - 26 };
    for (const fighter of match.fighters) moveFighter(match, fighter, fighter.isPlayer ? playerInput : chooseBotInput(match, fighter));
    resolveHits(match);
    if (!player.stocks) finish(match, false, 'Your last life was lost. Try another approach.');
    else if (match.mode === 'boss' && (!match.fighters[1].stocks || match.fighters[1].guardMeter <= 0)) finish(match, true, 'The training champion’s guard is broken.');
    else if (match.mode === 'duel' && !match.fighters[1].stocks) finish(match, true, 'You won the duel.');
    else if (match.mode === 'waves' && !match.fighters.some(f => !f.isPlayer && f.stocks > 0)) {
      if (match.wave === 3) finish(match, true, 'All three waves cleared.');
      else if (++match.waveWait > 100) { match.fighters = [player]; match.wave++; match.waveWait = 0; spawnWave(match); }
    }
    if (match.remainingTicks <= 0 && match.phase === 'playing') {
      if (match.mode !== 'duel') finish(match, false, 'Time ran out before the encounter was cleared.');
      else {
        const opponent = match.fighters[1];
        const won = player.stocks > opponent.stocks || player.stocks === opponent.stocks && player.damage < opponent.damage;
        const tied = player.stocks === opponent.stocks && player.damage === opponent.damage;
        finish(match, won, tied ? 'Time limit reached: a draw. Try another round.' : 'Time limit reached. Lives first, then lower damage decide the duel.');
      }
    }
    return match;
  }

  function setPaused(match, paused) {
    if (match.phase === 'result') return;
    if (paused && match.phase !== 'paused') { match.resumePhase = match.phase; match.phase = 'paused'; }
    else if (!paused && match.phase === 'paused') match.phase = match.resumePhase || 'playing';
  }

  const api = { TICK_RATE, ARENAS, HEROES, DIFFICULTIES, EMPTY_INPUT, inputFrame, createMatch, stepMatch, setPaused, chooseBotInput, hurtbox, attackBox, weaponName, startAttack, knockOut };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Covenant = Object.assign(root.Covenant || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
