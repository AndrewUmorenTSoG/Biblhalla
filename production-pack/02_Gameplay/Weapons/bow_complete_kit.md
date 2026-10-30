# Bow: complete gameplay and animation prompt

Build the complete bow kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Ordinary training arrows mixed with close bow-body strikes; arrows are finite and cannot auto-aim.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Quick Arrow | 9/1/19 | 11 | 22° | projectile |
| slight | Set Arrow | 13/1/24 | 14 | 22° | projectile |
| dlight | Low Arrow | 12/1/23 | 11 | 67° | projectile |
| nair | Bow Fan | 9/5/18 | 12 | 90° | melee |
| sair | Air Arrow | 13/1/24 | 15 | 22° | projectile |
| dair | Downward Brace | 11/5/22 | 13 | -67° | melee |
| recovery | Archer Rise | 13/7/25 | 16 | 90° | melee |
| ground_pound | Bow Drop | 17/12/29 | 19 | -90° | melee |

### nlight: Quick Arrow

One short draw releases a horizontal training arrow.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 19 vulnerable ticks with a readable ending pose. Prototype projectile size: 16×8 design units, local origin (32, 45) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 11 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### slight: Set Arrow

A visible longer draw releases one horizontal arrow after a short step.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 24 vulnerable ticks with a readable ending pose. Prototype projectile size: 16×8 design units, local origin (35, 42) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 14 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### dlight: Low Arrow

A crouched low bow draw releases one arrow above floor level.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype projectile size: 16×8 design units, local origin (30, 12) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 67° mirrored with facing; base damage 11 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### nair: Bow Fan

One close overhead bow-body sweep, no arrow emitted.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype collision envelope: 75×80 design units, local origin (-30, 32) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Air Arrow

One forward airborne arrow release with clearly exposed recovery.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 1 ticks. Recovery is 24 vulnerable ticks with a readable ending pose. Prototype projectile size: 16×8 design units, local origin (32, 40) relative to feet center. Spawn one ordinary projectile on the first active tick, travel horizontally with finite lifetime and the light projectile cap; no extra melee hitbox. Launch direction 22° mirrored with facing; base damage 15 before Power. Counterplay: jump/dodge the lane, close distance during the exposed release and punish recovery.

### dair: Downward Brace

A downward close bow-body strike with the bow safely braced.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype collision envelope: 55×72 design units, local origin (12, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Archer Rise

A compact rising bow-body arc and one upward recovery impulse.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 25 vulnerable ticks with a readable ending pose. Prototype collision envelope: 75×120 design units, local origin (-25, 18) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Bow Drop

A feet-first descending strike with bow held clear of the feet.

Anticipation lasts 17 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 29 vulnerable ticks with a readable ending pose. Prototype collision envelope: 36×85 design units, local origin (-18, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 19 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
