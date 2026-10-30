# Biblhalla

This folder contains the Covenant Clash offline prototype supplied in the ZIP.

## Play

Open PLAY.html in Edge, Chrome, or another modern browser. Choose your input, fighter, computer difficulty, encounter, and arena, then click Play offline. All artwork and game code are embedded; no installation or server is required.

## Build and verify

With Node installed, run these commands from this folder:

```text
node build.cjs
node --test tests/simulation.test.cjs
node tests/offline-package.test.cjs
```

The original Python build and package test remain available. Node versions were added because Python is unavailable in this environment. npm run build, npm test, and npm run test:package provide the same commands. Runtime gameplay has no package dependencies.

## Verification on 14 October 2026

The standalone HTML was rebuilt from source. All 12 supplied simulation tests passed, and the offline package checks passed: five embedded PNGs, twelve valid atlas frames, no external runtime resources, and outgoing connections blocked by the content policy.

Browser smoke tests were not rerun here because Playwright is unavailable. The included VERIFICATION.md and original JSON test reports describe the original package author’s prior verification, not new browser testing. The iPad wrapper remains source only and requires Mac/Xcode signing and physical-device testing.

This prototype includes two fighters, three arenas, and Duel, Waves, and Boss modes. The separate production-pack story campaign and full roster are outside this supplied prototype. See README_START_HERE.md for full controls and scope.
