# Balance, matchup review and tuning prompt

Act as combat balance lead. Use the move data as an initial prototype, not a promise of competitive balance. Shared hurtboxes, fixed attack timing across stats and constrained signature systems are deliberate controls. Tune with evidence and preserve reproducible content versions.

## Evaluation grid

Twelve fighters create 66 distinct unordered non-mirror pairs, plus 12 mirror matchups. Test both player slots and both arena sides. Four proposed local arena maps multiply those conditions; six maps are reviewed for casual fairness. Cover damage 0/50/100/150, neutral spacing, corner/offstage positions, both weapon states and unarmed. Assess keyboard/controller/touch parity with the same semantic recordings, then physical usability separately.

## Key measurements

Whiff punish window, reliable starter range, anti-air coverage, safe escape options, high-damage finishing thresholds, recovery survivability, projectile downtime, time to center, wall camping duration, average match length, stock snowballing and repeat signature effectiveness. Power/Guard/Speed sum to 15 across the roster. Higher Power must come with measurable movement or survival tradeoffs; do not secretly increase hurtboxes for heavy characters.

True combo = no legally actionable escape tick under specified conditions. A string with a dodge-read gap is useful but not a true combo. Every published combo requires saved start conditions and an input trace. Avoid fabricated example combos in marketing. Initially show “Try Down Light, then jump and test Neutral Air” as a practice experiment, not a guarantee.

## Instrumentation output

Per match: content/rules hashes, fighter pair, weapon time, actions, hits, whiffs, damage, launches, KOs, self-KOs, chase uses, air cancels, dodge success, wall refreshes, recovery attempts/success, match duration, RTT corrections where relevant and final result. Aggregate without unnecessary personal data. Keep player display names out of general tuning exports by default; use pseudonymous match IDs.

## Tuning procedure

1. Reproduce the issue with a saved trace, identify context and intended counterplay.
2. Change one main variable: startup, recovery, reach, displacement, damage or force. Avoid adjusting everything at once.
3. Run deterministic tests, a standardized punish/escape suite and at least 20 deliberate local playtest matches for the change.
4. Reassess affected fighter/weapon family and map interactions. Document expected effect and measured result.
5. Version the content, invalidate incompatible replays or preserve old content bundles, and publish concise change notes.

Do not use random damage variance to “balance” a strong move. Do not copy current external frame values into the pack and assume resulting balance transfers. Touch users should not get automatic aim, hidden armor or different gravity. Improve touch ergonomics if they struggle.

## Release gate

No repeatable infinite combo, invulnerability loop, permanent wall stall or uncontestable full-stage projectile loop. No signature is safe against all correctly spaced retaliation. Proposed local arena maps pass measured left/right recovery tests. Matchup win rates need adequate sample counts and confidence intervals; do not claim 50% balance from a handful of games. Record unresolved tradeoffs openly before local arena release.
