# Running and movement response — 2 November 2026

Reviewed the supplied Brawlhalla recording, including a dense frame sequence of its ground movement and jump. Biblhalla's equipped run loop previously had only four poses and used a paint-time animation counter. New eight-pose loops include contact, compression, passing and flight for each leg, for both equipped weapons on all twelve fighters (192 new poses).

The renderer now accumulates actual ground distance at simulation ticks. Run phase follows that distance, including display interpolation, so painting at 30, 60 or 120 Hz does not reset or advance the gait differently. Brief stops and direction changes preserve phase. A full cycle covers 120 world units; faster travel plays the loop faster. Horizontal registration uses the common source-cell centre rather than alternating support feet.

Movement tuning: baseline run speed 6 → 7 units/tick; ground acceleration .75 → 1 unit/tick²; braking 1 → 1.5; air acceleration .375 → .5; dash speed 11 → 13. Reversal acceleration is 3 units/tick². Attack braking remains at its prior 1 unit/tick² so existing chase combos retain momentum. Jump height, attack windows and knockback values are unchanged.

The expanded runtime atlases are repacked with a 160-pixel reference standing height (previously 192), still above their normal 96-pixel display height. On-screen dimensions and hand registration are preserved. Smaller textures reduce decode and graphics memory cost. Original source artwork and prior atlases remain intact.

Sources and exact built-in imagegen prompts are under `assets/animation-production/run-cycles`. Selected corrected layouts contain exactly sixteen poses. Nehemiah's hammer-only correction replaces the generated wrong-weapon frames. Original rejected layouts remain for provenance. The imported run contact sheet was visually inspected.

Reproduce: `node tools/art/import-run-cycles.ts`; `node tools/art/pack-fighters.ts --tag smooth --body-pixels 160 --current`; `node tools/art/inspect-run-cycles.ts`; rebuild equipped/slinger/attack previews; `node tools/build.ts`. Importing restores an immutable baseline, so review later animation changes first.

Tests cover full loop order, phase continuity, teleport rejection, render-rate invariance, acceleration/braking/reversal, and existing combos. The equipped preview demonstrates both weapons for every fighter. This is a closer movement reference implementation; sustained FPS on the user's hardware has not been measured.

Final validation: TypeScript, offline build, preview smoke checks and all 262 tests passed. The offline page decreased from approximately 92 MB to 77 MB after repacking the expanded animation set.

The 4 November follow-up supersedes this eight-pose pipeline. See FLUID_RUNNING.md for the twelve-pose weapon and unarmed loops and current-manifest importer.
