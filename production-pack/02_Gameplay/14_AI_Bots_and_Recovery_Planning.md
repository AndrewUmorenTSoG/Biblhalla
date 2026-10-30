# Bots and recovery planning prompt

Build useful fair opponents using the same input frames and action legality as humans. No direct velocity edits, instant dodges, damage bonuses, infinite jumps or knowledge of unsubmitted player inputs. Bot decisions run inside the deterministic simulation with their own serialized seed and memory.

## Architecture

Perception → delayed observations → tactical state → move candidate scoring → canonical input. States: approach, maintain range, punish, anti-air, attack, disengage, recover, seek pickup and reset after KO. Use map navigation nodes for ground/one-way platforms and reachability from the actual movement model. Bot begins recovery as soon as landing probability is threatened; do not treat offstage as ordinary approach.

Bot sees positions, velocities and visible animation states with a configurable reaction delay. It may know its own exact resources, but enemy dodge timing must be estimated from observed dodge events rather than private simulation state unless explicitly needed for a high-level debug bot. Difficulty changes reaction, planning horizon, decision noise and consistency, not stats or physics.

## Difficulty targets

| Level | Reaction delay | Decision interval | Behavior |
|---|---|---|---|
| Easy | 27 ticks | 14 ticks | Slower approach, visible pauses, safe recovery and imperfect attacks |
| Hard | 12 ticks | 6 ticks | Consistent spacing, whiff punishes and occasional dodge reads |
| Extremely Hard | 6 ticks | 3 ticks | Strong spacing, accurate pressure, resource-aware recovery; still legal inputs |

Minimum attack commitment and human-like imperfect timing prevent frame-perfect cheating. Easy should recover reliably enough to teach useful play without beating beginners through endless ledge mistakes. Add a separate test bot with exhaustive legality knowledge for QA; do not present it as the ordinary Extremely Hard opponent.

## Candidate scoring

For each legal attack estimate target lane intersection using delayed velocity, risk of whiff, required distance, exposed recovery, expected escape and position relative to ledge. Penalize repeat signatures, risky ground pounds while far from stage and projectile spam at cap. Reward safe approach, preserving air recovery and controlling a reachable landing route. Use seeded tie-breaking. Do not compute outcome by looking into the human’s future input recording.

## Recovery

Compute nearest safe stage-top interval, own jumps/recovery/wall token, distance to blast zone and predicted trajectory. Prefer an air jump to regain height before moving horizontally; reserve recovery when needed; wall jump only when its fatigue/resources permit. Choose a recovery route away from an observed edgeguard when possible. A bot must not spend two actions in one tick or attempt a recovery already consumed. Training Recover dummy may use a fixed reproducible route for practice.

## Team behavior

Maintain space from ally, pick separate targets when sensible, avoid friendly-fire lanes when local friendly fire is enabled and do not throw through teammates carelessly. Teammate support means positioning, not invented healing or moral buffs. Bot fills offline slots only as clearly labeled CPU. Controller loss pauses the whole game; it does not secretly replace a human.

## Acceptance

Run at least 200 seeded offline matches per level on each map, log self-KO rate, recovery success, action legality violations and repeated move ratios. Invalid-input advantage must be zero. Easy win rate against real newcomers and Extremely Hard quality require user playtests, not invented percentages. Serialize bot memory so replay/restore hashes match. Test empty pickups, one-stock pressure, projectile cap, wall expiry, simultaneous trades and ally blocking paths.
