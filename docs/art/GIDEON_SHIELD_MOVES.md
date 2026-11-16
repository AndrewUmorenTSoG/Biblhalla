# Gideon's shield moves

Implements the additional shield moves requested from the supplied recording `20261116-1138-01.6367856.mp4`. Studied the complete timeline and dense sequences at 3.00–4.92 s (forward rush and airborne bash), 7.60–10.36 s (rising lift and charged rush), and 16.10–18.38 s (repeated rising shield strikes). Gideon retains his own costume and blue-and-gold weapon artwork.

## Controls and behaviour

| Input with shield equipped | Move |
| --- | --- |
| A/D + K on the ground | Shield Rush: load, drive forward behind the shield, impact, brake into guard |
| K on the ground | Rising Shield: crouch, lift the shield through an upward arc, rise and recover |
| S + K on the ground | Existing jumping rebound throw, floor bounce and retrieval |
| J | Quick shield bash |
| A/D + J | Advancing shield bash |
| S + J | Fully extended low shield thrust |
| Airborne J / A/D + J / S + J | Aerial shield sweep / forward bash / downward spike |
| Airborne K / S + K | Rising recovery / shield-first ground pound |
| J after an aerial light connects | Existing two-link air-combo system with new shield drawings |

W remains Jump, S remains Down. No defaults, saved profiles or deliberate remaps are changed. Neutral grounded Heavy is the lift; W is not repurposed as an aiming modifier. Existing gravity-cancel grammar still permits grounded signatures in the air.

The rush and lift replace Gideon's formerly identical neutral/side boomerang signatures. Both use 16 startup ticks, stay vulnerable, retain charge scaling and strike once per target. Rush: 12 active / 22 recovery, 8 units forward per active tick, total travel 96 units, with normal stage collision. Lift: 10 active / 24 recovery, 8 units/tick initial upward velocity and an upward melee hit zone. The existing S+K thrown-shield move retains its origin, floor rebound, return delay and catch logic. Other fighters' shield attacks and the shared weapon balance remain unchanged.

## Artwork and integration

80 additional hand-drawn body poses: 16 rush, 16 lift, 16 sweep/bash, 16 aerial bash/spike/landing and 16 dedicated low-thrust poses. Eleven action clips use the new drawings; fast shared light attacks use selected poses timed to their existing collision frames. A charge pose is held instead of cycling through the attack. Finished actions settle to the existing equipped shield idle. The lowest lift drawing, which would put the shield below the floor, is retained as source art but excluded from playable clips in favour of the next crouched drawing.

The low-thrust correction replaces the former shield_dlight contact drawings, which bent the elbow and only reached 49–68 units despite a 98-unit hitbox. The new sixteen-pose sequence plants the rear foot and extends the shoulder, elbow and fist throughout all four impact ticks. The shield hand reaches 70–82 units ahead, with the weapon's outer rim extending farther. Four fighter-specific contact rectangles are derived from these shield centres and the actual equipped weapon size; combat uses them only for Gideon. Other shield users retain their existing shared collision phases. Tests check actual shield-to-dummy capsule contact in both directions and reject hits in empty space behind or beyond the shield. `dlight-contact.png` shows the real simulation before impact, at contact and in follow-through.

The shield is always the existing equipped weapon sprite, placed at each drawing's registered fist with fingers layered over the grip. These melee moves never spawn a second shield. The rebound throw continues to detach and return the existing weapon artwork. All new body frames register their feet above the origin line; no legacy concept cutout is used.

The original Gideon atlas was already near its 2048-pixel budget. A separate **1024 × 698** texture adds the new drawings without resizing or repacking existing art. Build embedding checks every page hash, art validation checks every frame against its own page, and runtime decodes the small action page on the menu. If a page is missing or has not decoded, the renderer safely uses the existing equipped idle rather than drawing a wrong crop. The offline page embeds both textures.

Source sheets and exact imagegen prompts are in `assets/animation-production/gideon-shield-kit/`. `contact.png` shows all 80 poses with the actual weapon. `PLAY.html` runs the game simulation with move selection, mirrored facing, charging, an optional contact dummy, pause and single-tick stepping. The previous rebound preview links to this complete shield preview.

## Validation

- 328 tests passed, including new tests for mirrored rush travel/braking, wall collision, charging and damage, one-hit accounting, rising shield contact, shared air/recovery grammar and rendering from the correct texture page.
- TypeScript and strict art validation passed. Full offline game and attack galleries rebuilt.
- Simulation preview exercised all twelve shield moves, left/right and charged/uncharged: 48 runs. Existing rebound preview and all-character attack gallery smoke checks passed.
- Visually inspected the equipped 80-pose contact sheet and rendered simulation sequences for rush, lift and rebound.
- Verified all eleven other fighter entries, all 382 existing Gideon frame records and every attack except Gideon's two updated signatures and the shield_dlight contact override are unchanged.

Browser gameplay and hardware FPS were not measured by these Canvas and simulation checks. The new moves run on the existing fixed 60-tick simulation and interpolated renderer.

Rebuild assets and previews:

```powershell
node tools/art/import-gideon-shield-kit.ts
node tools/art/preview-gideon-shield-kit.ts
node tools/art/preview-gideon-rebound.ts
node tools/art/preview-attacks.ts
node tools/art/preview-attacks.ts --down-only
npm run art:check -- --strict
npm run typecheck
npm test
npm run build
```
