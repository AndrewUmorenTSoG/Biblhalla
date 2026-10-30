# Covenant Clash — playable offline prototype

**Extract this ZIP, then open PLAY.html in a modern desktop browser.** The game file contains its scripts, styles and all five art images. You can disconnect internet before launching. No install command, account, server or download is needed to play on PC.

Choose Keyboard, Touch or Controller; choose David or Samson; choose **Easy, Hard or Extremely Hard**; choose **Duel, Waves or Boss** and one of three arenas. Click **Play offline**.

| Encounter | Goal |
|---|---|
| Duel | Beat one computer opponent; both start with three lives |
| Waves | Clear seven computer opponents over three waves; protect your three lives |
| Boss | Defeat one larger training champion by breaking its 170-point guard or ringing it out |

Build damage so hits launch farther. Falling beyond the arena costs a life. Damage resets on respawn. The computer uses the same legal movement/attack resources; harder settings improve its reactions and tactics. Boss size/guard are explicit encounter rules, identical across difficulties.

| Keyboard | Action |
|---|---|
| A / D or Left / Right | Move |
| W / S or Up / Down | Aim direction; down while falling fast-falls |
| Space | Jump; twice more in the air |
| J | Light attack |
| K | Heavy; in the air recovery, or down + K ground pound |
| Shift | Dash while moving on the floor; otherwise dodge |
| L | Throw weapon; unarmed near the center crate picks up the alternate weapon |
| Down + Space | Drop through an upper platform |
| Escape / P | Pause |

Touch uses a movement stick and large Light/Heavy/Jump/Dodge buttons. Hold a direction while pressing an attack to choose its direction. Settings offers left-handed layout, larger buttons, reduced decorative motion and mute. Controller uses standard Gamepad mapping: south Jump, west Light, north Heavy, east Dodge, R1 Throw, Menu Pause. Connect and press a button so the browser detects it. Prototype menus use mouse/keyboard/touch; full controller-only menu navigation/remapping is a production task.

Pause and browser background/focus loss stop the whole match. Resume / Restart / Return to menu work. Results offer Play again or Menu. Settings are saved locally if this browser permits file-origin storage; if saving fails, gameplay continues. No campaign checkpoint or replay system is implemented here.

## Scope

This is an actual early combat slice: two fighters, three arenas, three encounter types and three computer difficulties. It uses original simplified physics and attack rules, six independent pose frames per fighter and procedural sound effects. It is not a Brawlhalla engine clone, a finished production animation system or the full 147-move implementation.

The separate production pack contains twelve fighters and **84 detailed story-level prompts**. Those levels, Dru/Ken companions, source-aware cutscenes, local multiplayer and full roster are not implemented in this prototype. Biblical arena moves and meetings are fictional sporting presentation; Jesus is not a fighter or boss.

## iPad

Touch UI is included and tested in desktop browser emulation. A PC HTML ZIP is not a signed iPad app, and Files/Quick Look may not execute it. The included [iPadApp/README.md](iPadApp/README.md) explains the bundled WKWebView Xcode project. Building/signing requires a Mac, Xcode and your own signing team. The wrapper is source only and has not been compiled or physically tested here. After installation, its game bytes are local and its resource/navigation rules block internet loading.

## Source and verification

`src/` contains simulation, input, renderer, audio and menus. `assets/` has original transparent David/Samson pose atlases, atlas metadata and three map concepts. `build.py` rebuilds PLAY.html with Python's standard library; no packages/network. Rebuild with `python3 build.py`. Simulation tests run with `node --test tests/simulation.test.cjs`. [VERIFICATION.md](VERIFICATION.md) states completed tests and untested platforms.

If artwork fails to load, extract again and open the rebuilt PLAY.html. If input stops, use the visible Resume button; backgrounding intentionally pauses. If you see only an HTML preview on iPad, follow the native build path rather than treating the preview as an installed app.
