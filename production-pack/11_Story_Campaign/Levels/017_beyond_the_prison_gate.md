# L017 — Beyond the Prison Gate

**Standalone level build prompt.** Chapter 03, The Divided Family; **One large boss**. Source context: **Genesis 40**. Status: detailed design prompt; not implemented in the separate combat prototype.

## Story and objective

Act as a level designer, narrative designer, combat engineer and accessibility reviewer. Build this fully offline level using the campaign master, enemy catalog and canonical mechanics. The prison account introduces patient service; an invented Gate Warden tests Dru’s timing. Chapter arc: Betrayal, exile and famine make forgiveness a costly choice.

Player task: **Ring out the Gate Warden and carry a message to Ken.** Unique rule: **A visible key-ring tell announces shield charges; waiting for recovery is more effective than repeated heavy attacks.** Dru is the default protagonist of invented archive tasks; Ken accompanies him as a pathfinding companion. Optional same-device co-op assigns Ken to a separate controller. The David-and-Goliath reenactment explicitly selects David instead. Do not invent a meeting of historical people from different centuries.

## Play space and pacing

Art setting: **fictional prison-yard training arena with two low ledges**. Use a side-on route of three 1280×720 view segments, with a boss/wave arena constrained to one readable view. Author collision separately from illustration. Start with a 220-unit safe bay, an objective marker at the next section, and a visible exit on the right. Use lower and upper routes separated by 120–180 units; mandatory jumps remain below the measured jump/recovery envelope. Escort bays have flat, protected footing. Boss arenas preserve a safe route after every hazard sequence. Do not draw foreground decoration across collision edges.

Target 4–7 minutes for an action level and 2–4 minutes for a witness level; these are design targets, not measured completion times. Build suspense through a new silhouette, a changing route and a reveal before introducing simultaneous pressure. Keep narrative camera shots outside active combat. Recovery checkpoints restore the start of the current section and never remove already seen story cards.

## Encounter script

Boss: **Gate Warden**. Exactly one active boss; no filler waves.

1. Shield advance: a 36-tick raised-key tell precedes a low charge; jump over it and punish 32 recovery ticks.
2. At 65% guard, alternate a vertical key-chain swing and a short shield rush; each locks its facing before active contact.
3. At 30% guard, use charge–pause–swing with a full 42-tick recovery. No added enemies; the boss remains one readable threat.

Use a separately authored boss hurtbox and clearly labeled guard/opening UI. Boss scale is an encounter rule visible before entry, never a hidden difficulty boost. Respect hit recovery and per-target ledgers. Never silently teleport, face-switch after the final tell or read a future player input. For Goliath, composure stages replace guard depletion; one decisive shot resolves the account.

## Difficulty and fairness

| Setting | Planning and assistance | Shared rules |
|---|---|---|
| Easy | 27-tick bot observation delay, 14-tick decisions; 1.5× environmental tell lead, route hints and optional assist checkpoints | Same player damage, hitboxes, weapon kit, opponent count and story outcome |
| Hard | 12-tick observation delay, 6-tick decisions; baseline tells and fewer route hints | Same combat stats and physical rules |
| Extremely Hard | 6-tick observation delay, 3-tick decisions; better spacing, recovery and dodge reads | Same damage and guard; every boss tell remains at least 24 ticks |

For noncombat levels, difficulty affects obstacle timing and optional clues only. Witness scenes ignore difficulty. The player may change difficulty at a checkpoint without losing story progress; local medals record the chosen setting. Do not describe a local medal as global ranking.

## Dialogue, source handling and continuity

Incoming unlock: L016. Completion opens L018. Opening fictional companion line: Ken: “We made it through the last page. What will beyond the prison gate ask of us?” Closing fictional companion line: Dru: “We can keep going. Stay beside me.” These are original game lines, never Scripture quotations or words attributed to God or Jesus.

Create a 20–40-second original narrator summary anchored to Genesis 40. Show Book / Chapter in a Context button. Separate labels **Bible account**, **Parable** where relevant, and **Invented archive challenge**. Preserve the recorded outcome even if the gameplay retries. Use original paraphrase by default; licensed quotations require recorded translation and permission. Do not treat an optional journal clue as a new prophecy or historical fact.

## Asset generation prompt

Create original hand-drawn 2D art for this location: fictional prison-yard training arena with two low ledges. Clean dark ink, warm cel shading, parchment accents and restrained jewel colors. Keep playable edges crisp and background contrast subdued. Output a 2560×1440 concept plus separately authored sky, far scenery, middle scenery, platform surfaces and foreground props. For actors, supply distinct silhouettes and 12-state animation requirements from the art pipeline. For this level, also create a chapter-card image showing beyond the prison gate without a HUD or invented quotation. This is a generation brief, not a claim that these additional assets already exist. Reuse supplied arena art only as a palette reference; do not copy another game’s map.

## UI, saves and acceptance

Display one objective sentence, visible pause, readable checkpoint marker and numeric lives when combat is enabled. Context, Journal and More options open from simple labeled buttons. Input is selected before first play: Keyboard, Touch or detected Controller. Show tooltips for that method. Use captions, no color-only puzzle clues, reduced motion, adjustable touch buttons and a visible Skip story button. Witness scenes suppress the combat HUD.

Persist level ID, checkpoint, difficulty, seen cards and completed flag locally with schema/content version and atomic recovery. Bundle all art, narration text, sound and reference context; external URLs in documentation are optional research links and never required at runtime. Pause on background, focus loss or controller disconnect. Retry works in airplane mode after a fresh installed launch.

Accept only when: every section can be completed from a clean save; Retry returns to a safe state; the documented unique mechanic is present; source and invention labels are visible; the next unlock occurs exactly once; controls work without stuck input; bosses/waves obey shared legality; no sacred figure becomes a damageable enemy; and all runtime requests remain within installed local assets. Record actual tests and unresolved device limits.
