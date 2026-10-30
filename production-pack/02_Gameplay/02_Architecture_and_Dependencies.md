# Offline architecture and dependency prompt

Build a deterministic production simulation independent of renderer, DOM, storage and wall-clock time. The production TypeScript/PixiJS-family stack is locally bundled; exact compatible versions are verified/pinned at implementation. The separate prototype uses classic JavaScript and Canvas without runtime packages.

```text
apps/game/src/{bootstrap,input,render,ui,audio,assets,storage,campaign}
packages/sim/src/{fixed,state,moveResolver,physics,combat,items,rules,ai,replay}
packages/content/{fighters,weapons,moves,maps,levels,schemas}
platform/{pc,ipad}
tests/{simulation,replay,content,lifecycle,offline,device,accessibility}
tools/{atlasValidation,contentValidation,replayInspection,balanceHarness}
```

Reproducible dev/build/test/validate:content commands produce a standalone installed build. Build dependencies are tooling, not player launch requirements. No service package, credentials or account domain belongs in the runtime.

Simulation boundary: `step(state, inputFrames, content, tick) -> state + events`. It receives semantic inputs and seeded randomness only. Renderer consumes read-only state/events; UI dispatches actions and never edits velocity/stocks. Snapshot includes content/rules hash, tick, RNG, fighters, projectiles, items, spawn schedules, scores, bot memory and campaign controller state. Stable IDs and stable ascending iteration prevent order-dependent contact results.

Production uses Q8 integer coordinates from canonical physics, bounded safe Number arithmetic and authored integer direction tables. Do not use trig or unseeded random in the simulation. Replays store a nonzero seeded RNG state, initial state and ordered inputs. Restore and resimulate must match hashes. Bot decisions are serialized and pass the same legality resolver.

Rendering accumulator advances fixed 60 Hz ticks and interpolates. Bound catch-up to five ticks per frame; under sustained backlog reduce effects or pause with a performance message rather than silently corrupting active timing. Pause stops ticks, clears pressed/held state and resumes deliberately. Rendering helpers can use floating-point interpolation without mutating canonical state.

Load from installed bytes, feature-test Canvas/WebGL, initialize audio on a user gesture, keep semantic menus usable while decoding art, and show useful asset errors. Avoid baseline requirements for shared memory, workers or a particular fullscreen API. Storage has validated versioned records and in-memory fallback. All content must be available on first installed airplane-mode launch.

Produce module/schema diagrams, dependency lock, compiler, headless runner and replay checksum suite. Compare 10,000-tick recordings in supported PC runtime and actual iPad runtime; test snapshot restore, rematch and schema migration. The prototype has narrower smoke tests and a separate documented implementation contract; do not mislabel it the full Q8 simulation.
