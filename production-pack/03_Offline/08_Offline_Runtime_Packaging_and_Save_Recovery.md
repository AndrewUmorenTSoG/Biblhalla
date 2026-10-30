# Fully offline runtime and distribution prompt

Implement a local game. A network failure is not a game state: every playable feature works without a connection. Installed assets contain the complete roster, arena/campaign data, art, text, captions, audio and required runtime libraries. No account, sign-in, activation ping, matchmaking, external leaderboard, ads, analytics, streamed asset or remote permission check. Research URLs in Markdown are never opened by the runtime.

## PC artifact

Ship a standalone executable/native web wrapper, or a self-contained classic-script HTML for the prototype. Double-click PLAY.html after extraction in a JavaScript-enabled modern browser. Avoid ES-module/file-origin fetch requirements in a file build. Embed needed images or use wrapper-safe local asset loading. Do not require Node, npm or a development server to play the PC prototype. Keep source/build tools available separately.

## iPad artifact

For the finished fully offline product, build a signed iPad app with a bundled web view or native game engine. Bundle every resource; load the entry point locally; block arbitrary external navigation; use normal platform storage and pause on lifecycle changes. A source ZIP is not a signed .ipa. A desktop HTML file displayed by Files/Quick Look may not execute scripts or expose controllers correctly. The separate prototype includes a WKWebView source project as a developer path; compilation/signing and physical iPad testing remain required.

A PWA is optional: require a complete verified install/cache and an explicit Ready offline status. Test storage eviction/recovery; a partial cache is not a fully offline installation. Do not let a service worker silently replace code during a match. Native bundled installation is the strict first-launch-offline target.

## Local state

Store settings, chapter checkpoints, completed IDs, journal flags and local medals. Use schema/content versions, bounded file sizes, safe ID validation, atomic writes and previous-valid backup. Storage denied means playable in-memory fallback, honest status and local export. No cloud sync dependency. Rematch/results commit locally once by match ID. Replays store seed, initial state, semantic inputs and content hash. Reopening the game restores a safe checkpoint, not a partially executing boss contact.

## Input and lifecycle

First launch asks Keyboard / Touch / detected Controller and checks the chosen method. One More options button handles remapping, handedness and sensitivity. All games pause on focus loss/background/controller disconnect. Clear held inputs and pause audio, resume only after explicit action. Same-device local multiplayer assigns unique physical inputs; there is no wireless or internet cross-device session in scope.

## Acceptance

Install → disable all network → launch cold → start each mode/difficulty → complete results/rematch → save/restart → continue a chapter → import/export locally. Record HTTP requests and reject any runtime external resource or telemetry. Test missing/corrupt assets, denied storage, insufficient disk, interrupted save, migration, touch cancellation, rotation and controller loss. Physical iPad app launch and PC standalone launch are separate evidence; desktop emulation is not an iPad certification.
