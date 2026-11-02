# Equipped weapon holding

Reviewed the supplied 14:24 gameplay recording and 14:32 sword/staff reference on 2 November 2026. The existing body sheets contain no weapons in movement poses. Their weapon overlay used an approximate frame percentage and was hidden behind the body. Shared body frames in armed combos omitted the overlay entirely.

Movement and shared body sprites now carry individual hand coordinates. The weapon renders after the body and the original fingers render over its handle. This applies during idle, running, airborne phases, dodge/recoil, and shared body combo transitions. Attack drawings that already include the weapon retain their own equipment. Idle slings hang under gravity from the fist; charging uses the fast rotating sling motion. Swords and staves use larger, readable carried silhouettes.

Pickup uses a lowering/reaching pose and then a holding pose. The generic item throw uses anticipation, an extended release at the six-tick throw startup, follow-through and recovery. The simulation's weapon ownership still decides whether the hand contains a weapon, so a thrown item is not also held. Shield retrieval keeps its dedicated state-driven poses.

Movement animation receives fractional display time alongside the existing positional interpolation. Simulation timing stays fixed. This improves display cadence; a sustained frame-rate measurement on the user's hardware has not been performed.

`node tools/art/hand-grips.ts` updates hand coordinates and writes the reviewed contact sheet `assets/animation-production/hand-grips.png`. Run it after reimporting body sprites. Tests cover hand bounds, body/weapon/finger drawing order, retention through shared body frames and throw pose order. The offline game and attack galleries are rebuilt from the same renderer.
