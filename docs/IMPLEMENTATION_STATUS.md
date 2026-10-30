# Implementation and release status

The new main build uses the production pack's canonical numeric/data contract. Its rendered art and campaign staging are development implementations. The original prototype is separate and preserved.

| Requirement | Current implementation | Verification / remaining work |
| --- | --- | --- |
| Headless fixed Q8 simulation | Implemented in sim.ts | Integer-state, 10,000-tick replay and render-batching checks pass |
| 147 attacks / twelve fighters / eight weapon families plus unarmed | Canonical move grammar, authored boxes, timings and resources implemented | All grammar entries resolve; full final animation alignment and balance reviews outstanding |
| Pickups, drops, throws | Implemented, alternating neutral sequence and deterministic pickup priority | Regression tests pass |
| Duel / waves / champion | Implemented | Real result/stock/wave checks pass; sustained human playtesting remains |
| Three difficulties | Serialized delayed observation and legal semantic bot input | Stats remain shared; replay checks pass; human win-rate tuning remains |
| Six arenas | Collision geometry and original aligned vector platforms | Final layered arena artwork and visual inspection remain |
| 84 story levels | All data records connected to scene controllers and progression | Controller completions pass; 57 noncombat routes also complete with movement inputs; bespoke staging and human combat playthroughs remain |
| Bosses | Eleven authored boss records, shared legal attack/tell and guard phase controller; Goliath separate | Exact per-boss authored hazard and animation sequences remain partial |
| Companion/carry/puzzle/witness tasks | Implemented, with safe carry recovery, companion gates, original context and explicit finale restraint | Some multi-part secondary choreography is adapted; complete narrative review remains |
| Local 1v1 / FFA / teams | Unique input lobby and multiplayer simulation | Simulation/team rules tested; actual controller menu/hardware/lifecycle testing remains |
| Input and accessibility | Remappable keyboard, multitouch cancellation, controller mapping, touch sizing/handedness, reduced motion/captions | Browser/device lifecycle and keyboard/controller-only menu navigation need review; menus currently use keyboard focus/touch/mouse |
| Training | Dummy options, attack tick/resources and geometry overlay | Combo escape-gap/input-history instrumentation remains |
| Saves / journal / replay | Validated backup, import/export, memory fallback and content/mechanics hashes | Save and replay tests pass; actual Safari/WKWebView file export paths need device work |
| Art | Distinct original procedural rigs and vector regional scenery | Explicit development art; final hand-drawn clips and complete unique regional/cutscene asset production outstanding |
| PC package | Standalone self-contained PLAY.html | Offline static checks pass; browser and physical cold-launch certification not performed |
| iPad package | Updated local WKWebView source and lifecycle hook | Mac/Xcode compilation, signing and physical installed first-launch airplane-mode tests required |

These gaps prevent a shipping-approved claim. Continue from the actual code and remaining acceptance gates; the production prompts remain in production-pack/ for detailed review.
