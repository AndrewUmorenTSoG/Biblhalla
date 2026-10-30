# Prototype verification

## Completed in this environment

- **12 Node simulation tests passed:** countdown/normalization, pause/resume, movement/air resources, recovery momentum, melee/projectile damage, dodge/immunity, throw/pickup, stock/respawn reset, all seven wave opponents, boss victory, real loss/time limits and seeded replay equality for all three difficulties.
- **Chromium 153 headless, local file URL, network disabled:** loaded every embedded asset with zero JavaScript page errors and **zero HTTP requests**. No web server was used for the successful launch test.
- **Nine browser smoke combinations:** Duel/Waves/Boss × Easy/Hard/Extremely Hard. Each started, accepted attacks, froze ticks during pause and resumed correctly. All three arena images were exercised across that matrix.
- **Browser flow checks:** actual keyboard-driven three-life loss opened Results, Rematch restarted countdown, settings preserved setup choices, unavailable controller disabled Play, touch joystick moved the character, pointer cancellation cleared a held action, and large left-handed touch controls appeared.
- **Package checks:** five embedded PNGs, twelve atlas frames within image bounds, no fetch/WebSocket/XMLHttpRequest call, no external runtime resource reference, restrictive no-connection content policy, portable standard-library build and included iPad source.
- Menu, match, boss and touch screenshots were visually inspected. GAMEPLAY_PREVIEW.png is an actual running prototype capture.

Raw successful browser observations are in `tests/browser-test-results.json` and `tests/launch-test-results.json`. Browser smoke tests prove the exercised paths; they do not certify all input hardware or sustained performance.

## Remaining limits

No physical iPad, actual Windows/macOS device, paired controller or native Xcode compilation was available here. Touch was exercised through a desktop browser’s pointer input and tablet viewport, not certified on Safari hardware. The signed iPad package is not included; the WKWebView source project needs Mac/Xcode signing and real-device tests. Controller-only menu navigation is not implemented.

This slice uses simplified original floating-point physics and shared attack shapes. It does not implement the full production Q8 rule set, 147 move records, complete weapon-specific animation, charge/cancel/chase rules, story campaign, replay UI, local multiplayer or full remapping. Sprite atlases contain six independent key poses rather than complete production animation clips. Secondary weapon actions use the shared pose art and drawn impact cues. Map art is an opaque concept image with visible collision-top lines.

## Reproduce

Play: extract and open PLAY.html with internet disconnected.

Source build: `python3 build.py` (Python standard library only).

Simulation: `node --test tests/simulation.test.cjs`.

Package: `python3 tests/offline_package_test.py`.

Browser QA is a developer test requiring Playwright and a local Chromium executable; it is not a runtime dependency. Install a compatible Playwright browser for your environment, then run `node tests/browser-smoke.cjs`. Optional environment variable `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects an existing test binary. Device tests listed above remain separate.
