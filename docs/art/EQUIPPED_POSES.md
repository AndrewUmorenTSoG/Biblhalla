# Equipped movement poses — 2 November 2026

Every roster fighter now has sixteen drawn poses for each of their two weapons (384 poses total): two resting idle poses, crouch transition and hold, four running phases, rise/apex/fall/landing, and guard/raise/strike/recovery. The weapon is part of the character drawing. The movement selector does not add the generic carried-weapon overlay to these frames.

The supplied staff recording showed different staff designs between resting and attacking. Staff wind-up, contact and recovery now use the matching equipped staff drawings. Moses's dedicated staff-spin combo is retained. Sling attacks also use the new equipped drawings so obsolete belt/back pouch details cannot reappear during those clips. The functional sling pouch remains attached to its cords.

S (the semantic Down action, respecting remaps) selects crouch when grounded and standing still. A/D uses running, W/Space retains the configured jump controls, and velocity selects rising/apex/falling frames. S + Light/Heavy still selects down attacks; S in the air retains fast fall. Crouching is a visual pose and does not shrink the gameplay hurtbox.

Source sheets and exact built-in imagegen prompts are saved under `assets/animation-production/equipped`. Corrected source variants preserve Gideon's sword and Nehemiah's round shield. The import extracts connected whole figures across cell boundaries, including thin weapon cords, to avoid neighboring-frame fragments. Original artwork remains preserved.

`equipped.html` previews both weapons for all twelve fighters, with idle/run/jump/crouch selectors and facing reversal. The attack and slinger previews and offline game are rebuilt. Standing registration uses the bottom of every sprite; no equipped frame crosses below its origin line. The combined equipped contact sheet was visually inspected.

Reproduce with `node tools/art/import-equipped.ts`, `node tools/art/inspect-equipped.ts`, `node tools/art/preview-equipped.ts`, both attack preview modes, the slinger preview, and `node tools/build.ts`. Review later manifest changes before reimporting: the importer preserves its original baseline.

Validation covers all 384 frame slots, runtime movement selection, crouch/down-attack input, attack contact timing, weapon retention, atlas integrity and gallery playback. Interactive gameplay and sustained FPS have not been manually measured in this pass.
