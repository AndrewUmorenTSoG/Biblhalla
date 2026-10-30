# iPad developer build

This is a bundled WKWebView source project, **not a signed .ipa**. It has not been compiled or run on a physical iPad in this environment. PC PLAY.html is ready to launch separately. Files/Quick Look is not a reliable JavaScript game runner on iPad.

On a Mac with Xcode and an iPad:

1. Open `OfflineGame.xcodeproj`.
2. Choose the OfflineGame target. In Signing & Capabilities select your own team and an available bundle identifier. A Personal Team may have limited-duration device signing; follow Xcode's current requirements.
3. Select your connected iPad and Run. Xcode builds/signs the app with the adjacent `../PLAY.html` copied into its local resources.
4. After installation disconnect internet, force-close/reopen the app, choose Touch, and play every encounter/difficulty.

All five art files and scripts are embedded in PLAY.html; the app loads that bundled file, blocks HTTP/HTTPS resource loading and external navigation, and pauses on resigning active. No runtime download or local PC server is needed after installation. The wrapper supports iPadOS 16+ as a declared build target; actual compatibility/performance remains unverified.

Verify touch multitasking, controller pairing, background pause, safe area, rotation, local setting persistence, app signing expiry and cold airplane-mode launch on your intended hardware. Controller mapping is standard Gamepad API mapping; menu navigation uses touch/keyboard in this prototype.

Apple references: [local file loading](https://developer.apple.com/documentation/webkit/wkwebview/loadfileurl(_:allowingreadaccessto:)), [navigation delegate](https://developer.apple.com/documentation/webkit/wknavigationdelegate). These are developer documentation links; the game never opens them.
