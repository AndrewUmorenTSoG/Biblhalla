# Staff: complete gameplay and animation prompt

Build the complete staff kit in Covenant Clash. Read the master, physics, combat resolver and attacks JSON. Broad spacing envelopes with moderate damage; long visible motion invites close whiff punishment.

## Attack timing table

S/A/R means startup/active/recovery ticks at 60 Hz. Angles are hit-launch direction, not necessarily projectile travel direction. Ground light = nlight/slight/dlight; air light = nair/sair/dair; air Heavy = recovery or Down+Heavy ground_pound. Fighter-specific grounded Heavy comes from the roster signature records, except the shared unarmed heavies.

| ID suffix | Move | S/A/R | Base damage | Launch | Delivery |
|---|---|---|---|---|---|
| nlight | Staff Tap | 8/4/17 | 11 | 22° | melee |
| slight | Wide Reach | 11/5/21 | 13 | 22° | melee |
| dlight | Floor Sweep | 10/5/20 | 10 | 67° | melee |
| nair | Overhead Fan | 10/5/19 | 12 | 90° | melee |
| sair | Air Reach | 12/5/23 | 14 | 22° | melee |
| dair | Low Arc | 12/5/23 | 13 | -67° | melee |
| recovery | Rising Staff | 13/7/25 | 16 | 90° | melee |
| ground_pound | Staff Descent | 17/12/29 | 19 | -90° | melee |

### nlight: Staff Tap

A clear forward staff-end strike at chest height.

Anticipation lasts 8 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 4 ticks. Recovery is 17 vulnerable ticks with a readable ending pose. Prototype collision envelope: 110×35 design units, local origin (25, 28) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 11 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### slight: Wide Reach

A longer controlled sideward staff strike with a planted back foot.

Anticipation lasts 11 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 21 vulnerable ticks with a readable ending pose. Prototype collision envelope: 135×45 design units, local origin (28, 25) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dlight: Floor Sweep

One low front staff sweep, fighter lowers center of gravity.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 20 vulnerable ticks with a readable ending pose. Prototype collision envelope: 125×30 design units, local origin (20, 0) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 67° mirrored with facing; base damage 10 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### nair: Overhead Fan

One overhead staff sweep while airborne with a single contact.

Anticipation lasts 10 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 19 vulnerable ticks with a readable ending pose. Prototype collision envelope: 105×85 design units, local origin (-45, 30) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 12 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### sair: Air Reach

A long horizontal staff strike while knees stay tucked.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype collision envelope: 140×38 design units, local origin (25, 22) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 22° mirrored with facing; base damage 14 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### dair: Low Arc

One downward-diagonal staff tip strike with torso above.

Anticipation lasts 12 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 5 ticks. Recovery is 23 vulnerable ticks with a readable ending pose. Prototype collision envelope: 60×80 design units, local origin (18, -65) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -67° mirrored with facing; base damage 13 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### recovery: Rising Staff

An upward staff turn and once-per-reset rising body impulse.

Anticipation lasts 13 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 7 ticks. Recovery is 25 vulnerable ticks with a readable ending pose. Prototype collision envelope: 100×130 design units, local origin (-40, 20) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction 90° mirrored with facing; base damage 16 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

### ground_pound: Staff Descent

The staff is aligned downward and the fighter descends with exposed sides.

Anticipation lasts 17 ticks: show the prop/limb moving toward the intended lane without active collision. Contact window is 12 ticks. Recovery is 29 vulnerable ticks with a readable ending pose. Prototype collision envelope: 36×115 design units, local origin (-18, -85) relative to feet center. Use a single-hit local rectangle as the initial envelope; align/refine it against animation before release. Launch direction -90° mirrored with facing; base damage 19 before Power. Counterplay: avoid the authored lane, bait the windup and punish the exposed recovery; no armor or universal shield.

## Shared resource and fairness contract

All users have the same moves on touch, keyboard and controller. Recovery consumes its resource when the action begins, before active motion, and cannot be queued again until legitimate reset; the action-level resourceCostOnActionStart field consumes it once, and motion events never consume it again. Ground pound landing terminates its active phase and pays normal recovery plus 8 ticks. A missed move is not freely cancellable. No move is multi-hit in this launch kit. Charged unarmed grounded heavy follows the same charge rule; other weapon ground heavies use fighter signatures. No stats modify timing. Base shape rectangles are prototype data; final animation-aligned collision requires review.

## Animation styling

Retarget family choreography to each roster character’s posture, cloth and prop design while preserving sim timing, reach and displacement. Frame duration metadata must match total ticks. Painted arcs and stone trails are cosmetic and may not add damage. Show held weapon clearly after action, and unarmed hands when it is released.

## Practice task

In training, inspect all entries on ground/air, then test a low starter into a jump attack. Display the observed escape gap; do not label the experiment a true combo without the legality proof. Test each move near ledges and both directions. Confirm projectile caps and recovery resource behavior where applicable.

## Required output

Validated data loader, resolver mapping, animation timeline, debug shape overlay and replayable unit/integration tests. Every move must work, not only its menu description. Verify wrong-context inputs resolve through grammar rather than exposing unintended moves.
