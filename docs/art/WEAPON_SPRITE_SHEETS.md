# Weapon sprite sheets — 2 November 2026

Nine independent weapon sheets, sixteen views each: sword, spear, staff, hammer, bow, sling, dagger/blades, gauntlet and shield. The first eight cells are equipped angle views; the remaining eight are perspective flight views. Source images and exact imagegen prompts are preserved in `assets/animation-production/weapons`. They were made with the built-in imagegen tool and the combined contact sheet was visually inspected.

`weapon-sheets.html` displays every frame and animated equipped/flight examples. Runtime sheets are packed at 1024 square under `assets/runtime/weapons`. Their hashes, frame rectangles, physical sizes and grip pivots are recorded in `weapons.json`. `weapon-sprites.generated.ts` embeds these sheets in the offline bundle. It is generated, not hand edited.

The standalone equipped weapon layer now chooses the nearest drawn angle and applies only the residual rotation at the grip. Thrown weapons use the perspective flight sequence. Gideon's held shield and flying shield use this same atlas and physical scale; the flight sequence shows its bronze rim, wooden face, back straps and edge-on views. Body poses continue to handle anticipation, release, held follow-through and retrieval. Idle slings use their new sprite; charged sling cord rotation remains procedural. Existing full attack drawings containing baked weapons remain preserved.

Weapon images preload while the title screen is shown and are shared by all fighters. The original Canvas weapon drawings remain a loading/test fallback. No duplicate weapon is added over attack frames that already contain their own weapon.

Reproduce: `node tools/art/import-weapons.ts`, `node tools/art/inspect-weapons.ts`, `node tools/art/preview-weapons.ts`, both modes of `tools/art/preview-attacks.ts`, then `node tools/build.ts`.

TypeScript, offline build, all 254 tests and the attack-gallery smoke check passed. This includes all nine sheets, 16 frames per sheet, frame bounds, pivots and asset hashes. The gallery smoke check exercised 24,000 sprite draws. Interactive gameplay still needs hands-on review.
