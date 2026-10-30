# Unarmed: complete gameplay and animation prompt

Build the complete unarmed kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. A complete fallback kit; shorter reach avoids making weapon denial irrelevant.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Open Jab | 6/3/15 | 8 | 22° | melee |
| slight | Step Palm | 8/4/18 | 10 | 22° | melee |
| dlight | Low Kick | 7/4/17 | 8 | 67° | melee |
| nair | Up Palm | 8/4/17 | 9 | 90° | melee |
| sair | Air Kick | 10/4/20 | 11 | 22° | melee |
| dair | Down Heel | 10/4/21 | 10 | -67° | melee |
| recovery | Rising Palm | 12/7/24 | 13 | 90° | melee |
| ground_pound | Braced Fall | 16/12/28 | 16 | -90° | melee |
| nsig | Unarmed Lift | 18/5/26 | 20 | 90° | melee |
| ssig | Unarmed Drive | 22/5/28 | 23 | 22° | melee |
| dsig | Unarmed Sweep | 25/5/30 | 22 | 22° | melee |

### nlight: Open Jab

One short open-palm strike with rear hand guarding.

Anticipation lasts 6 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 3 ticks. Recovery is 15 vulnerable ticks with a readable ending pose. Prototype collision envelope: 40×30 design units, local origin (18, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 8 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Step Palm

One forward palm from a small step.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 18 vulnerable ticks with a readable ending pose. Prototype collision envelope: 55×35 design units, local origin (20, 25) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Low Kick

A controlled low front kick.

Anticipation lasts 7 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 50×30 design units, local origin (15, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 8 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Up Palm

One compact upward aerial palm.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 50×60 design units, local origin (-20, 25) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 9 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Air Kick

One forward aerial kick.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 20 vulnerable ticks with a readable ending pose. Prototype collision envelope: 65×38 design units, local origin (20, 20) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 11 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Down Heel

A downward-diagonal heel strike.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 21 vulnerable ticks with a readable ending pose. Prototype collision envelope: 40×65 design units, local origin (8, -50) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Rising Palm

A rising upper palm strike and one upward impulse.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 24 vulnerable ticks with a readable ending pose. Prototype collision envelope: 55×100 design units, local origin (-20, 15) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Braced Fall

A downward feet-first strike with guarded arms.

Anticipation lasts 16 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 28 vulnerable ticks with a readable ending pose. Prototype collision envelope: 36×80 design units, local origin (-18, -50) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nsig: Unarmed Lift

A deliberate grounded upper palm strike with a visible windup.

Anticipation lasts 18 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 26 vulnerable ticks with a readable ending pose. Prototype collision envelope: 60×100 design units, local origin (-20, 35) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 20 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ssig: Unarmed Drive

A forceful forward double-palm strike from a planted step.

Anticipation lasts 22 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 28 vulnerable ticks with a readable ending pose. Prototype collision envelope: 85×50 design units, local origin (20, 22) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 23 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dsig: Unarmed Sweep

A low guarded hand/leg sweep in front with slow recovery.

Anticipation lasts 25 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 30 vulnerable ticks with a readable ending pose. Prototype collision envelope: 80×28 design units, local origin (15, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 22 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
