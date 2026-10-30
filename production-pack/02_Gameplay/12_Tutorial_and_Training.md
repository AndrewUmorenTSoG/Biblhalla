# Tutorial, learning and training prompt

Build a short optional interactive tutorial and a serious training mode. Use clear objectives and immediate demonstrations; hide advanced diagnostics behind Details. The tutorial must accept touch, keyboard and controller glyphs from the active profile rather than showing a PC-only key screenshot.

## First lesson — about one minute

1. **Move:** reach two ground markers. Show only the active movement glyphs; next step unlocks after observed motion.
2. **Jump:** jump onto an accessible platform; show ground jump then an air jump. Do not require a speedrun timer.
3. **Attack:** light-attack a stationary dummy. Show numeric damage and the explanation “More damage means stronger knockback.”
4. **Directional attack:** hold Side then Light, and Down then Light. The dummy resets between attempts; label the move actually resolved.
5. **Dodge:** avoid one slow telegraphed training strike. Explain that timing matters and dodge has a cooldown.
6. **Return:** step off a safe ledge, use air jump/recovery to return. Failure rewinds the lesson without punishment.
7. **Finish:** knock a high-damage dummy across a side boundary. Show one lost stock; end with Play a bot / Practice more.

Player may pause, skip or repeat. A skipped tutorial never locks the roster or local casual rooms. Lessons must read successful semantic actions and real collision outcomes, not arbitrary button presses. Do not report success if the input did nothing.

## Advanced lessons

Short modules: neutral versus side attack, fast fall, weapon pickup/throw/drop, wall fatigue, dash-jump, whiff punish, recovery management, chase movement, aerial spot dodge into grounded attack, team friendly fire and offstage spacing. Each has one visible goal and a one-button demonstration. The air cancel lesson highlights that it spends the dodge and immediately loses invulnerability. Show failed attempts with the actual state, e.g. “That was a directional dodge; try a neutral dodge.”

## Training main UI

Always visible: Return, Reset positions, Current fighter/weapon, Dummy behavior. Settings opens dummy damage, reaction, dodge direction/timing, weapon, stocks, pickup timing and map. Details opens hitbox overlay, frame step, speed, input history, state history, resource timers, escape gap and combo counter. Record/Replay dummy inputs is an advanced button. Avoid ten permanent dropdowns covering the arena.

Preset dummy: stand, jump, approach, attack, dodge after hitstun, recover, record/playback. Random choices use training seed and are reproducible. Training speed may change wall-clock pacing only, preserving 60 simulation ticks as the model. Frame step advances exactly one tick. Reset restores all timers and entities, not just position/damage. Unlimited resources is clearly an offline training override and cannot be applied to local state.

## Combo honesty

Show “2 hits” separately from “True combo.” A true-combo claim requires no legally actionable defender escape tick under the current damage, stats, hitstop and position. Compute escape windows from simulation legality, not display spacing. Display dodge on cooldown versus ready distinctly. Save test setup with fighter pair, content hash, seed, start positions, damage and action recording. Do not publish universal combos based only on one stationary dummy.

## Acceptance

A new user can explain stocks and damage after the lesson and recover from the training ledge. Every lesson works on all input types. Full reset produces a known hash. Every move can be inspected and frame-stepped, including charge, projectile, throw, air cancel and unarmed heavy. Training assistance is absent from local arena matches.
