# Sources and original design assumptions

Research date: 14 October 2026. Sources establish reference features and technical API considerations. The original numerical rules and art in this pack are design decisions, not extracted game internals.

## Primary sources reviewed

- [Brawlhalla official website](https://www.brawlhalla.com/): describes the reference as a 2D platform fighting game with platform fighting and multiple control methods. Used for category/scope reference only.
- [Official Brawlhalla patch 3.34](https://www.brawlhalla.com/news/brawlhallidays-patch-3-34): historical discussion of directional gravity cancel and weapon-throw changes. Historical patches are not a full current mechanics contract.
- [Official Brawlhalla patch 8.03](https://www.brawlhalla.com/news/new-legend-seven-patch-8-03): historical examples of stun, dodge windows and dash-related balance. Supports the need for explicit attack timing and testing, not our particular values.
- [Official Brawlhalla patch 9.05](https://www.brawlhalla.com/news/patch-9-05-brawlhalla-guardians): historical examples of whiff cancel-window changes. We author our own whiff/commitment rules.
- [PixiJS 8 Application documentation](https://pixijs.com/8.x/guides/components/application): asynchronous Application initialization and renderer setup. Exact implementation dependencies must be pinned when coding starts.
- [PixiJS 8 Ticker documentation](https://pixijs.com/8.x/guides/components/ticker): render-frame callback scheduling. The fixed simulation separation is our engineering decision.
- [PixiJS renderer documentation](https://pixijs.com/8.x/guides/components/renderers): WebGL/WebGPU rendering options. WebGL baseline is our portability choice.
- [WebKit Safari 16.4 feature notes](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/): Web Audio user-activation considerations. Test actual supported Safari versions; historical notes are not a blanket platform guarantee.
- [Apple Safari resources](https://developer.apple.com/safari/resources/): official starting point for current Safari capability/compatibility validation during implementation.

## What is original in this pack

Roster styling, character costumes, the 72 signature choreographies, weapon-family attacks, 60 Hz contract, all fixed-point constants, damage/force equations, dodge/air-cancel/wall-fatigue rules, six arena geometries, UI layout/palette, bot tiers, offline packaging and local save contracts, progression decisions and anthology challenges. Familiar platform-fighter concepts are implemented through explicit original rules.

## What is not verified

Exact parity with Brawlhalla physics, frame data or its proprietary runtime; final tournament balance; real-device performance; completed runtime animation; live multiplayer hosting; App Store/Steam release; title availability. None should be claimed from this document or the generated images.

## Scripture references

Each fighter file identifies the relevant biblical passages and distinguishes recorded background from invented arena combat. No full modern-translation quotations are required by this pack. Verify any shipped quotation against its named translation and applicable license. Short context summaries here are original paraphrases.
