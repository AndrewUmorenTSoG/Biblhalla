# Sword: complete gameplay and animation prompt

Build the complete sword kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Clean medium-range arcs; reliable fundamentals; exposed endings prevent safe heavy spam.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Quick Edge | 7/4/15 | 11 | 22° | melee |
| slight | Step Cut | 9/4/18 | 13 | 22° | melee |
| dlight | Low Lift | 8/4/17 | 10 | 67° | melee |
| nair | Air Circle | 8/5/16 | 12 | 90° | melee |
| sair | Open Edge | 10/5/20 | 15 | 22° | melee |
| dair | Falling Slice | 10/5/21 | 14 | -67° | melee |
| recovery | Ascending Guard | 11/7/22 | 16 | 90° | melee |
| ground_pound | Point Drop | 15/12/27 | 19 | -90° | melee |

### nlight: Quick Edge

A compact front slash from chest guard, one clear contact pose.

Anticipation lasts 7 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 15 vulnerable ticks with a readable ending pose. Prototype collision envelope: 70×45 design units, local origin (20, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 11 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Step Cut

A short advancing cut ending with the blade extended in front.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype collision envelope: 95×48 design units, local origin (25, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Low Lift

Low body dip then a small rising blade flick toward the opponent’s feet.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 80×40 design units, local origin (18, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Air Circle

One compact overhead blade circle while airborne; no lingering rotating hits.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 16 vulnerable ticks with a readable ending pose. Prototype collision envelope: 95×70 design units, local origin (-40, 35) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Open Edge

A forward aerial horizontal sword slash with knees tucked.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 20 vulnerable ticks with a readable ending pose. Prototype collision envelope: 110×52 design units, local origin (20, 22) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 15 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Falling Slice

Blade angles downward in front as the body remains vulnerable above.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 21 vulnerable ticks with a readable ending pose. Prototype collision envelope: 65×70 design units, local origin (15, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Ascending Guard

A rising sword arc carries the fighter upward once.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype collision envelope: 85×120 design units, local origin (-30, 20) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Point Drop

A downward committed sword point with a visible overhead preparation.

Anticipation lasts 15 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 27 vulnerable ticks with a readable ending pose. Prototype collision envelope: 36×95 design units, local origin (-18, -65) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 19 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
