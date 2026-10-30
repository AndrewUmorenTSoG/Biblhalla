# Performance, capability and accessibility prompt

Act as performance engineer and accessibility reviewer. Preserve authoritative mechanics while adapting presentation to hardware. Choose a declared baseline after physical tests; this pack contains no measured device benchmark. Target PC standalone/browser and signed iPad app first, and feature-test capabilities instead of identifying browsers solely by user agent.

## Initial budgets to validate

60 Hz simulation; 60 FPS presentation target on declared baseline; 30 FPS presentation fallback without changing sim speed. Initial critical boot/menu decoded-size target ≤5 MB compressed excluding selected arena/fighter art; first-match bundled-asset target ≤25 MB with efficient atlases/audio. Loaded texture memory target ≤150 MB on baseline, with selected-fighter/map unloading between matches. These are engineering targets, not verified results. Track peak memory over 20 rematches and Safari background/resume cycles.

Cap device pixel ratio initially at 1.5 on low mode and 2 on high; test actual readability and thermal effects. Do not render 4K because an iPad reports a high pixel density. Reduce particles, decorative parallax, shadow complexity and render resolution before dropping presentation FPS. Never shrink attack boxes, skip sim ticks or shorten animations to “optimize” combat. Use pools for projectiles/VFX and reusable arrays for broadphase collision.

## Loading and caching

Content-hashed bundled assets, byte-aware local decode progress, retry and safe prior-version updates. The entire roster/campaign/audio is installed locally. Native bundled builds launch offline on first use. Optional PWA distribution must verify complete caching and clearly handle eviction; it is not the strict offline baseline. No CDN, streaming asset, authentication request or telemetry. Updates never replace code mid-match.

## Lifecycle

Local visibility loss pauses and clears input; resume via a short countdown. All modes stop simulation until explicit resume. AudioContext resumes after user action. Handle lost WebGL context with restored assets/state or a clear retry; preserve local checkpoint and result state. iPad toolbar resize, split view and orientation change recompute presentation without altering world geometry. Do not assume fullscreen or orientation lock will work.

## Accessibility obligations

Visible keyboard/controller focus, screen-reader-readable menus, accessible form labels, readable contrast, UI scale, subtitles for spoken instructions, numeric damage, player number/shape markers, reduced motion, shake/flash toggles, left-handed and movable touch controls. Optional haptics are capability-detected and not essential feedback. Menus honor browser zoom; gameplay surface may control gestures locally to support input without blocking the whole document.

No requirement forces rapid button mash to open settings or continue a lesson. Charge may offer a hold/toggle preference only if it emits equivalent legal input and does not automate timed sequences. Any macro/auto-combo assistance remains offline and labeled. Avoid claiming full accessibility of sight-dependent real-time combat without specialized testing; state the verified menu/control accommodations.

## Measurements

Record sim tick time, draw time, long tasks, texture memory estimate, atlas load, startup-to-input-ready duration, fixed-tick backlog, battery/thermal behavior observations and input-to-visible-action latency measured on actual devices. Browser devtools alone does not prove touch latency or sustained iPad performance. Use a stable performance scene with four fighters, active projectiles and dense but bounded VFX. Test both low/high quality and reduced motion.

## Acceptance

Twenty rematches show no growing listener/entity/texture leak. A 30/60/120-render recording has identical sim hashes. Controls remain usable in supported landscape and split-view sizes. Context-loss and cache-failure flows work. All screen actions are reachable without a mouse. Required device matrix names exact OS/browser/hardware versions and records pass/fail honestly.
