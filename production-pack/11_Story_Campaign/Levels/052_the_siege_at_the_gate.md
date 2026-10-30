# L052 — The Siege at the Gate

**Standalone level build prompt.** Chapter 09, Voices in the Storm; **Multiple-opponent battle**. Source context: **2 Kings 18-19**. Status: detailed design prompt; not implemented in the separate combat prototype.

## Story and objective

Act as a level designer, narrative designer, combat engineer and accessibility reviewer. Build this fully offline level using the campaign master, enemy catalog and canonical mechanics. Hezekiah’s crisis raises the stakes; the friends protect people while deliverance remains God’s act in the account. Chapter arc: Prophets call people back; judgment and promised restoration are held together.

Player task: **Hold three refuge approaches through shield-and-archer training waves.** Unique rule: **The player does not kill the historical army to cause deliverance; the drill is separate and avoids graphic casualty counts.** Dru is the default protagonist of invented archive tasks; Ken accompanies him as a pathfinding companion. Optional same-device co-op assigns Ken to a separate controller. The David-and-Goliath reenactment explicitly selects David instead. Do not invent a meeting of historical people from different centuries.

## Play space and pacing

Art setting: **fictional outer-wall defensive drill and refuge yard**. Use a side-on route of three 1280×720 view segments, with a boss/wave arena constrained to one readable view. Author collision separately from illustration. Start with a 220-unit safe bay, an objective marker at the next section, and a visible exit on the right. Use lower and upper routes separated by 120–180 units; mandatory jumps remain below the measured jump/recovery envelope. Escort bays have flat, protected footing. Boss arenas preserve a safe route after every hazard sequence. Do not draw foreground decoration across collision edges.

Target 4–7 minutes for an action level and 2–4 minutes for a witness level; these are design targets, not measured completion times. Build suspense through a new silhouette, a changing route and a reveal before introducing simultaneous pressure. Keep narrative camera shots outside active combat. Recovery checkpoints restore the start of the current section and never remove already seen story cards.

## Encounter script

1. Wave 1: **1 archer, 1 road guard**. Enter through left floor gate and right shelf; show a 90-tick arrival marker. The next wave waits until every active opponent is cleared and a 120-tick recovery break finishes.
2. Wave 2: **1 shield guard, 2 road guard**. Enter through both side gates, archer on the high shelf; show a 90-tick arrival marker. The next wave waits until every active opponent is cleared and a 120-tick recovery break finishes.
3. Wave 3: **1 brute, 1 archer, 2 road guard**. Enter through right floor gate and center ramp; show a 90-tick arrival marker. The next wave waits until every active opponent is cleared and a 120-tick recovery break finishes.

Cap simultaneous attackers at 2 on Easy and 3 on Hard/Extremely Hard. Others position or wind up; do not stack untelegraphed hits. Total opponent counts stay the same across difficulties. Each ordinary opponent has one stock; boss guard does not appear here. Enemy projectiles cannot hit friendly enemies or travelers. Provide a platform route around the front line; prohibit attack spawns directly behind the player without an arrival cue.

## Difficulty and fairness

| Setting | Planning and assistance | Shared rules |
|---|---|---|
| Easy | 27-tick bot observation delay, 14-tick decisions; 1.5× environmental tell lead, route hints and optional assist checkpoints | Same player damage, hitboxes, weapon kit, opponent count and story outcome |
| Hard | 12-tick observation delay, 6-tick decisions; baseline tells and fewer route hints | Same combat stats and physical rules |
| Extremely Hard | 6-tick observation delay, 3-tick decisions; better spacing, recovery and dodge reads | Same damage and guard; every boss tell remains at least 24 ticks |

For noncombat levels, difficulty affects obstacle timing and optional clues only. Witness scenes ignore difficulty. The player may change difficulty at a checkpoint without losing story progress; local medals record the chosen setting. Do not describe a local medal as global ranking.

## Dialogue, source handling and continuity

Incoming unlock: L051. Completion opens L053. Opening fictional companion line: Ken: “We made it through the last page. What will the siege at the gate ask of us?” Closing fictional companion line: Dru: “We can keep going. Stay beside me.” These are original game lines, never Scripture quotations or words attributed to God or Jesus.

Create a 20–40-second original narrator summary anchored to 2 Kings 18-19. Show Book / Chapter in a Context button. Separate labels **Bible account**, **Parable** where relevant, and **Invented archive challenge**. Preserve the recorded outcome even if the gameplay retries. Use original paraphrase by default; licensed quotations require recorded translation and permission. Do not treat an optional journal clue as a new prophecy or historical fact.

## Asset generation prompt

Create original hand-drawn 2D art for this location: fictional outer-wall defensive drill and refuge yard. Clean dark ink, warm cel shading, parchment accents and restrained jewel colors. Keep playable edges crisp and background contrast subdued. Output a 2560×1440 concept plus separately authored sky, far scenery, middle scenery, platform surfaces and foreground props. For actors, supply distinct silhouettes and 12-state animation requirements from the art pipeline. For this level, also create a chapter-card image showing the siege at the gate without a HUD or invented quotation. This is a generation brief, not a claim that these additional assets already exist. Reuse supplied arena art only as a palette reference; do not copy another game’s map.

## UI, saves and acceptance

Display one objective sentence, visible pause, readable checkpoint marker and numeric lives when combat is enabled. Context, Journal and More options open from simple labeled buttons. Input is selected before first play: Keyboard, Touch or detected Controller. Show tooltips for that method. Use captions, no color-only puzzle clues, reduced motion, adjustable touch buttons and a visible Skip story button. Witness scenes suppress the combat HUD.

Persist level ID, checkpoint, difficulty, seen cards and completed flag locally with schema/content version and atomic recovery. Bundle all art, narration text, sound and reference context; external URLs in documentation are optional research links and never required at runtime. Pause on background, focus loss or controller disconnect. Retry works in airplane mode after a fresh installed launch.

Accept only when: every section can be completed from a clean save; Retry returns to a safe state; the documented unique mechanic is present; source and invention labels are visible; the next unlock occurs exactly once; controls work without stuck input; bosses/waves obey shared legality; no sacred figure becomes a damageable enemy; and all runtime requests remain within installed local assets. Record actual tests and unresolved device limits.
