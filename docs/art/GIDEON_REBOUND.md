# Gideon - Rebounding Shield

Reference: supplied ScreenSketch recording 20261116-1138-01.6367856.mp4 (30 fps, 29.67 seconds). Inspected its timeline and a dense sequence from 1.0-2.47 seconds: crouch, rising somersault, down-forward disc release, one floor rebound, retrieval and landing.

S + K by default selects Gideon's grounded Down + Heavy with the shield. W remains Jump. Existing remaps feed the same semantic input. Holding Heavy charges at action tick 8 while crouched, before takeoff, so a charged throw cannot accidentally fall back to the floor before jumping. Takeoff tick 9, release tick 24; base action 24 startup / 8 active / 36 recovery ticks. The hop is authored motion, not a separate jump input or jump-resource purchase. Existing aerial ground-pound grammar remains unchanged.

Sixteen newly drawn empty-hand body poses preserve Gideon's model and outfit. A separate layer attaches the existing blue/gold shield artwork at registered hand anchors. The layer is hidden only when the actual projectile exists; catch events are collected on the painted tick. Authored body art supplies weight and follow-through, with a continuous rising somersault from ticks 9-24 (omitted with reduced motion). Release and catch anchors are derived from the corresponding drawings. Body weight rotation is disabled for this move so it cannot shift the release away from the physical hand.

The shield travels down-forward at 45 degrees, stays within the four-body-width range, rebounds once on a floor or platform top, then returns. Rebound sparks/dust and brief golden motion lines add impact while the shield remains the existing weapon sprite. Charge retains the existing return-delay scaling. An interruption recalls the projectile immediately; one-hit-per-target accounting prevents repeated damage on rebound or return.

The projectile is created after the launch frame's fighter movement, aligning the release with the jumping hand. Optional authored-origin, catch-origin and floor-bounce data are validated. Other characters' moves and artwork are retained. The importer repacks only Gideon's atlas and preserves its other frames and clips. Source, exact built-in imagegen prompt, registered-pose contact sheet and playable simulation preview live in assets/animation-production/gideon-rebound.

Reproduce: node tools/art/import-gideon-rebound.ts; node tools/art/preview-gideon-rebound.ts; rebuild attack galleries; npm run build. Tests cover S+K without W, launch timing and origin, mirrored bounce/catch, charging before takeoff, interruption return and all sixteen poses. Manual browser gameplay and hardware FPS are not measured by the Canvas smoke checks.

Validation: all 318 tests passed against current main, including the existing shield-return contact fixes and new menu/animation work. TypeScript, strict art validation and charged/uncharged mirrored simulation-preview checks passed. The offline game and attack galleries were rebuilt. Registered poses were visually inspected using the actual weapon artwork. Original source artwork and unrelated local work were preserved.

Integration preserved all eleven other fighter entries and all 366 pre-existing Gideon drawings pixel-for-pixel. The repacked Gideon atlas remains within the existing 2048-pixel texture budget.
