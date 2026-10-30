# Match rules, modes and local multiplayer prompt

Build complete playable rule sets using a shared match controller. Separate game rules from UI presets. Read canonical `rules.json` and the offline runtime prompt. Every result is computed and stored locally.

## Mode matrix

| Mode | Players | Default | End condition | Pause |
|---|---|---|---|---|
| Training | 1 + dummy | Unlimited resources configurable | Player exits | Full offline pause |
| Solo duel | 1 + bot | 3 stocks, 5 minutes | Stocks, then tiebreak | Full offline pause |
| Local duel | 2 simultaneous | 3 stocks, 5 minutes | Stocks, then tiebreak | All-player pause |
| Local free-for-all | 2–4 | 3 stocks, 5 minutes | Last remaining | All-player pause |
| Local teams | 2v2, bots may fill | 3 stocks each, 5 minutes | Team has no lives | All-player pause |
| Story campaign | 1 + companion; optional same-device co-op | 84 level-specific objectives | Checkpoint/level controller | Full pause |
| Waves | 1 + multiple bots | Finite explicit waves | Clear all waves | Full pause |
| Boss | 1 + one boss | Explicit guard/opening rules | Encounter objective | Full pause |

Tournament/custom modes expose stocks 1–9, timer 1–10 min, teams, map pool, friendly fire and bots under More options. The short default screen shows mode, players, arena and Start. The local setup owner edits rules; every assigned human sees the final rules before Ready. Rule change cancels all Ready statuses. Random fighter selection resolves through match seed before loading and is shown before countdown.

## Stocks and respawn

Crossing a blast boundary uses the fighter’s center point at feet+37 units, inclusive outside comparison. On confirmed KO, remove one stock once. For remaining stock, wait 90 ticks then spawn at a selected safe point with zero damage, unarmed, restored resources and 120 ticks of invulnerability. Attacking or throwing ends invulnerability immediately; movement does not. Spawn selection prefers maximum distance from enemies among authored points, deterministic ID tie-break, with a minimum 180-unit separation when possible. Never spawn below stage or inside another collider.

If all lives are lost, remove active hurtbox and inputs and show spectator controls. Local player controller remains assigned and can use menus. Team stock sharing is off at launch; do not invent extra teammate lives. All simultaneous KOs are resolved from the same pre-result tick to avoid an arbitrary winner.

## Timer and tiebreak

Timer counts active simulation ticks, including respawn periods but excluding offline pause and pre-match countdown. At time limit compare remaining stocks, then lower total current damage; teams compare summed stocks then summed damage. If tied, sudden-death round gives tied contenders one stock and 150 damage on the same arena, weapon pickups still active, for 60 seconds. If still tied, local play records a draw instead of choosing by player ID. Simultaneous final KO is a tie and invokes the same rule. Do not use client UI timer to decide.

## Lobby and local assignments

Players join using assigned devices. Lobby cards show player number, input method, fighter, team, Ready, and a Remove control behind that slot’s More button. One person’s keyboard input cannot edit another player’s fighter accidentally. Inactive slots offer Add bot. The Start button enables when the chosen preset has a valid player/team count and all human players are Ready. No lonely 2v2 team starts by accident. Leaving a local lobby preserves selected control profiles.

## Score modes as later extensions

Optional timed free-for-all uses +1 for an opponent KO and -1 for self KO, attributed to last valid enemy hit within 600 ticks. Throw ownership and eliminated attackers retain an immutable match participant ID. Last-hit attribution is display information only in stock modes. Do not combine stock and score victory conditions in one unlabeled preset.

## Match sequence

Loading → device/asset-ready confirmation → visible 3/2/1 countdown → active play → local result → saved completion → rematch/lobby. Match start waits until local assigned inputs and assets are ready. Offline countdown may be skipped in training, never silently in competitive mode. Result shows placement, stocks remaining, damage dealt, fair-play Rematch, and Exit. No unsolicited store popup.

## Acceptance

Exercise every player count, bots filling slots, teams, simultaneous KOs, self falls, time ties, sudden death, respawn invulnerability, input disconnect, rule edit after Ready, quit confirmation and rematch. iPad touch supports one local fighter; external devices permit others. Real-time combat is simultaneous, not sequential pass-and-play.

## Difficulty and prototype scope

Solo computer choices are Easy / Hard / Extremely Hard, with observation/decision targets 27/14, 12/6 and 6/3 ticks. The standalone prototype implements solo duel, three waves and one boss with simplified mechanics. It starts armed, has 70-tick respawn and 100-tick immunity, and uses an immediate lives/damage timeout result instead of production sudden death. These intentional slice differences do not overwrite the full production rules.
