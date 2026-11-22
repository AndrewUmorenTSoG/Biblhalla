# Codex: keep art work local

Andrew's rule (2026-11-17): the repository holds only what the game ships and what the tests check. Everything made while producing art stays on the local machine.

## Stays local (never commit)

- `assets/animation-production/`: source drawings, prompts, contact sheets, review GIFs and every preview page (`PLAY.html`, `playback.html`, `attacks.html` and the rest). Build and open previews locally; do not commit them.
- Drafts, intermediate sheets and backups in `assets/runtime/fighters/` that `fighters.json` does not point at, for example `*-attacks.png`, `*-equipped.png`, `*-smooth-packed.png` and `fighters-before-*.json`.
- `artifacts/` and any other scratch output.

All of these are in `.gitignore`. If `git status` shows a new kind of draft file, add it to `.gitignore` instead of committing it.

## Gets committed

- The runtime sheets `fighters.json` loads (today the `*-fluid-packed.png` pages and Gideon's rebound and shield-kit pages) and `fighters.json` itself.
- `assets/runtime/arenas`, `menu`, `story` and `weapons`, which the build reads.
- Tools in `tools/art/` and tests in `tests/art/`. Tests must not read from `assets/animation-production`. Put small spec files a test needs in `tests/art/fixtures/`.

## Before each commit

1. `npm run format` (keeps the code neat), then `npm test` and `npm run art:check` pass.
2. `npm run build` succeeds. Report the new size of `dist/PLAY.html`.
3. `git status` shows no files from the "Stays local" list.

## Character style (Andrew's requirement)
New fighters and story opponents must match the original David and Saul sprite artwork: detailed outlined, painted characters with consistent proportions and individually drawn poses. Do not substitute geometric humanoids or animate a static concept cutout. Compare the sheets and in-game motion beside the original roster before shipping. Missing textures must never fall back to a different character style.
