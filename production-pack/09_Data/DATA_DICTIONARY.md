# Canonical prototype data dictionary

`fighters.json`: 12 playable identities, weapon pairs, three numeric stats, common capsule, 72 signature references and concept-image paths. Every animationStatus is not_created because concept generation does not produce runtime animation.

`weapons.json`: eight weapon families plus unarmed. Eight base entries per weapon, eight unarmed base entries and three unarmed grounded heavies = **75 shared entries**.

`attacks.json`: 75 shared/unarmed entries + 72 fighter signatures = **147 attack records**. Unique stable IDs, explicit context/direction/button, frame counts, damage, force, phase rectangles/projectiles, body motion and charge policy. Prototype geometry uses simple rectangles to establish coverage; final animation/contact review is still required.

`physics.json`: fixed simulation constants and integer direction table. Q suffix = fixed-point scale 256; velocities/force are Q units per tick, gravity/acceleration Q units per tick². Geometry lists named Units are unscaled authoring design units; compile them by ×256. Angles reference the fixed directionLookup; never call trig in the sim.

`maps.json`: six stage definitions, solid/one-way geometry, fixed blast bounds, four spawn feet positions, neutral pickup positions and approval state. RectUnits `[leftX,topY,width,thickness]` for maps; attack rectUnits `[leftX,bottomY,width,height]` for hit shapes. These different semantics are explicit: do not reuse the same conversion blindly.

`rules.json`: stocks, timer, respawn, pickups, items, same-device multiplayer limits, offline-only contract and difficulty IDs.

`roster_source.json` and `arena_source.json`: authoring/provenance inputs including image prompts. Runtime should consume the normalized files above, not positional source tuples.

All values are original design targets. None is extracted from another game. Cross-device determinism, final animation, actual balance, runtime performance and offline package completeness must be verified during implementation.

## Resource timing clarification

Recovery resource is consumed on accepted action start, not on active hit. `resourceCostOnActionStart` charges the resource. Motion events only apply their velocity/translation and do not consume resources again. Input legality, charge, hitstop, cooldown and collision behavior come from the specialized combat/physics prompts. The content loader must reject missing IDs, zero/negative sizes, unsafe numbers, unsupported directions and inconsistent totalTicks.

## Integer arithmetic

Validate all source numbers are finite safe integers after compilation. Fixed-point products use Number arithmetic with proven safe bounds; no bitwise position truncation. Direction vectors are scaled to 1024 and rounded intentionally; resulting diagonal magnitudes are approximate and stable. A document calling a move an arc describes visual choreography; the current collision envelope is a single-hit rectangle until refined and versioned.

## Campaign and implementation boundary

`campaign.json`: 84 sequential level IDs, fourteen chapters, encounter kind, references, objective, unique rules, finite waves, boss phases, checkpoint IDs and offline/difficulty contracts. All records are design_prompt_only. Individual Markdown prompts supply detailed implementation instructions. The separate prototype has its own simpler runtime data in simulation.js; it is not a drop-in engine for the 147 production attacks.
