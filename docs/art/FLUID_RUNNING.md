# Fluid running - 4 November 2026

All twelve fighters receive twelve-pose running loops for their first weapon, second weapon and empty hands: 432 drawings. The standing equipped sprites are the identity references, preserving current faces, hair, outfit and weapon designs. Original run artwork remains available. Generated sources, identity references, pose guide and exact prompts are in assets/animation-production/fluid-runs. Moses has a staff-length correction and Nehemiah and unarmed Deborah have transparency corrections; the selected source paths are recorded in fighters.json.

The importer updates only run drawings and the unarmed run clip in the current manifest. A single model scale is used across each equipped sheet; empty-hand sheets have their own single scale matched to the same standing height. Head-silhouette registration reduces horizontal shuffling. Contact frames sit on the standing line. A small two-step flight lift keeps feet above that line, never below it.

Playback uses twelve poses per 24 animation ticks over 168 world units, replacing the faster eight-pose cycle over 120 units. It follows interpolated ground distance at the fixed simulation rate and preserves phase through brief stops and turns. Movement speed, attack timings and hitboxes remain as before. Unarmed run frames also carry registered forward-fist coordinates for weapons picked up from other fighters. Rendering still draws one character sprite per fighter; it adds no runtime image warping or frame blending.

The original temporary Brawlhalla video file has disappeared from the ScreenSketch folder. Review used the previously extracted dense frame sequence in artifacts/reference-run-dense.jpg. This is an original character redraw and gait refinement, not an exact recreation of the reference game's assets or measured animation data.

Rebuild: node tools/art/import-fluid-runs.ts; node tools/art/pack-fighters.ts --tag fluid --body-pixels 160 --current; node tools/art/inspect-run-cycles.ts; rebuild equipped/slinger/attack galleries; npm run build. The importer preserves the current non-run work; its initial manifest backup is provenance only. Use this importer instead of the older baseline-restoring import-run-cycles.ts.

The equipped gallery includes empty hands, pause, next pose, speed controls and facing reversal. Tests cover all 36 run loops, no skipped normal-speed poses at 60/120 Hz, phase invariance at 30/60/120 Hz, stop/turn continuity, frame bounds and ground clearance. Actual hardware FPS and manual in-browser gameplay still require checking.

Final validation: all 273 tests, TypeScript, strict art validation and attack preview smoke checks passed. Registered Canvas renders were inspected for all twelve equipped and unarmed cycles. Offline HTML rebuilt at approximately 80 MB. Built-in imagegen produced the source art; prompts are archived beside the sheets.
