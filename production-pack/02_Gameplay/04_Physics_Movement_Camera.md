# Original physics, movement resources and camera prompt

Act as movement engineer. Implement the explicit rules below, then tune through controlled playtests. These numbers are original starting targets; they are not Brawlhalla source values. `09_Data/physics.json` is the canonical numeric file. Coordinates use +Y up, fighter position at feet center, stage surface Y=0. Renderer flips Y only when presenting.

## Fixed-point model

Simulation: 60 Hz. One design unit = 256 Q units. Position/velocity are integers; velocity is Q units per tick. Gravity is Q units per tick squared. At base Speed 5: run 1536 Q/tick = 6 units/tick = 360 units/s, ground acceleration 192, braking 256, air acceleration 96, gravity 77, ground-jump impulse 2816, air-jump impulse 2432, fall cap 2048, fast-fall cap 3072. Apply gravity to vertical velocity before integrating position on each ordinary movement tick. Ground jumping suppresses gravity on the launch tick; tests fix this convention.

Power scales damage by `1000 + 20*(Power-5)` permille. Guard scales received knockback by `1000 - 25*(Guard-5)` permille. Speed modifies run cap by `64*(Speed-5)` Q/tick; acceleration stays constant. Round products with a documented integer rounding function. Stats never modify startup, active, recovery or invulnerability frames. Main grounded hurtbox is a 40-unit-wide, 74-unit-tall capsule shared by all roster members. Art height does not change hurtbox size.

## State and resource rules

| Action | Legal context | Rule |
|---|---|---|
| Run / pivot | Ground, idle/allowed movement | Accelerate toward speed cap; no instant reversal |
| Dash | Ground directional Dodge press | 11 units/tick for 8 ticks; no invulnerability; 10-tick dash repeat lock |
| Dash jump | Jump during dash | Jump ends dash state, preserves bounded horizontal velocity at 9 units/tick |
| Ground jump | Ground or 4-tick coyote window | One upward launch; reset air jumps to 2 |
| Air jump | Air, resources >0 | Consume one; replace upward velocity with impulse; maximum 2 before reset |
| Jump cut | Jump release while ascending | Cap upward velocity at 5.5 units/tick once per jump |
| Fast fall | Air while descending, Down held | Move toward fast-fall cap with gravity×2; Down while ascending only aims attacks |
| Spot dodge | Neutral Dodge | 3 startup ticks, 12 invulnerable ticks, 5 recovery ticks |
| Air directional dodge | Air directional Dodge | 3 startup, 10 invulnerable movement ticks, 7 recovery; 8 units/tick during movement |
| Ground directional Dodge | Ground horizontal aim | Dash rather than invulnerable dodge |
| Recovery | Air Heavy with no Down | Weapon recovery move; once until valid reset |
| Ground pound | Air Heavy + Down | Weapon down attack; no recovery resource consumed; normal vulnerable commitment |
| Wall slide | Touch solid side wall, falling, holding toward wall | Fall cap 2 units/tick, ordinary vulnerability |
| Wall jump | Valid side contact + Jump | Push 6 units/tick away, 9.5 up; face away |

Ground neutral dodge cooldown: 45 ticks from action start. Air dodge cooldown: 105 ticks from action start. Landing does not instantly erase a remaining air dodge cooldown; clamp it to at most 45 ticks. Wall touching never erases dodge cooldown. Cooldowns count down during active play including ordinary hitstun, but not offline pause. Dodging is illegal in hitstun, attack commitment, KO or respawn lock.

## Air cancel — familiar category, original implementation

After an aerial **neutral** dodge, accept a grounded light or signature during dodge action ticks 4–9 inclusive, if no previous cancel occurred for that dodge. On cancel, terminate dodge invulnerability immediately, select the grounded move using the current input direction, freeze vertical velocity only for its startup+active phase, and restore gravity during recovery. Original air dodge cooldown remains spent. Do not generate a virtual ground contact, refresh jumps or grant a second cancel. Directional air dodges cannot cancel under the launch rules.

Heavy recovery and ground pound cannot be selected through this cancel; it explicitly invokes a grounded move. Neutral Dodge + Light on the same tick does not instantly cancel: the attack may buffer into the earliest legal cancel tick. Facing/direction is captured at the attack’s actual start. Training must demonstrate this without giving it an extra game-only shortcut.

## Chase movement

A direct melee hit, excluding throws and projectiles, opens a 10-tick chase token. The attacker may spend it once on a directional Dodge press after attack recovery ends. Chase moves 8 units/tick for 7 ticks, grants **no invulnerability**, and does not refresh resources or bypass locked recovery except the explicitly allowed light-melee hit cancel. The token expires during recovery if not usable in time; author light recovery/optional hit-cancel windows explicitly to permit intended examples. In the launch kit, light attacks may spend chase from the first recovery tick on confirmed hit; signatures may not. Whiffing never opens the token. This is deliberately a defined original pressure tool, not an undocumented claim of exact reference behavior.

## Wall fatigue and resets

Ground contact for two consecutive ticks resets air jumps, recovery and wall fatigue. A wall contact may reset jumps/recovery once per airborne journey; it consumes a wall refresh token. Further wall jumps can use remaining resources but do not refresh them. Cumulative wall cling has a 90-tick maximum; after that disable slide assistance until genuine ground contact. A wall-jump consumes one remaining air jump after the one permitted refresh; if none remains, no new upward jump impulse is granted. A hit does not refresh air resources. Do not create an endless recovery cycle through alternately tapping wall contact.

## Platforms and swept collision

Main platforms are solids with top surface, side walls and underside. Thin upper platforms are one-way: collide only when previous feet position is at/above top and downward movement crosses the surface. Down+Jump requests a 12-tick drop-through ignore window for the current one-way platform, consumes no jump, nudges feet 1 unit below top, and may not pass through a solid main arena. Swept collision resolves time of impact, prevents dash/projectile tunneling and records contact normals. Equal-time ties resolve by stable collider ID.

## Knockback movement

Knockback velocity is separate from player movement and not clamped by run speed. Hitstun disables movement/dodge/attacks. After hitstun, decay knockback by 24 Q/tick on X toward zero and apply ordinary gravity on Y; ordinary movement gradually contributes again. There is no launch directional influence in the first version. Do not implement hidden angle steering in only one input adapter. Simultaneous hits and wall collisions follow combat rules.

## Camera

Camera is cosmetic and cannot change collision or blast zones. Fit alive fighters and important action into a safe combat rectangle, bounded by map camera limits. Smooth in render time, snap safely on match start and spectating changes. Offscreen arrows show player number, direction and distance. Zoom never makes the UI scale with world space. Keep touch controls and HUD fixed in CSS space. Ignore KO fighters after confirmation. Reduced-motion mode disables hit shake and dramatic zoom, while preserving offscreen indicators.

## Tests and tuning

Measure run time across 600 units, jump apex, air-jump resource consumption, dash distance, wall expiry and escape routes. Compare run/jump at render rates 30/60/120 with the same input recording; simulation endpoints must match. For ground jump expect apex around 200 design units under the exact update convention, then record the actual calculated value in the implementation report. Tune perceived feel with 20+ matches per change; update data and replay version together. Do not invent a claim of “identical physics.”

## Dash timer clarification

Ground dashes use their independent ten-tick repeat lock and do not spend the dodge cooldown. A remaining air/spot-dodge cooldown does not prevent a legal grounded dash. Ground directional intent without horizontal input resolves to a spot dodge; up/down aim alone does not create a vertical ground dodge. Attack legality and recovery still apply.
