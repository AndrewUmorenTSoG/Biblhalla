# Asset integration and readiness prompt

Act as technical art integrator. Inventory every delivered image, written prompt and data entry before importing art into runtime. Read `10_Generated_Artwork/ASSET_CATALOG.md`. The generated images are opaque reference paintings with illustrated moves; they do not include separated body parts, transparent runtime sprites, frame timing, clean platform layers or final animation rigs.

## Readiness states

Concept complete: identity, palette and example key poses exist.
Animation-ready: approved model and clean parts/frames exist, stable pivots documented.
Runtime-ready: exported atlases/metadata validate, timing/contact alignment reviewed, loading/memory tested.
Shipping-approved: actual device match review and provenance complete.

All supplied generated PNGs start at **Concept complete**. A file named move_sheet does not prove animation readiness. The physics/attack JSON is a prototype design starting point, not a finished tested engine. Keep these distinctions in README and any developer report.

## Import plan

1. Use each reference sheet’s nine-panel key to lock face, clothes and signature intent.
2. Redraw/cut clean production components or generate validated individual animation frames; no parchment or panel numbers in gameplay.
3. Author each attack’s startup, contact and recovery with the written S/A/R contract. Six signature poses become six independent clips, not six successive frames of one attack.
4. Export trimmed alpha atlases, pivot/socket metadata and manifest. Confirm mirrored art and limb/prop continuity.
5. Redraw each arena into layers aligned to exact JSON platforms. Concept artwork platform placement may be approximate and is never collision truth.
6. Validate asset paths, dimensions, atlas bounds, frame duration, alpha edges, provenance and memory budgets.
7. Inspect final matches on iPad and PC with debug overlay and reduced-motion/low-quality modes.

## Production filenames

`fighters/{id}/atlas_{weapon}_{page}.png`, `fighters/{id}/animations.json`, `portraits/{id}.png`, `arenas/{id}/{sky,far,mid,platforms,foreground}.png`, `arenas/{id}/layers.json`, `vfx/{event}/atlas.png`, `audio/{bus}/{event}.ogg` plus a browser-tested alternate encoding where needed. Paths are lowercase/underscore stable IDs. Atlas metadata should reference content hashes; missing assets fail validation before release.

## Provenance

Record image-generation prompt, generation date, reference source if any, manual edits, artist/approval and readiness. No existing-game images were used as edit targets in this concept batch. The exact image prompts are saved in `08_Art_Prompts`. Do not imply these generated designs are historically exact reconstructions or copy another game’s art packages.

## Acceptance

Every shipped animation entry resolves to valid alpha frames/rigs. Every fighter’s two weapon variants and unarmed states are covered. Every stage collision line visually aligns with the platform top. A changed costume does not change hurtbox. Missing final assets remain tracked honestly; release uses neither opaque nine-panel sheets as fighters nor guessed painting collisions.
