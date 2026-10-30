# Biblhalla

An offline biblical arena fighter and Story Archive campaign by **Kendrew Games**. Twelve fighters, six arenas, 147 authored attacks and an 84-level campaign that walks with Dru and Ken from Genesis to the empty tomb.

Biblhalla runs entirely on the device. There is no account, server, telemetry or network access.

## Play

```bash
npm install
npm run build
```

Then open `dist/PLAY.html` in a modern browser, or double-click `platform/pc/Launch Biblhalla.cmd` on Windows.

## Develop

```bash
npm run validate:content   # check production-pack/09_Data
npm run typecheck
npm test
npm run serve              # preview dist/ at http://127.0.0.1:4173
```

Requires Node 24 or newer. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is organised and [docs/IMPLEMENTATION_MATRIX.md](docs/IMPLEMENTATION_MATRIX.md) for what is done.

## Sources

- `production-pack/` is the design authority: product bible, gameplay specs, canonical data, art and campaign prompts.
- `prototype/` is the preserved original two-fighter slice, kept as a behaviour reference.

## Content principles

Arena moves are invented sporting actions, labelled separately from the Bible accounts they draw on. Jesus, God and the Holy Spirit are never playable fighters or bosses, and the final six levels are noncombat witness scenes.

## Status

This is a development build. Fighter art is procedural placeholder art, the menu layer is being rebuilt, and no device QA has been done yet. It is not shipping-ready.
