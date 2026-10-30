# Combat, attack resolution, hitboxes and frame-data prompt

Act as combat engineer. Build a testable attack grammar, data compiler and collision resolver. Read weapon files, fighter files and `09_Data/attacks.json`. The data is a prototype specification with authored hit shapes; it requires animation alignment and balance validation before release.

## Attack grammar and action priority

Ground Light: neutral/side/down weapon light. Air Light: neutral/side/down aerial. Ground Heavy: neutral/side/down fighter signature. Air Heavy: recovery unless Down is held, then ground pound. Unarmed follows the same grammar, with generic grounded heavies. Input direction priority is Down, then horizontal Side, then Neutral. Up maps to Neutral. Choose current facing only at action start; no mid-signature retargeting.

On one tick, honor existing action legality first. Among fresh legal actions use: respawn/KO rules → drop-through → a valid dodge-cancel attack → legal Dodge/Dash → Pickup/Throw → Jump → Heavy → Light → ordinary movement. Buffer otherwise eligible Jump/Light/Heavy for 4 ticks. A buffer stores action intent, not a locked attack instance; re-resolve air/ground context at execution. It may not survive KO, menu focus loss, weapon pickup that changes grammar, or another successful action. Do not execute several attacks because multiple button events arrived in one tick.

## Attack timing

Startup S, active A and recovery R are counts. Attack local ticks are 0-indexed: startup `[0,S)`, active `[S,S+A)`, recovery `[S+A,S+A+R)`. State exits at `S+A+R`. This avoids ambiguous “frame 1” conventions. Default light signatures cannot cancel on whiff. Weapon lights may cancel into the explicit chase movement on confirmed hit from first recovery tick; no free attack-to-attack recovery cancel exists. Signature recovery is always paid.

Holding grounded Heavy extends startup immediately before its final startup tick by up to 36 ticks. Release executes remaining startup, or auto-release at cap. Max charge scales damage to 125% using a linear permille multiplier; it does not enlarge hitboxes, extend active time, add invulnerability or change launch angle. Light/air moves cannot charge. A hold must not repeatedly create attack instances. Getting hit cancels the windup.

## Hitbox authoring

All fighters use the same 40×74 capsule, feet anchored. Authored attack zones are front-facing rectangles/capsules at local X/Y and may shift at specified active-phase keyframes. Compile facing=left by mirroring X. Melee attack zones move with the attacker. Spawned projectile zones move independently after release. A painted movement trail is not an extra active region.

Data includes ID, owner weapon/fighter, input, context, startup/active/recovery, damage tenths, hitstun ticks, base force Q, growth Q per whole damage unit, launch direction ID, collision phases, displacement schedule, invulnerability flag, projectile parameters and per-target hit policy. Every attack must reference an animation of matching total duration or an explicit retiming map. Prototype boxes are starting geometry, not a promise of production-accurate art alignment.

Single-hit attacks register at most once per target per attack instance. Base launch kit uses single hit for all 147 records; any future multi-hit requires explicit hit groups, victim escape analysis and rehit gap. Melee mutual overlap is resolved from pre-hit state: gather all valid hits, sort by target/attacker/instance ID, then apply. Trades are possible. No hidden fighter rank priority. Exact simultaneous multiple hits sum damage, and choose the highest pre-scaling launch magnitude for launch velocity, breaking ties by attack instance ID. Stun uses max, not sum. Avoid sequential damage ordering changing launch outcomes.

## Damage and knockback formula

Let `D10` be the target’s damage tenths after all hits this tick. For one candidate launch: `rawKQ = baseForceQ + floor(growthQPerDamage * D10 / 10)`. Apply target Guard permille with rounded integer multiplication; cap force at 6144 Q/tick (24 units/tick). Power scales attack damage, not force directly; damage changes naturally affect the formula. Use a supplied fixed integer direction table. For a right-facing 22-degree launch, positive X and positive Y. Left-facing mirrors X; 90-degree launch X remains 0.

Hitstun uses the move’s authored integer value and does not increase infinitely with damage. Display damage as an integer rounded down from tenths; cap authoritative stored damage at 9990 tenths. Ring-outs come from boundaries, never from a damage threshold. Balance baseline examples: a 26-damage signature with 1280 Q base force and growth 10 gives raw force 2540 Q/tick against a previously 100-damage target after applying 26 more, before Guard scaling. Test this exact calculation.

## Hitstop and feedback

Do not globally freeze simulation when a client sees a hit. Apply an authored **entity-local hitstop** of 3 ticks for light and 5 for signatures, recorded in simulation and replay. Hitstop starts the tick after hit resolution, freezes affected participants’ action/position ticks and hitstun countdown, while cooldown timers continue. Projectile flight and other fighters continue. Suppress attack re-hits through the ledger. Merge overlapping hitstop by max; do not repeatedly refresh it from the same instance. Effects, sound and camera use idempotent event IDs and state restore reconciliation.

## Projectiles and attacks against them

Sling/bow have a maximum of one signature projectile plus one light projectile per owner; a spawn that would exceed its class cap fizzles visibly without undoing recovery. Projectiles have one-hit total budget, finite lifetime and ordinary stage collision. A valid active melee box may destroy a projectile before it hits a hurtbox at the same crossing time; ties resolve collision category then stable ID. No default reflection, homing, offscreen linger or universal stage bounce. “Skipping” is visual choreography over a fixed low projectile path, not unimplemented bouncing geometry.

## Defensive rules

No shields, blocking, parry, armor, critical hits or random miss chance in the arena launch design. Campaign enemy shields and boss guard are explicit separate encounter rules. Dodge invulnerability only exists during its specified ticks. Startup/recovery remain vulnerable. Respawn invulnerability cancels on voluntary attack/throw, not on movement. Local team friendly fire defaults off and may be enabled in Match options. Teammate projectiles follow the visible choice. Holding a signature does not grant protection.

## Training instrumentation

One **Details** button exposes state, attack tick, hitbox/hurtbox overlays, startup/active/recovery colors, input history, resource timers and combo escape gap. Overlay labels remain in the training/developer view. Combo counter resets when the defender gains a legal actionable escape tick. A “true combo” label is evidence-based at a specified damage, fighter stats and start position, not inferred from two attacks looking fast.

## Acceptance

Tests cover every grammar entry, mirrored shapes, edge contact, one-way platform overlap, simultaneous attacks, throw/projectile ownership, zero-stock fighters, invulnerability boundaries, buffered inputs, charge release, KO during charge, multi-attacker trades and replay equivalence. No signature is considered balanced merely because its damage matches another signature. Run release acceptance with final animation overlays and actual expert escape attempts.
