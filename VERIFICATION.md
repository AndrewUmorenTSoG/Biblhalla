# Main-game verification — 14 October 2026

57 automated tests passed, zero failed. See docs/test-results.txt for actual results and docs/build-manifest.json for the built content/mechanics hash.

The tests cover all 147 grammar entries, mirrored geometry, capsule contact, legal movement resources, solid/one-way collision, attack timing and charges, trade resolution, weapons and pickup ties, finite waves, real match results, team rules, entity hitstop, 10,000-tick seeded recordings at every difficulty, render-batching invariance, snapshots/replay validation, save backups and denied storage, all campaign controller completions, and actual movement-input reachability across all 57 noncombat records.

Campaign combat completion tests use controlled success fixtures. They do not certify expert-player balance, all human encounter playthroughs or exact fidelity to bespoke level/boss choreography. HTML tests prove script syntax and explicit element wiring; they are not browser integration or layout tests.

Browser inspection was rejected by the browser URL protocol policy for file: pages. No browser screenshot, physical controller/touch certification, performance baseline, full TypeScript type-check or signed iPad build is claimed. No iPad native compilation has run. Production art and narrative/balance reviews remain outstanding.

The original prototype verification report and original author test reports are preserved under prototype/. They do not describe new browser tests of this main build.
