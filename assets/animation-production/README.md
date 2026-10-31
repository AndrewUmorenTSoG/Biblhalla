# Biblhalla animation production

## Armed attack integration

`attacks.html` previews all twelve fighters and eight original Canvas weapon designs. Each fighter now has 22 armed attack clips whose anticipation, active contact and recovery durations match canonical move data. Signature contacts retain their distinct existing poses. The two generated weapon rows supply shared anticipation/recovery; this is an animation alpha pass, not 264 independently drawn sequences. Frames with substantial side-edge clipping are excluded from playback. Unarmed attacks, dodge/hit reactions, and bespoke directional inbetweens remain unfinished.

Reproduce with `node tools/art/import-attacks.ts`, then `node tools/art/preview-attacks.ts` and `node tools/build.ts`. Original movement manifests and images are preserved. Weapon designs live in `apps/game/src/render/weapons.ts` and are used for equipped overlays, procedural characters, and thrown weapons; weapons already painted into fighter sprites retain their existing artwork.

The twelve `*-animation-prompts.json` files specify the full roster's movement and attacks: 38 clips per fighter, 456 clips total. Attack timing and collision references come directly from the canonical production data. These files are production specifications, not completed animation coverage.

The `*-animation-draft.png` images are first-pass drawings generated with the built-in image generation tool. Each requests 8 columns and 4 rows: running, weapon A attack, weapon B attack, and jump phases. David's weapon rows are sword then sling. They are not runtime-approved atlases. The first inspected sheets have weapons crossing cell boundaries and repeated locomotion poses; fixed-grid slicing would clip artwork.

Before any sheet can replace runtime art, separate and clean its frames, align feet and scale, verify each silhouette and grip against the established character reference, preview the loop, and match attack contact to the canonical startup/active/recovery ticks. Missing signatures, directional attacks, weapon-specific movement, dodge and hit reactions still require their own drawn sequences. Do not report the 456 specifications as 456 finished animations.

## Integrated movement pass

All twelve fighters now have eight running frames and ascent, apex, descent, landing, and neutral poses packed into sibling `*-movement.png` runtime atlases. `tools/art/import-movement.ts` removes faint residue and detached speckles, retains the character silhouette, aligns its torso and feet, and preserves the original atlases. The manifest backup is `assets/runtime/fighters/fighters-before-movement.json`.

Running uses a 15-frame-per-second cycle driven by simulation ticks. Airborne art follows vertical velocity, so falling does not accidentally loop back to takeoff. A short landing pose plays when coming to rest. The game remains labelled `concept_cut`: weapon attack sequences and final animation polish are still incomplete. The generated attack rows have not been substituted for the existing attack poses.

Open `playback.html` to inspect the extracted movement for the full roster. Rebuild it with `node tools/art/preview-movement.ts`. Open `review.html` for the original draft sheets and prompt specifications.
