# Spear: complete gameplay and animation prompt

Build the complete spear kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Long linear spacing and clear blind zones; close approaches punish the shaft’s missed thrust.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Front Thrust | 8/4/17 | 12 | 22° | melee |
| slight | Driving Reach | 11/4/21 | 14 | 22° | melee |
| dlight | Low Prod | 9/4/19 | 11 | 67° | melee |
| nair | Overhead Wheel | 10/5/18 | 13 | 90° | melee |
| sair | Extended Point | 12/5/23 | 15 | 22° | melee |
| dair | Downward Point | 11/5/22 | 14 | -67° | melee |
| recovery | Rising Pole | 13/7/24 | 17 | 90° | melee |
| ground_pound | Falling Shaft | 17/12/29 | 20 | -90° | melee |

### nlight: Front Thrust

One straight short spear thrust with both hands behind the point.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 120×28 design units, local origin (30, 35) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Driving Reach

One longer thrust from a small forward step, no hidden second hit.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 21 vulnerable ticks with a readable ending pose. Prototype collision envelope: 150×30 design units, local origin (35, 32) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Low Prod

Crouched spear tip flick forward just above the ground.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 19 vulnerable ticks with a readable ending pose. Prototype collision envelope: 120×30 design units, local origin (28, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 11 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Overhead Wheel

A compact single-contact staff-like overhead turn of the spear.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype collision envelope: 100×90 design units, local origin (-45, 35) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Extended Point

A long forward aerial spear thrust with exposed body behind.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype collision envelope: 145×32 design units, local origin (35, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 15 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Downward Point

A short downward-diagonal spear poke; torso stays visible above.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype collision envelope: 55×85 design units, local origin (20, -70) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Rising Pole

An upward spear sweep and one upward body impulse.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 24 vulnerable ticks with a readable ending pose. Prototype collision envelope: 85×140 design units, local origin (-35, 20) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 17 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Falling Shaft

The fighter turns spear downward and commits to a narrow descending strike.

Anticipation lasts 17 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 29 vulnerable ticks with a readable ending pose. Prototype collision envelope: 30×120 design units, local origin (-15, -90) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 20 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
