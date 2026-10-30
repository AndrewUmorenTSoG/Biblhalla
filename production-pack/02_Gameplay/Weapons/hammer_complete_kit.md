# Hammer: complete gameplay and animation prompt

Build the complete hammer kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Heavy delayed commitments with strong launches; no armor protects the windup.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Mallet Tap | 10/5/21 | 13 | 22° | melee |
| slight | Side Weight | 13/5/25 | 16 | 22° | melee |
| dlight | Low Weight | 12/5/23 | 12 | 67° | melee |
| nair | Air Weight | 12/5/23 | 14 | 90° | melee |
| sair | Air Swing | 14/5/27 | 18 | 22° | melee |
| dair | Falling Mallet | 14/5/27 | 16 | -67° | melee |
| recovery | Mallet Rise | 15/7/28 | 18 | 90° | melee |
| ground_pound | Heavy Drop | 20/12/33 | 22 | -90° | melee |

### nlight: Mallet Tap

One compact wooden mallet swing across the near front lane.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 21 vulnerable ticks with a readable ending pose. Prototype collision envelope: 80×50 design units, local origin (20, 22) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Side Weight

A wider sideward mallet arc driven by visible hip rotation.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 25 vulnerable ticks with a readable ending pose. Prototype collision envelope: 115×60 design units, local origin (25, 18) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Low Weight

Low mallet sweep along the front training floor.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype collision envelope: 95×35 design units, local origin (20, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Air Weight

A single upward mallet arc above the fighter’s shoulder.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype collision envelope: 95×95 design units, local origin (-35, 30) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Air Swing

A committed forward aerial mallet swing with backward body counterbalance.

Anticipation lasts 14 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 27 vulnerable ticks with a readable ending pose. Prototype collision envelope: 120×65 design units, local origin (25, 18) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 18 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Falling Mallet

One downward-diagonal mallet head strike.

Anticipation lasts 14 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 27 vulnerable ticks with a readable ending pose. Prototype collision envelope: 70×85 design units, local origin (15, -65) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Mallet Rise

Upward mallet arc and one deliberate rising impulse.

Anticipation lasts 15 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 28 vulnerable ticks with a readable ending pose. Prototype collision envelope: 100×135 design units, local origin (-30, 15) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 18 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Heavy Drop

Mallet head points below and leads a vulnerable vertical descent.

Anticipation lasts 20 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 33 vulnerable ticks with a readable ending pose. Prototype collision envelope: 50×110 design units, local origin (-25, -80) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 22 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
