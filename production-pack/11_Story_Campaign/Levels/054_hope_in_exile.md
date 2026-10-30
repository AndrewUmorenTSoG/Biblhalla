# L054 — Hope in Exile

**Standalone level build prompt.** Chapter 09, Voices in the Storm; **One large boss**. Source context: **Jeremiah 29-31; 2 Kings 25**. Status: detailed design prompt; not implemented in the separate combat prototype.

## Story and objective

Act as a level designer, narrative designer, combat engineer and accessibility reviewer. Build this fully offline level using the campaign master, enemy catalog and canonical mechanics. Jerusalem’s fall ends the kingdom arc, while Jeremiah’s promises preserve hope. Chapter arc: Prophets call people back; judgment and promised restoration are held together.

Player task: **Defeat the invented Siege Captain and escort Ken to the archive shelter.** Unique rule: **The defensive success cannot prevent the recorded exile; do not show player victory as rewriting Jeremiah or erasing suffering.** Dru is the default protagonist of invented archive tasks; Ken accompanies him as a pathfinding companion. Optional same-device co-op assigns Ken to a separate controller. The David-and-Goliath reenactment explicitly selects David instead. Do not invent a meeting of historical people from different centuries.

## Play space and pacing

Art setting: **fictional refugee training route beside the fall-and-exile gallery**. Use a side-on route of three 1280×720 view segments, with a boss/wave arena constrained to one readable view. Author collision separately from illustration. Start with a 220-unit safe bay, an objective marker at the next section, and a visible exit on the right. Use lower and upper routes separated by 120–180 units; mandatory jumps remain below the measured jump/recovery envelope. Escort bays have flat, protected footing. Boss arenas preserve a safe route after every hazard sequence. Do not draw foreground decoration across collision edges.

Target 4–7 minutes for an action level and 2–4 minutes for a witness level; these are design targets, not measured completion times. Build suspense through a new silhouette, a changing route and a reveal before introducing simultaneous pressure. Keep narrative camera shots outside active combat. Recovery checkpoints restore the start of the current section and never remove already seen story cards.

## Encounter script

Boss: **Siege Captain**. Exactly one active boss; no filler waves.

1. Shield rush: 42-tick flag tell, locked lane, 36-tick recovery; jump behind and counter.
2. At 65% guard, an overhead slam marks a different lane for 42 ticks; keep the refugee bay untargetable.
3. At 30% guard, alternate rush and slam without adds; a 48-tick recovery opens the final punish. The historical exile still follows.

Use a separately authored boss hurtbox and clearly labeled guard/opening UI. Boss scale is an encounter rule visible before entry, never a hidden difficulty boost. Respect hit recovery and per-target ledgers. Never silently teleport, face-switch after the final tell or read a future player input. For Goliath, composure stages replace guard depletion; one decisive shot resolves the account.

## Difficulty and fairness

| Setting | Planning and assistance | Shared rules |
|---|---|---|
| Easy | 27-tick bot observation delay, 14-tick decisions; 1.5× environmental tell lead, route hints and optional assist checkpoints | Same player damage, hitboxes, weapon kit, opponent count and story outcome |
| Hard | 12-tick observation delay, 6-tick decisions; baseline tells and fewer route hints | Same combat stats and physical rules |
| Extremely Hard | 6-tick observation delay, 3-tick decisions; better spacing, recovery and dodge reads | Same damage and guard; every boss tell remains at least 24 ticks |

For noncombat levels, difficulty affects obstacle timing and optional clues only. Witness scenes ignore difficulty. The player may change difficulty at a checkpoint without losing story progress; local medals record the chosen setting. Do not describe a local medal as global ranking.

## Dialogue, source handling and continuity

Incoming unlock: L053. Completion opens L055. Opening fictional companion line: Ken: “We made it through the last page. What will hope in exile ask of us?” Closing fictional companion line: Dru: “We can keep going. Stay beside me.” These are original game lines, never Scripture quotations or words attributed to God or Jesus.

Create a 20–40-second original narrator summary anchored to Jeremiah 29-31; 2 Kings 25. Show Book / Chapter in a Context button. Separate labels **Bible account**, **Parable** where relevant, and **Invented archive challenge**. Preserve the recorded outcome even if the gameplay retries. Use original paraphrase by default; licensed quotations require recorded translation and permission. Do not treat an optional journal clue as a new prophecy or historical fact.

## Asset generation prompt

Create original hand-drawn 2D art for this location: fictional refugee training route beside the fall-and-exile gallery. Clean dark ink, warm cel shading, parchment accents and restrained jewel colors. Keep playable edges crisp and background contrast subdued. Output a 2560×1440 concept plus separately authored sky, far scenery, middle scenery, platform surfaces and foreground props. For actors, supply distinct silhouettes and 12-state animation requirements from the art pipeline. For this level, also create a chapter-card image showing hope in exile without a HUD or invented quotation. This is a generation brief, not a claim that these additional assets already exist. Reuse supplied arena art only as a palette reference; do not copy another game’s map.

## UI, saves and acceptance

Display one objective sentence, visible pause, readable checkpoint marker and numeric lives when combat is enabled. Context, Journal and More options open from simple labeled buttons. Input is selected before first play: Keyboard, Touch or detected Controller. Show tooltips for that method. Use captions, no color-only puzzle clues, reduced motion, adjustable touch buttons and a visible Skip story button. Witness scenes suppress the combat HUD.

Persist level ID, checkpoint, difficulty, seen cards and completed flag locally with schema/content version and atomic recovery. Bundle all art, narration text, sound and reference context; external URLs in documentation are optional research links and never required at runtime. Pause on background, focus loss or controller disconnect. Retry works in airplane mode after a fresh installed launch.

Accept only when: every section can be completed from a clean save; Retry returns to a safe state; the documented unique mechanic is present; source and invention labels are visible; the next unlock occurs exactly once; controls work without stuck input; bosses/waves obey shared legality; no sacred figure becomes a damageable enemy; and all runtime requests remain within installed local assets. Record actual tests and unresolved device limits.
