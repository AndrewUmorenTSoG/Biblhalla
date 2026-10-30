# Gauntlets: complete gameplay and animation prompt

Build the complete gauntlets kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Short range with fast starters; approaching safely is necessary and heavy whiffs remain punishable.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Front Palm | 6/3/14 | 10 | 22° | melee |
| slight | Step Fist | 8/4/17 | 12 | 22° | melee |
| dlight | Low Jab | 7/4/16 | 9 | 67° | melee |
| nair | Upper Guard | 7/5/16 | 11 | 90° | melee |
| sair | Air Palm | 9/4/19 | 14 | 22° | melee |
| dair | Down Fist | 9/4/20 | 12 | -67° | melee |
| recovery | Upward Drive | 10/7/22 | 15 | 90° | melee |
| ground_pound | Braced Descent | 14/12/26 | 18 | -90° | melee |

### nlight: Front Palm

One quick open-palm strike in front from a compact guard.

Anticipation lasts 6 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 3 ticks. Recovery is 14 vulnerable ticks with a readable ending pose. Prototype collision envelope: 50×35 design units, local origin (18, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Step Fist

A short stepping fist strike with rear hand guarding ribs.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 70×42 design units, local origin (20, 25) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Low Jab

Low crouching fist strike that lifts slightly at contact.

Anticipation lasts 7 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 16 vulnerable ticks with a readable ending pose. Prototype collision envelope: 55×32 design units, local origin (15, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 9 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Upper Guard

One close aerial upward forearm/palm strike.

Anticipation lasts 7 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 16 vulnerable ticks with a readable ending pose. Prototype collision envelope: 60×65 design units, local origin (-25, 25) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 11 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Air Palm

One forward aerial palm with compact leg balance.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 19 vulnerable ticks with a readable ending pose. Prototype collision envelope: 75×42 design units, local origin (20, 22) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Down Fist

One downward-diagonal guarded fist; body exposed above.

Anticipation lasts 9 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 20 vulnerable ticks with a readable ending pose. Prototype collision envelope: 45×65 design units, local origin (10, -50) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Upward Drive

A single rising uppercut and upward recovery impulse.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 22 vulnerable ticks with a readable ending pose. Prototype collision envelope: 60×105 design units, local origin (-20, 15) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 15 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Braced Descent

A committed downward palm/fist strike with a clear landing brace.

Anticipation lasts 14 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 26 vulnerable ticks with a readable ending pose. Prototype collision envelope: 40×85 design units, local origin (-20, -55) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 18 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
