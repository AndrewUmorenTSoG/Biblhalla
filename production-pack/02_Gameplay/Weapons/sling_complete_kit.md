# Sling: complete gameplay and animation prompt

Build the complete sling kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Ordinary stones and close cloth/foot strikes; single-projectile caps require spacing and patience.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Stone Flick | 9/1/18 | 11 | 22° | projectile |
| slight | Flat Release | 12/1/22 | 13 | 22° | projectile |
| dlight | Low Snap | 8/4/17 | 10 | 67° | melee |
| nair | Sling Halo | 9/5/18 | 12 | 90° | melee |
| sair | Midair Stone | 12/1/23 | 14 | 22° | projectile |
| dair | Heel Descent | 11/5/22 | 13 | -67° | melee |
| recovery | Rising Turn | 13/7/24 | 16 | 90° | melee |
| ground_pound | Shepherd Drop | 16/12/28 | 18 | -90° | melee |

### nlight: Stone Flick

One short sling rotation releases a small forward training stone.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype projectile size: 12×12 design units, local origin (30, 45) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 11 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### slight: Flat Release

A wider waist-level rotation releases one horizontal stone.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype projectile size: 12×12 design units, local origin (35, 40) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 13 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### dlight: Low Snap

A low front kick while holding the sling safely back; no projectile.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 60×32 design units, local origin (20, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Sling Halo

One overhead sling sweep with a close single-contact envelope.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype collision envelope: 80×75 design units, local origin (-35, 35) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Midair Stone

Airborne body lean and one forward stone release.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype projectile size: 12×12 design units, local origin (30, 38) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 14 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### dair: Heel Descent

A downward heel kick with sling arm safely extended upward.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype collision envelope: 44×70 design units, local origin (-12, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Rising Turn

An upward body twist with sling held tight and one rising impulse.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 24 vulnerable ticks with a readable ending pose. Prototype collision envelope: 75×110 design units, local origin (-30, 20) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Shepherd Drop

A feet-first downward strike with knees braced and clear landing recovery.

Anticipation lasts 16 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 28 vulnerable ticks with a readable ending pose. Prototype collision envelope: 36×85 design units, local origin (-18, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 18 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
