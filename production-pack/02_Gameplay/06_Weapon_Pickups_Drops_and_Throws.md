# Weapon lifecycle and throwable items prompt

Implement the complete weapon lifecycle using deterministic ticks and stable entity IDs. Read the fighter pair assignments, attack data and combat rules. Weapon silhouettes are original props; a neutral pickup does not display a sword copied from another game.

## Neutral pickup

A pickup appears as a modest bronze training crate icon with two small weapon-shape marks. It becomes the recipient’s next assigned weapon on acquisition. All fighters start unarmed. Each fighter’s first acquired weapon is A; each successful subsequent neutral acquisition alternates B/A. Dropping or throwing does not toggle this sequence until another neutral pickup is actually acquired. Reacquiring a dropped weapon preserves that exact weapon and does not advance the neutral sequence.

Match starts with one neutral pickup at center on tick 120. Subsequent attempts occur every 480 ticks plus a seeded jitter from -60 to +60. Maximum two neutral pickups exist; a failed capped attempt schedules the next attempt normally and does not accumulate a burst. Pre-authored symmetric spawn points alternate left/right after center; seed selects only within an approved spawn sequence. Local arena pickups use symmetric cycles, not independent arbitrary random positions. Spawn on stage top + 160 units, fall under item gravity, and stop on approved surfaces. Despawn after 720 ticks if unused.

## Acquisition

Pickup button while unarmed and within 48 design units, with vertical distance ≤60 units, attempts the closest eligible item. Break equal distances by item entity ID. Only idle/walk/landing-safe state can acquire; not hitstun, dodge, attack, KO or respawn lock. Acquisition takes 6 vulnerable ticks. Resolve simultaneous attempts by earliest input tick, then alternating match-owned priority token, then player ID. Do not let screen FPS determine a pickup winner.

Armed pressing the same button throws the current weapon, unless Down is held, which drops it without a damaging launch. Touch updates its contextual label. Down+button should never perform a ground-pound. No auto-pickup by walking across items in competitive modes; optional novice auto-pickup is offline-only and clearly marked.

## Throw

Throw has 6 startup, 1 release, 16 recovery ticks. Capture direction at release using a fixed lookup: neutral forward, up diagonal/vertical from aim, down downward; allow the documented eight compass directions only. Launch speed 12 units/tick, gravity 40 Q/tick², lifetime 90 ticks, hit damage 10 units, hitstun 15 ticks, base force 768 Q, growth 5 Q per damage. One enemy hit maximum. Throw’s fighter becomes unarmed at release, not at button press. Getting interrupted before release retains the weapon.

Thrown props use one shared 18×18 collision box regardless of cosmetic weapon length. They collide with solid geometry and downward-crossed one-way surfaces. After impact, bounce once cosmetically while the simulation changes to a non-damaging dropped item; the gameplay bounce is a defined low vertical impulse and capped lifetime. A missed thrown weapon becomes a dropped item on first stage collision. Crossed blast zones despawn it. Owner cannot reacquire during throw recovery. Teammate interaction obeys friendly fire.

## Drop and reacquisition

Drop has 4 vulnerable startup, 1 release, 10 recovery. Release beside the fighter at X + facing×24 and Y + 25. Dropped item despawns after 480 ticks, can be picked up by a fighter only if the weapon is in their own assigned pair, and otherwise appears as an unusable prop with no pickup glow. This prevents arbitrary third weapons. Never silently transform another fighter’s dropped sword into a sling. Inventory is one weapon; no hidden two-weapon instant-swap button. Touch pickup hint shows when eligible without hiding the normal button.

## Optional gadgets

Not required for launch. If later added, gadgets are original non-sacred sporting props, casual-only by default, with explicit startup, collision, ownership and damage. No random instant KO, healing advantage or competitive power pickup. Do not add bombs simply because the reference has gadgets.

## Acceptance

Test unarmed start, A→B→A neutral sequence, interrupted throws, simultaneous pickups, every throw direction, dropped-item ownership, resource limits, map side walls, snapshots during acquisition, replay hashes, friendly-fire settings and owner disconnect. A weapon’s rendered sprite must not enlarge the shared throwable hitbox. No duplication occurs when state restore repeats a release event.
