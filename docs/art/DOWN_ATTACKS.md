# Down attacks: drawing task

One clip per attack below, for every fighter, holding each of their two weapons and unarmed.
Follow docs/ART_INTEGRATION.md: transparent frames, facing right, feet pivot, and clip `ticks` that add up to the total exactly.
Draw the contact pose during the **active** ticks. Startup leads into it; recovery returns to stance.
The hitbox comes from the game data, not the drawing, so keep the weapon or limb inside the listed reach.

## David

### Sling

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sling_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 20..80, y 0..32 | A low front kick while holding the sling safely back; no projectile. |
| `sling_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x -12..32, y -55..15 | A downward heel kick with sling arm safely extended upward. |
| `sling_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -55..30 | A feet-first downward strike with knees braced and clear landing recovery. |
| `david_sling_dsig` | Down signature (Down + Heavy on the ground) | 24 / 6 / 30 = **60** | projectile from (28, 12) | David drops into a crouch and sends a single skipping stone through a short low lane; he remains at the start position. |

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `david_sword_dsig` | Down signature (Down + Heavy on the ground) | 23 / 6 / 30 = **59** | x 20..125, y 0..20 | David shifts weight onto his rear heel and sweeps the blade just above the floor in front, finishing with both feet grounded. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for David have a slot in the atlas; redraw any that reuse a non-downward pose.

## Saul

### Spear

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `spear_dlight` | Ground down light (Down + Light on the ground) | 9 / 4 / 19 = **32** | x 28..148, y 0..30 | Crouched spear tip flick forward just above the ground. |
| `spear_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x 20..75, y -70..15 | A short downward-diagonal spear poke; torso stays visible above. |
| `spear_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -15..15, y -90..30 | The fighter turns spear downward and commits to a narrow descending strike. |
| `saul_spear_dsig` | Down signature (Down + Heavy on the ground) | 26 / 7 / 35 = **68** | x 20..175, y 0..18 | Saul bends low and sweeps the spear shaft across the floor in front, with a clearly visible low ending pose. |

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `saul_sword_dsig` | Down signature (Down + Heavy on the ground) | 27 / 6 / 36 = **69** | x 20..145, y 0..20 | Saul lowers his body and makes one wide front-facing horizontal sword sweep at shin height. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Saul have a slot in the atlas; redraw any that reuse a non-downward pose.

## Samson

### Gauntlets

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `gauntlets_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 16 = **27** | x 15..70, y 0..32 | Low crouching fist strike that lifts slightly at contact. |
| `gauntlets_dair` | Air down light (Down + Light in the air) | 9 / 4 / 20 = **33** | x 10..55, y -50..15 | One downward-diagonal guarded fist; body exposed above. |
| `gauntlets_ground_pound` | Ground pound (Down + Heavy in the air) | 14 / 12 / 26 = **52** | x -20..20, y -55..30 | A committed downward palm/fist strike with a clear landing brace. |
| `samson_gauntlets_dsig` | Down signature (Down + Heavy on the ground) | 27 / 6 / 36 = **69** | x 20..115, y 0..18 | Samson raises one fist, drops to a knee, and strikes the training floor in front; a short dust fan marks impact. |

### Hammer

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `hammer_dlight` | Ground down light (Down + Light on the ground) | 12 / 5 / 23 = **40** | x 20..115, y 0..35 | Low mallet sweep along the front training floor. |
| `hammer_dair` | Air down light (Down + Light in the air) | 14 / 5 / 27 = **46** | x 15..85, y -65..20 | One downward-diagonal mallet head strike. |
| `hammer_ground_pound` | Ground pound (Down + Heavy in the air) | 20 / 12 / 33 = **65** | x -25..25, y -80..30 | Mallet head points below and leads a vulnerable vertical descent. |
| `samson_hammer_dsig` | Down signature (Down + Heavy on the ground) | 30 / 7 / 39 = **76** | x 20..140, y 0..15 | Samson stomps forward, lowers his center of gravity, and drives the mallet into the floor ahead; dust is decorative only. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Samson have a slot in the atlas; redraw any that reuse a non-downward pose.

## Joshua

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `joshua_sword_dsig` | Down signature (Down + Heavy on the ground) | 24 / 6 / 31 = **61** | x 20..130, y 0..18 | Joshua makes a low controlled slash and returns to guard without an extra follow-up hit. |

### Spear

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `spear_dlight` | Ground down light (Down + Light on the ground) | 9 / 4 / 19 = **32** | x 28..148, y 0..30 | Crouched spear tip flick forward just above the ground. |
| `spear_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x 20..75, y -70..15 | A short downward-diagonal spear poke; torso stays visible above. |
| `spear_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -15..15, y -90..30 | The fighter turns spear downward and commits to a narrow descending strike. |
| `joshua_spear_dsig` | Down signature (Down + Heavy on the ground) | 25 / 6 / 32 = **63** | x 20..165, y 0..20 | Joshua pivots on his back foot and sweeps the spear tip low in front, green cloak wrapping around his hips. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Joshua have a slot in the atlas; redraw any that reuse a non-downward pose.

## Deborah

### Staff

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `staff_dlight` | Ground down light (Down + Light on the ground) | 10 / 5 / 20 = **35** | x 20..145, y 0..30 | One low front staff sweep, fighter lowers center of gravity. |
| `staff_dair` | Air down light (Down + Light in the air) | 12 / 5 / 23 = **40** | x 18..78, y -65..15 | One downward-diagonal staff tip strike with torso above. |
| `staff_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -18..18, y -85..30 | The staff is aligned downward and the fighter descends with exposed sides. |
| `deborah_staff_dsig` | Down signature (Down + Heavy on the ground) | 23 / 6 / 30 = **59** | x 20..165, y 0..18 | Deborah lowers to a side stance and sweeps the far end of the staff along a low front arc. |

### Blades

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `blades_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 16 = **27** | x 15..75, y 0..30 | A low controlled front blade cut from a knee bend. |
| `blades_dair` | Air down light (Down + Light in the air) | 9 / 4 / 20 = **33** | x 12..60, y -52..18 | One downward-diagonal crossing strike, body remains vulnerable. |
| `blades_ground_pound` | Ground pound (Down + Heavy in the air) | 14 / 12 / 27 = **53** | x -20..20, y -65..30 | A committed downward narrow blade strike with clear anticipation. |
| `deborah_blades_dsig` | Down signature (Down + Heavy on the ground) | 24 / 5 / 31 = **60** | x 20..115, y 0..18 | Deborah slips backward during anticipation, then turns a blade through a low front sweep. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Deborah have a slot in the atlas; redraw any that reuse a non-downward pose.

## Gideon

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `gideon_sword_dsig` | Down signature (Down + Heavy on the ground) | 25 / 6 / 33 = **64** | x 20..135, y 0..18 | Gideon braces his back knee and makes one low front-facing sword sweep. |

### Hammer

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `hammer_dlight` | Ground down light (Down + Light on the ground) | 12 / 5 / 23 = **40** | x 20..115, y 0..35 | Low mallet sweep along the front training floor. |
| `hammer_dair` | Air down light (Down + Light in the air) | 14 / 5 / 27 = **46** | x 15..85, y -65..20 | One downward-diagonal mallet head strike. |
| `hammer_ground_pound` | Ground pound (Down + Heavy in the air) | 20 / 12 / 33 = **65** | x -25..25, y -80..30 | Mallet head points below and leads a vulnerable vertical descent. |
| `gideon_hammer_dsig` | Down signature (Down + Heavy on the ground) | 28 / 6 / 37 = **71** | x 20..135, y 0..18 | Gideon drives the mallet head across the ground in a compact frontward sweep. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Gideon have a slot in the atlas; redraw any that reuse a non-downward pose.

## Jonathan

### Bow

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `bow_dlight` | Ground down light (Down + Light on the ground) | 12 / 1 / 23 = **36** | projectile from (30, 12) | A crouched low bow draw releases one arrow above floor level. |
| `bow_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x 12..67, y -55..17 | A downward close bow-body strike with the bow safely braced. |
| `bow_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -18..18, y -55..30 | A feet-first descending strike with bow held clear of the feet. |
| `jonathan_bow_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 31 = **61** | projectile from (28, 12) | Jonathan bends into a low archer stance and releases an arrow just above ground height. |

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `jonathan_sword_dsig` | Down signature (Down + Heavy on the ground) | 23 / 5 / 30 = **58** | x 20..125, y 0..18 | Jonathan crouches and cuts low ahead, keeping his body silhouette narrow. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Jonathan have a slot in the atlas; redraw any that reuse a non-downward pose.

## Moses

### Staff

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `staff_dlight` | Ground down light (Down + Light on the ground) | 10 / 5 / 20 = **35** | x 20..145, y 0..30 | One low front staff sweep, fighter lowers center of gravity. |
| `staff_dair` | Air down light (Down + Light in the air) | 12 / 5 / 23 = **40** | x 18..78, y -65..15 | One downward-diagonal staff tip strike with torso above. |
| `staff_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -18..18, y -85..30 | The staff is aligned downward and the fighter descends with exposed sides. |
| `moses_staff_dsig` | Down signature (Down + Heavy on the ground) | 27 / 6 / 35 = **68** | x 20..165, y 0..18 | Moses lowers into a braced stance and sweeps the staff across a low frontward lane, with ordinary sand dust. |

### Sling

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sling_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 20..80, y 0..32 | A low front kick while holding the sling safely back; no projectile. |
| `sling_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x -12..32, y -55..15 | A downward heel kick with sling arm safely extended upward. |
| `sling_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -55..30 | A feet-first downward strike with knees braced and clear landing recovery. |
| `moses_sling_dsig` | Down signature (Down + Heavy on the ground) | 28 / 5 / 36 = **69** | projectile from (28, 12) | Moses bends at the knee and releases a low stone across the training floor. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Moses have a slot in the atlas; redraw any that reuse a non-downward pose.

## Esther

### Blades

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `blades_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 16 = **27** | x 15..75, y 0..30 | A low controlled front blade cut from a knee bend. |
| `blades_dair` | Air down light (Down + Light in the air) | 9 / 4 / 20 = **33** | x 12..60, y -52..18 | One downward-diagonal crossing strike, body remains vulnerable. |
| `blades_ground_pound` | Ground pound (Down + Heavy in the air) | 14 / 12 / 27 = **53** | x -20..20, y -65..30 | A committed downward narrow blade strike with clear anticipation. |
| `esther_blades_dsig` | Down signature (Down + Heavy on the ground) | 23 / 5 / 30 = **58** | x 20..120, y 0..18 | Esther shifts backward during the windup, then sweeps one blade low in front while the other guards her body. |

### Staff

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `staff_dlight` | Ground down light (Down + Light on the ground) | 10 / 5 / 20 = **35** | x 20..145, y 0..30 | One low front staff sweep, fighter lowers center of gravity. |
| `staff_dair` | Air down light (Down + Light in the air) | 12 / 5 / 23 = **40** | x 18..78, y -65..15 | One downward-diagonal staff tip strike with torso above. |
| `staff_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -18..18, y -85..30 | The staff is aligned downward and the fighter descends with exposed sides. |
| `esther_staff_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 32 = **62** | x 20..160, y 0..18 | Esther bends to a low stable stance and draws the staff’s far end across the front ground lane. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Esther have a slot in the atlas; redraw any that reuse a non-downward pose.

## Miriam

### Staff

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `staff_dlight` | Ground down light (Down + Light on the ground) | 10 / 5 / 20 = **35** | x 20..145, y 0..30 | One low front staff sweep, fighter lowers center of gravity. |
| `staff_dair` | Air down light (Down + Light in the air) | 12 / 5 / 23 = **40** | x 18..78, y -65..15 | One downward-diagonal staff tip strike with torso above. |
| `staff_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -18..18, y -85..30 | The staff is aligned downward and the fighter descends with exposed sides. |
| `miriam_staff_dsig` | Down signature (Down + Heavy on the ground) | 24 / 6 / 31 = **61** | x 20..160, y 0..18 | Miriam bends one knee and sweeps the staff low across the front floor lane. |

### Sling

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sling_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 20..80, y 0..32 | A low front kick while holding the sling safely back; no projectile. |
| `sling_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x -12..32, y -55..15 | A downward heel kick with sling arm safely extended upward. |
| `sling_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -55..30 | A feet-first downward strike with knees braced and clear landing recovery. |
| `miriam_sling_dsig` | Down signature (Down + Heavy on the ground) | 26 / 5 / 33 = **64** | projectile from (28, 12) | Miriam crouches and sends one stone along a low frontward path; no water effects or miracles. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Miriam have a slot in the atlas; redraw any that reuse a non-downward pose.

## Nehemiah

### Hammer

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `hammer_dlight` | Ground down light (Down + Light on the ground) | 12 / 5 / 23 = **40** | x 20..115, y 0..35 | Low mallet sweep along the front training floor. |
| `hammer_dair` | Air down light (Down + Light in the air) | 14 / 5 / 27 = **46** | x 15..85, y -65..20 | One downward-diagonal mallet head strike. |
| `hammer_ground_pound` | Ground pound (Down + Heavy in the air) | 20 / 12 / 33 = **65** | x -25..25, y -80..30 | Mallet head points below and leads a vulnerable vertical descent. |
| `nehemiah_hammer_dsig` | Down signature (Down + Heavy on the ground) | 30 / 7 / 39 = **76** | x 20..140, y 0..18 | Nehemiah drops into a wide braced stance and strikes the floor ahead with the mallet; dust only. |

### Sword

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `sword_dlight` | Ground down light (Down + Light on the ground) | 8 / 4 / 17 = **29** | x 18..98, y 0..40 | Low body dip then a small rising blade flick toward the opponent’s feet. |
| `sword_dair` | Air down light (Down + Light in the air) | 10 / 5 / 21 = **36** | x 15..80, y -55..15 | Blade angles downward in front as the body remains vulnerable above. |
| `sword_ground_pound` | Ground pound (Down + Heavy in the air) | 15 / 12 / 27 = **54** | x -18..18, y -65..30 | A downward committed sword point with a visible overhead preparation. |
| `nehemiah_sword_dsig` | Down signature (Down + Heavy on the ground) | 27 / 6 / 36 = **69** | x 20..135, y 0..18 | Nehemiah lowers one knee and makes a low front-facing sword sweep with a clear ending pose. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Nehemiah have a slot in the atlas; redraw any that reuse a non-downward pose.

## Caleb

### Spear

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `spear_dlight` | Ground down light (Down + Light on the ground) | 9 / 4 / 19 = **32** | x 28..148, y 0..30 | Crouched spear tip flick forward just above the ground. |
| `spear_dair` | Air down light (Down + Light in the air) | 11 / 5 / 22 = **38** | x 20..75, y -70..15 | A short downward-diagonal spear poke; torso stays visible above. |
| `spear_ground_pound` | Ground pound (Down + Heavy in the air) | 17 / 12 / 29 = **58** | x -15..15, y -90..30 | The fighter turns spear downward and commits to a narrow descending strike. |
| `caleb_spear_dsig` | Down signature (Down + Heavy on the ground) | 27 / 6 / 35 = **68** | x 20..170, y 0..18 | Caleb pivots low and sweeps the spear shaft across the front ground lane. |

### Gauntlets

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `gauntlets_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 16 = **27** | x 15..70, y 0..32 | Low crouching fist strike that lifts slightly at contact. |
| `gauntlets_dair` | Air down light (Down + Light in the air) | 9 / 4 / 20 = **33** | x 10..55, y -50..15 | One downward-diagonal guarded fist; body exposed above. |
| `gauntlets_ground_pound` | Ground pound (Down + Heavy in the air) | 14 / 12 / 26 = **52** | x -20..20, y -55..30 | A committed downward palm/fist strike with a clear landing brace. |
| `caleb_gauntlets_dsig` | Down signature (Down + Heavy on the ground) | 26 / 6 / 34 = **66** | x 20..110, y 0..18 | Caleb crouches and sweeps a guarded fist low in front while keeping his other hand at his chest. |

### Unarmed

| Clip id | Move | Startup / active / recovery = total ticks | Hit reach (units, from feet) | Pose to draw |
| --- | --- | --- | --- | --- |
| `unarmed_dlight` | Ground down light (Down + Light on the ground) | 7 / 4 / 17 = **28** | x 15..65, y 0..30 | A controlled low front kick. |
| `unarmed_dair` | Air down light (Down + Light in the air) | 10 / 4 / 21 = **35** | x 8..48, y -50..15 | A downward-diagonal heel strike. |
| `unarmed_ground_pound` | Ground pound (Down + Heavy in the air) | 16 / 12 / 28 = **56** | x -18..18, y -50..30 | A downward feet-first strike with guarded arms. |
| `unarmed_dsig` | Down signature (Down + Heavy on the ground) | 25 / 5 / 30 = **60** | x 15..95, y 0..28 | A low guarded hand/leg sweep in front with slow recovery. |

All 12 down-attack clips for Caleb have a slot in the atlas; redraw any that reuse a non-downward pose.
