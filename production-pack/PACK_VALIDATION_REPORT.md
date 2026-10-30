# Offline prompt-pack validation report

Completed: 14 October 2026. Scope: **design/data/package consistency**, not runtime certification of the unbuilt full campaign.

## Completed checks

- Twelve distinct fighters, valid weapon pairs, equal 15-point stat budgets and six signatures each.
- 147 original attacks, positive matching frame totals, valid contact phases, bounded projectiles, deterministic vectors and single resource consumption.
- Six authored arena definitions, valid geometry/spawn ranges and unclaimed balance approval.
- Eighteen supplied concept PNGs with valid signatures, matching sizes/SHA-256, saved prompts and honest concept readiness.
- Fully offline rules, no service-required data, three requested difficulties.
- Eighty-four sequential linked levels across fourteen chapters; sixteen multi-opponent wave levels and eleven single-boss levels; valid source/objective/unique rule, finite wave scripts, three boss phases and matching standalone prompts.
- Final six levels noncombat; resurrection endpoint references; chapter/order and source labels.
- Local Markdown/gallery links and balanced fenced blocks.

Run [the validator](07_Engineering/Tools/validate_pack.py) with Python's standard library. Raw output is in [09_Data/validation_result.json](09_Data/validation_result.json).

## Actual result

3237 consistency checks passed; zero failed. 379 local Markdown targets checked. All 84 level records and 14 chapters passed.

## Separate playable slice

The separate offline prototype ZIP was built and exercised in a headless Chromium local-file session with networking disabled. Twelve simulation tests and nine mode/difficulty browser smoke combinations passed; zero HTTP requests and zero JavaScript page errors were observed. See that ZIP's VERIFICATION.md for detailed evidence and its narrower scope.

## Remaining production work

The complete campaign, full roster mechanics, final animations/layered story maps, companion/local multiplayer, durable full-game saves and signed iPad release remain implementation tasks. No physical iPad/controller/Windows/macOS-device test, Xcode build, formal theological review or full-game balance/performance certification is claimed. The original eighteen images remain concept references. Package consistency does not mean all planned features are playable.
