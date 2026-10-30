# Biblhalla — main game development build

Open **PLAY.html** in a modern JavaScript-enabled browser. If the game is already open, reload the tab to load the new main build. No install command, server, account or internet connection is required to play this standalone artifact.

The supplied Covenant Clash production pack is archived in production-pack/. The original two-fighter playable prototype remains intact in prototype/PLAY.html. The top-level PLAY.html and main-game/PLAY.html now launch the new main implementation.

## Implemented

- Twelve selectable arena fighters, their two assigned weapons, complete unarmed attacks, and all 147 canonical move records.
- Six arenas using authored collision geometry; Q8 integer positions and a fixed 60-tick headless simulation.
- Directional attacks, charging, hitstun, entity hitstop, trades, limited projectiles, damage-based launches, stocks and ring-outs.
- Jump resources, dash, dodge, air cancel, recovery, ground pound, bounded wall assistance and chase movement.
- Neutral pickups, alternating weapon sequence, drops, reacquisition and throws.
- Easy, Hard and Extremely Hard computers; Duel, Waves and champion guard encounters.
- Story Archive with all 84 records connected to playable scene controllers, fourteen chapters, local checkpoints, progression, journal and chapter replay. All 57 noncombat routes passed semantic movement-input reachability testing. Combat scene completion tests use combat-success fixtures, and do not prove human playthroughs of all 27 encounters.
- Carrying, safe set-down/recovery, solo companion tasks, panel puzzles, lookout/obstacle routes, finite authored wave compositions and a non-damageable one-stone Goliath reenactment.
- The six final scenes use witness controls with no combat or jumping requirement; the empty tomb keeps separate Gospel-context cards.
- Same-device local duel, free-for-all and 2v2 configuration, with unique input assignments. One keyboard/touch player plus distinct physical controllers; no pass-and-play.
- Training with dummy settings and action/resource/hitbox diagnostics, a control check, remappable keyboard bindings, adjustable touch controls, reduced motion and captions.
- Validated local save backup/import/export, memory fallback and arena replay import/export with content/mechanics hashes.

## Controls

A/D or Left/Right moves; W/S or Up/Down aims. Space jumps. J is Light, K is Heavy, Shift is Dodge/Dash, L is Pickup/Throw, E is Interact, and Escape/P pauses. Hold Down with Jump to drop through a one-way platform; hold Down with L to drop a weapon. Grounded Heavy can charge. Aerial Heavy recovers; Down + Heavy ground-pounds.

Controller mapping: left stick/D-pad Move, South Jump, West Light, North Heavy, East Dodge, R1 Pickup/Throw, L1 Interact, Menu Pause. Connect and press a button before selecting a controller. Touch uses the labeled stick/buttons. Carrying disables attacks until delivery or safe set-down.

## Build and test

Built and tested with Node **26.8.1**. No third-party build/runtime package is required. TypeScript types are erased with Node's built-in stripTypeScriptTypes API. This is a transpilation build; a separate full TypeScript type-check has not run here. The tsconfig.json is included for a compiler-enabled environment.

From this folder:

~~~text
node build.cjs
node --test tests/main-game/*.test.cjs
~~~

npm run build and npm test run the same commands. If using the restricted Codex filesystem runner, add --preserve-symlinks --preserve-symlinks-main to Node to avoid its ancestor-directory realpath checks. These flags are unnecessary in a normal local terminal.

Build outputs are PLAY.html, main-game/PLAY.html, compiled content and docs/build-manifest.json. Tests include the simulation, campaign controllers, actual noncombat route inputs, saves, content, replay validation, and standalone script syntax/element wiring.

## Current verification and production gaps

On 14 October 2026, **57 automated tests passed with zero failures**. Raw output is in docs/test-results.txt. Deterministic 10,000-tick recordings pass for all three AI difficulties; snapshot replay and render-batching invariance also pass. The standalone file has no external runtime resource references and a connect-src none policy.

The browser tool rejected inspection of the file: page because its URL protocol is blocked. No browser rendering, actual touch/controller hardware, audio lifecycle or physical device certification is claimed. Attempts to acquire a full compiler and DOM test dependency did not complete; the dependency-free build and headless tests succeeded.

This is a main-game **development implementation**, not the completed shipping product described by every production acceptance gate. The all-level controller tests and reachability checks do not replace human playtesting or narrative review. The scenes adapt the supplied objectives to shared modular route/interaction systems. Detailed bespoke staging, some secondary task choreography, authored per-boss hazard sequences, exact attack-animation choreography and escape-gap instrumentation remain in the implementation backlog.

All gameplay artwork is original animated Canvas development rigs and vector scenery, with distinctive fighter palettes/accessories and collision-aligned platforms. The supplied opaque nine-panel paintings remain concept references in production-pack/; they are not used as runtime sprite sheets. Full hand-drawn production clips, layered regional artwork, balance approval and art/device review remain outstanding. See docs/IMPLEMENTATION_STATUS.md and docs/asset-readiness.json.

The iPadApp/ source project now bundles the main PLAY.html and calls the main game's lifecycle pause hook. It is **not a signed iPad app**. A Mac, Xcode, signing team and physical-device tests are required to produce and validate an installed iPad artifact. The preserved prototype's original iPad wrapper remains separate.
