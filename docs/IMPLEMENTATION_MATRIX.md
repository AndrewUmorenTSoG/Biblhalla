# Implementation matrix

Status key: **yes** done and evidenced · **partial** some coverage, gaps listed · **no** not started · **n/a**.
"Playable" means reachable through the real menus in `dist/PLAY.html`. "Reviewed" means a human (art, narrative, balance or device) sign-off, which nothing has yet.

Last updated: 2026-10-30 (phase 2: movement and combat audited against the gameplay specs).

| Area | Designed | Implemented | Playable | Tested | Reviewed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Content compiler and schema validation | yes | yes | n/a | yes | no | `packages/content`; corrupt or missing data fails with a path-level message |
| Fixed 60 Hz Q8 simulation, seeded RNG, stable ids | yes | yes | partial | yes | no | Same-seed hash, snapshot restore and 30/60/120 FPS batching tests pass |
| Fixed-step runner (5-tick catch-up) | yes | yes | partial | yes | no | Pauses only on sustained overload (30 frames) |
| Offline single-file bundle | yes | yes | partial | yes | no | Page boots in a browser with no console errors; in-game loop not browser-verified yet |
| Movement (run, jumps, dash, dodges, wall, recovery, fast-fall) | yes | yes | partial | yes | no | Ported engine; parity suite passes |
| Attack grammar, all 147 records | yes | yes | partial | yes | no | Every record resolves; animation alignment pending |
| Hit resolution, trades, hitstop, projectiles | yes | yes | partial | yes | no | Charge uses authored permille; projectile hits no longer freeze the shooter; launch ties by instance; knockback holds through hitstun |
| Weapons: pickup A/B/A, drop, throw, reacquire | yes | yes | partial | yes | no | Thrown weapons drop after a hit too; pickups clear stale buffers; drop keeps respawn protection |
| Bots: Easy / Hard / Extremely Hard | yes | partial | partial | yes | no | Per-tick recovery and edge safety; `tools/bot-harness.ts` self-KO rate ~7–27% Easy, ~20–47% Hard/Extreme (4-match sample). Full candidate scoring and 200-match runs pending |
| Modes: duel, waves, boss, training, 1v1, FFA, 2v2 | yes | yes | partial | yes | no | Team tiebreak by summed stocks/damage; simultaneous final KO goes to sudden death, then draw; farthest-from-enemy respawn; blast test at centre (+37). Controller hardware not tested |
| Runtime fighter atlases (12 fighters, A/B/unarmed) | yes | no | no | no | no | Procedural rigs only; concept sheets excluded from build |
| Layered arenas (6) | yes | partial | partial | no | no | Collision from maps.json; scenery is procedural |
| VFX and audio feedback | yes | partial | partial | no | no | Minimal hit rings and synth cues |
| Menus, input selection, pause, results | yes | partial | partial | partial | no | Legacy UI ported as-is; Phase 4 rewrite planned |
| Touch, controller, remapping, accessibility | yes | partial | partial | no | no | |
| Profile saves, backup, import/export | yes | yes | partial | yes | no | |
| Replay export/import and checksum | yes | yes | partial | yes | no | |
| Campaign controllers (84 levels) | yes | partial | partial | partial | no | Generic shared controllers; bespoke staging per level pending |
| Witness finale (79–84), no combat | yes | yes | partial | yes | no | Narrative review pending |
| iPad wrapper | yes | partial | no | no | no | Unsigned source; needs Mac/Xcode and a device |
| Device and installed offline QA | yes | no | no | no | no | |
