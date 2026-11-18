# Gauntlets: controls and combo routes

The shared kit applies to Caleb and Samson. Directions are relative to facing and
mirror automatically. Light starters are fast and close-range; heavy attacks
have punishable recovery. Damage below is base damage before fighter modifiers.
Timing is startup / active / recovery at 60 simulation ticks per second.

| Input | Move | Timing | Damage |
|---|---|---|---|
| Ground Neutral + Light | Jab · Cross · Hook | 6 / 9 / 13 | 12 total across three hits |
| Ground Side + Light | Advancing Hook | 7 / 5 / 16 | 12 |
| Ground Down + Light | Low Sweep · Lift | 7 / 5 / 15 | 9 |
| Air Neutral + Light | Rising Air Hook | 7 / 5 / 16 | 11 |
| Air Side + Light | Flying Cross | 9 / 4 / 19 | 14 |
| Air Down + Light | Descending Hammerfist | 9 / 4 / 20 | 12 |
| Air Neutral/Side + Heavy | Rising Uppercut recovery | 10 / 7 / 22 | 15 |
| Air Down + Heavy | Double-Fist Ground Pound | 14 / 12 / 26 | 18 |
| Caleb Ground Neutral + Heavy | Resolute Uppercut | 14 / 7 / 24 | 26 |
| Caleb Ground Side + Heavy | Mountain Step | 24 / 5 / 32 | 28 |
| Caleb Ground Down + Heavy | Mountain Breaker | 20 / 6 / 28 | 27 |
| Samson Ground Neutral + Heavy | Lift and Hammerfist | 10 / 17 / 22 | 28 |
| Samson Ground Side + Heavy | Gate Rush | 24 / 6 / 35 | 30 |
| Samson Ground Down + Heavy | Ground Break | 27 / 6 / 36 | 29 |

## Hold and release

Release the directional control, then hold Heavy to charge Caleb's uppercut.
The coiled pose holds before the hit begins. Releasing Heavy fires it; reaching
the 36-tick charge limit fires automatically. A tap performs the uncharged move.
Airborne Heavy is the recovery move and consumes one recovery use.

## Confirmed-hit combo routes

- Neutral Light → Side Light or Down Light.
- Side Light → Down Light.
- Down Light → Neutral Heavy (tap for the fastest uppercut; holding adds a gap).
- Side Light → Down Light → Neutral Heavy.
- Confirmed airborne Light → Light → Light, with at most two aerial follow-ups.

Queue the next input as a hit connects. Contact buffers survive hitstop and the
remaining active frames. Grounded links are capped at two; a whiff cannot cancel.
The three-hit jab does not also cancel into chase dash: this prevents repeated
guaranteed jab loops. Other eligible lights retain their chase cancels.
These are available routes, not promises of inescapable combos at every damage,
spacing, height or charge duration.

## Animation and effects

Caleb's uppercut uses eight new registered sprite drawings, synchronized to
windup, hit, follow-through and recovery. Mountain Breaker uses the two-fist
floor-contact sprite, with shaded rock chunks that arc out, split and dissolve.
The airborne ground pound creates its rocks only on floor contact.
Rock particles are cosmetic and do not extend collision or add extra damage.

Frame metadata must sum to each move's total ticks and return to equipped idle.
The move showcase displays the live simulation, control mapping and combo hints.
