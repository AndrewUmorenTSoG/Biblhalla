# Biblhalla architecture

Biblhalla is an offline TypeScript game. Everything the player needs is compiled into one self-contained page (`dist/PLAY.html`), which the PC launcher opens directly and the iPad WKWebView wrapper bundles as a resource.

## Layout

Every source file, with one line on what it does. Each file also starts with a short
comment saying the same thing in more detail.

```text
packages/                     pure game logic: no DOM, storage or clock
  content/src/
    types.ts          shapes of all game data (fighters, attacks, maps, levels)
    compile.ts        turns production-pack/09_Data into one hashed content object
    validate.ts       checks the content before any match starts
  sim/src/                    deterministic 60 Hz simulation in Q8 fixed point
    fixed.ts          Q8 maths, seeded random numbers, state hash
    types.ts          state, input, fighter, action and projectile shapes
    context.ts        lookup tables built once from the content
    state.ts          match creation, pause, events, results
    step.ts           one tick: inputs in, new state and events out
    moveResolver.ts   which move a button press starts (attack grammar, buffering)
    physics.ts        movement, gravity, platforms, respawn
    combat.ts         hits, trades, knockback, projectiles
    items.ts          weapon pickups, drops and throws
    rules.ts          lives, ring-outs and match results
    waves.ts          wave-mode enemies and their arrival
    boss.ts           scripted champion bosses
    ai.ts             computer players (Easy, Hard, Extremely Hard)
    stats.ts          per-match statistics for balance reports
    replay.ts         replay recording, checking and playback
  campaign/src/               Story Archive levels, wrapping a sim match
    controller.ts     every level's tasks, hazards, companions and checkpoints
    specs.ts          per-level task list and context summaries
    bosses.ts         story boss move patterns
    goliath.ts        the level 41 David and Goliath reenactment
    giant.ts          Goliath's body in a fight (stance, shield hop, grapple)
    david-fights.ts   David's chapter fights: lion, bear and Goliath
apps/game/                    the browser game around the simulation
  shell.html, style.css       the page and its styles
  src/bootstrap.ts    checks embedded content and art, then starts the app
  src/runner.ts       turns display frames into exact 60 Hz ticks
  src/ui/
    app.ts            menus, screens, dialogs, HUD and the per-frame game loop
    lobby.ts          local multiplayer seats and the Ready check
    story-result.ts   wording of the story results card
    move-showcase.ts  live move previews in the move list
  src/input/
    inputs.ts         keyboard, touch and controller to game buttons
    keymap.ts         key remapping rules and the keyboard frame
    menu-nav.ts       moving through menus with a controller or arrow keys
  src/render/                 drawing only; never changes the simulation
    renderer.ts       draws each frame: camera, arena, fighters, effects
    arena-scenes.ts   each arena's backdrop and platform surfaces
    surface-cache.ts  paints platform surfaces once and reuses them
    encounter.ts      story hazards, markers, water, wind and companions
    goliath.ts        drawing Goliath and fighters he holds
    feedback.ts       screen shake, KO bursts, smoke and dust
    callouts.ts       combo counter, KO! and GO!
    hit-indicators.ts small markers where hits land
    elemental.ts      fire, water, wind, rock and light effects
    waypoint.ts       story arrow to the next task
    player-marks.ts   player shapes (circle, triangle, square, diamond)
    quality.ts        trims decoration on slow devices
    animation.ts      smoothing and run-cadence helpers
    grip.ts, shield-release.ts, gideon-rebound.ts
                      frame choice for held weapons and special moves
    weapons.ts, weapon-art.ts
                      drawing weapons from the embedded weapon sheets
    weapon-sprites.generated.ts
                      weapon sheets embedded as data (made by tools/art/import-weapons.ts)
    art-guard.ts      drops broken art so a match never crashes
    lazy-map.ts       decodes art only when first drawn
    preview-api.ts    exports used by the art preview pages
  src/audio/
    audio.ts          sound effects, made in code
    music.ts          arena music, made in code
  src/storage/
    profile.ts        the save file: progress, medals, settings, backup
    replays.ts        the saved-replays library
  src/training/
    lesson.ts         the seven-step first lesson
    drills.ts         advanced training drills
    combo.ts          combo counter and input history for training
assets/runtime/               art the game ships (fighters.json lists every sheet it loads)
assets/animation-production/  Codex's source drawings, prompts and preview pages
platform/pc/         Windows launcher
platform/ipad/       WKWebView wrapper source (unsigned)
tools/               content compiler, offline build, bot and balance reports
tools/art/           Codex's art pipeline: import, inspect and preview fighter art
tests/               content, simulation, campaign, replay, storage, UI, art, offline
production-pack/     design authority and canonical data (read-only input)
prototype/           preserved original two-fighter slice (reference only)
```

## Boundaries

- **Content.** `production-pack/09_Data/*.json` is the only gameplay data source. `tools/lib/content.ts` reads it, `compileContent` assembles and hashes it (sorted-key canonical JSON, sha256), and `validateContent` rejects anything outside the contract. The same validation runs at game startup, so corrupt content stops before any menu or match.
- **Simulation.** `createEngine(content)` returns pure functions over a serializable `SimState`. Inputs are semantic (`x`, `y`, buttons); randomness comes only from the seeded state RNG; iteration is in ascending entity id. No trig, no wall clock, no floating-point state.
- **Campaign.** `createCampaign(engine, content)` drives a sim match plus objectives, companions, hazards and checkpoints. It never touches the DOM.
- **App.** The UI reads state to render and dispatches only semantic inputs, pause, and controller calls. It never edits velocities, stocks or damage.
- **Art.** The renderer draws procedural development rigs unless a fighter in `assets/runtime/fighters/fighters.json` has shippable art (`runtime_alpha` or `concept_cut`). Concept sheets are never embedded. Collision always comes from `maps.json`.

## Commands

```bash
npm install            # pinned dev tools: esbuild, typescript
npm run validate:content
npm run typecheck
npm test
npm run build          # -> dist/PLAY.html + dist/build-manifest.json
npm run serve          # optional local preview of dist/
```

Node 24+ runs the TypeScript tools and tests directly (type stripping), so there is no separate compile step for development.

## Offline contract

The build fails if the page contains `fetch`, `WebSocket`, `XMLHttpRequest`, `importScripts`, `EventSource`, `sendBeacon`, or any external `src`/`href`/`url()`. The page ships with a `default-src 'none'; connect-src 'none'` content security policy and no external scripts, styles or fonts.
