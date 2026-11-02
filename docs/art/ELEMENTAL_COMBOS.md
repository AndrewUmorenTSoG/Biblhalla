# Elemental moves and aerial combos

Implemented 2 November 2026. The canonical roster now has nine weapon families and 172 attack records. All 12 fighters have 16 additional drawn sprite poses, plus four new Moses staff-spin poses (196 total). Existing art and source prompts are preserved.

## Controls

- WASD aim/movement, Space jump, J light, K heavy, Shift dodge/chase. Intentional keyboard remaps still apply.
- After an airborne light connects, press J during recovery for an aerial follow-up. At most two follow-ups; whiffs cannot cancel into this string. Existing confirmed-hit chase combos remain available.
- W or no direction selects neutral/up. A/D selects side; S selects down. In the air, S+K is ground pound and K is recovery.
- Hold K to charge, release to strike. Charge is capped at 36 ticks (0.6 seconds), adding up to 50% damage. Steam and a warm red tint indicate charging. Slings rotate through full circles at increased speed while charging. Charge does not add invulnerability.

## Fighter changes

| Fighter | Moves |
| --- | --- |
| Moses | Staff S+J and S+K produce a brief water surge on both sides, damaging and launching outward. |
| Caleb | Ground pounds burst rocks on landing. Gauntlet forward J punches, then claps, with a damaging sound projectile travelling 240 units. |
| David | Flaming sling pouch and sling stones that visibly leave on release. All slingers switch to an empty release pose; thrown stones and weapons have subtle wind trails. |
| Esther | Forward dagger J is a turning hurricane slash with forward knockback; dagger specials carry brief wind trails. |
| Nehemiah | Hammer + shield. Hammer down attacks send a rock wave forward; hammer ground pound also launches it on landing. Shield heavies return like a boomerang. |
| Samson | 10% extra damage and 5% damage resistance, on top of existing stats. Approximately 5% slower action timing (one held animation tick per twenty authored ticks). Small gauntlet splash; neutral gauntlet J/K grabs one opponent, lifts them, then punches. Large dust/wind impact effects. |
| Jonathan | Flaming arrows. Neutral/forward aerial sword light uses a drawn forward-somersault slash sequence. |
| Gideon | Sword + shield, replacing hammer. Neutral/side heavy throws the shield up to 160 units (four 40-unit body widths) before returning. One hit per target per throw; no duplicated pickup. |
| Joshua | Sword + shield. Down shield attacks slam; neutral/up shield attacks produce a quick upward sun beam. |
| Saul, Deborah, Miriam | New drawn aerial weapon sequences and capped air-combo follow-ups. Moses’s staff follow-up has four additional drawn rotation poses. |

## Art and preview

New source sheets and exact prompts: `assets/animation-production/elemental/`. Generated with the built-in imagegen tool. `contact.png` shows all poses. Runtime atlases: `assets/runtime/fighters/*-elemental-packed.png`.

The sequences use four distinct drawings each, with anticipation, strike and follow-through. Airborne families share sequences; this is not a unique full animation for every attack ID. Sprite registration stays above the origin line, and no legacy concept frames are selected. Original images remain intact.

`assets/animation-production/attacks.html` includes the shield, new moves, elemental effects, hitbox overlay and charged-heavy toggle. `down-attacks.html` filters down moves. The gallery uses the actual sprite renderer. The offline game is rebuilt at `dist/PLAY.html`.

Reimport only after reviewing later animation changes: `node tools/art/import-elemental.ts`, then `node tools/art/pack-fighters.ts --tag elemental --current`. The importer preserves its original manifest baseline. Regenerate both preview modes with `tools/art/preview-attacks.ts` and rebuild with `tools/build.ts`.

## Verification

TypeScript, content validation, strict art validation and all 241 tests passed. Dedicated checks cover shield range/return/hit budget, combo cap, grab/punch phases, splash, charge, Samson modifiers and timing, wave direction, landing-triggered impacts, effect expiry and sprite registration. The preview smoke runner exercised 21,216 sprite draws across every clip and charged-heavy paths. Contact sheets were visually inspected; interactive gameplay in the browser has not been manually verified in this pass. Balance values are an initial implementation and may need playtesting.
