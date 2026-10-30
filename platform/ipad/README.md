# Biblhalla iPad source build

This updated WKWebView project bundles the built ../../dist/PLAY.html and calls BiblhallaLifecycle.suspend() when resigning active. It blocks HTTP/HTTPS resources and external navigation.

This is source only, not a signed .ipa. On a Mac, open OfflineGame.xcodeproj, choose your own signing team/bundle identifier, connect an iPad, and build/run. Run `npm run build` in the repository root first so dist/PLAY.html exists. Verify first installed launch in airplane mode, rotation, multiple touch pointers, storage denial/recovery, controller disconnect, local import/export, all modes and the noncombat finale on the intended device. No native compilation or physical test has been performed here.
