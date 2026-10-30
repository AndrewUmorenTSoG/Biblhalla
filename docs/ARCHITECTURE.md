# Biblhalla architecture

Biblhalla is an offline TypeScript game. Everything the player needs is compiled into one self-contained page (`dist/PLAY.html`), which the PC launcher opens directly and the iPad WKWebView wrapper bundles as a resource.

## Layout

```text
packages/
  content/src/   types, validation, compiler (pure, no Node/DOM)
  sim/src/       deterministic 60 Hz Q8 simulation (pure, no DOM/storage/clock)
    fixed.ts        Q8 helpers, seeded xorshift RNG, FNV state hash
    types.ts        state, input, action, entity shapes
    context.ts      per-content lookup tables
    state.ts        match creation, pause, events, results
    moveResolver.ts input legality and attack grammar
    physics.ts      movement integration, stage collision, fighter update
    combat.ts       hit detection, trades, knockback, projectiles
    items.ts        pickups, drops, throws
    rules.ts        stocks, ring-outs, waves, match results
    ai.ts           Easy / Hard / Extremely Hard bots on delayed observations
    step.ts         step(state, inputFrames) -> state + events
    replay.ts       semantic replay record, validation, resimulation
  campaign/src/  Story Archive scene controllers (pure; wraps a sim match)
apps/game/
  shell.html, style.css
  src/bootstrap.ts   validates embedded content, then starts the app
  src/runner.ts      fixed-step accumulator (max 5 catch-up ticks)
  src/input/         keyboard, touch, controller -> semantic frames
  src/render/        Canvas 2D renderer (read-only view of state)
  src/audio/         synthesized feedback cues
  src/storage/       versioned profile, backup, import/export
  src/ui/            menus, dialogs, display loop
platform/pc/         Windows launcher
platform/ipad/       WKWebView wrapper source (unsigned)
tools/               content compiler, offline build, dev preview server
tests/               content, simulation, campaign, replay, storage, offline
production-pack/     design authority and canonical data (read-only input)
prototype/           preserved original two-fighter slice (reference only)
```

## Boundaries

- **Content.** `production-pack/09_Data/*.json` is the only gameplay data source. `tools/lib/content.ts` reads it, `compileContent` assembles and hashes it (sorted-key canonical JSON, sha256), and `validateContent` rejects anything outside the contract. The same validation runs at game startup, so corrupt content stops before any menu or match.
- **Simulation.** `createEngine(content)` returns pure functions over a serializable `SimState`. Inputs are semantic (`x`, `y`, buttons); randomness comes only from the seeded state RNG; iteration is in ascending entity id. No trig, no wall clock, no floating-point state.
- **Campaign.** `createCampaign(engine, content)` drives a sim match plus objectives, companions, hazards and checkpoints. It never touches the DOM.
- **App.** The UI reads state to render and dispatches only semantic inputs, pause, and controller calls. It never edits velocities, stocks or damage.
- **Art.** The renderer draws procedural development rigs unless an asset in `assets/manifest.json` is marked `runtime_alpha`. Concept sheets are never embedded. Collision always comes from `maps.json`.

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
