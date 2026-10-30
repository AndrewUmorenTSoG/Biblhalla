# COVENANT CLASH — MASTER BUILD PROMPT

**Publisher:** Kendrew Games. **Title:** working title; availability has not been checked. **Deliverable:** a fully offline original 2D platform fighter and 84-level Bible-based story campaign for PC and iPad. This package is a design and prompt pack, not the completed 84-level game. A separate playable prototype ZIP provides a small working combat slice. All numbers are original prototype targets, not extracted Brawlhalla constants.

## Paste this prompt first

You are the lead game engineer, combat designer, animator, UI designer, technical artist and QA engineer for Kendrew Games. Build **Covenant Clash**, a fast, readable, fully offline 2D platform fighter with biblical historical characters in a fictional sporting exhibition, plus an 84-level story adventure from Genesis to Jesus’ death and resurrection. The owner wants the accessible movement, weapon switching, offstage recovery, directional attacks and satisfying ring-outs associated with Brawlhalla. Treat that game as a category and experience reference. Create original characters, maps, attack choreography, interface, animation, music and tuned implementation. Do not import its executable, sprites, proprietary frame data, stage geometry, logos or source code. Never claim the original engine has been reproduced exactly.

Build the product itself; do not deliver only an attractive menu, static character gallery or script that pretends matches work. Use the supplied specification to make explicit design choices. Implement incrementally, verify each slice, and continue until the requested modes and acceptance gates pass. If assets are missing, use clearly marked development silhouettes temporarily and maintain an integration backlog; never quietly ship them as final art.

### The experience

A new player launches the game, chooses **Touch**, **Keyboard**, or **Controller**, completes a 30-second control check, selects a fighter and plays. Touch is recommended on iPad when no controller is active; keyboard is recommended on PC. Recommendation is not a forced choice. Devices can switch later through one visible Controls button. Controller selection requires an actual detected controller and a test input; a connected mouse is not a controller. Core match actions are always visible or directly bound. Advanced configuration lives behind **More options**. Do not hide damage, remaining lives, readiness, match mode, checkpoint state or exit actions.

Explain the objective simply: **“Build damage. Knock opponents out. Stay on the arena.”** Damage is vulnerability to knockback, not a depleting health bar. When a fighter crosses a blast boundary, remove one stock, reset that fighter’s damage, and respawn if lives remain. Fighters are not killed. There is no gore, no theological power currency, and no reward for mocking Scripture.

### Launch roster

| Fighter | Weapon A | Weapon B | Power / Guard / Speed | Primary identity |
|---|---|---|---|---|
| David | Sling | Sword | 4 / 4 / 7 | Agile ranged precision |
| Saul | Spear | Sword | 6 / 6 / 3 | Tall lane control |
| Samson | Gauntlets | Hammer | 8 / 5 / 2 | Close heavy pressure |
| Joshua | Sword | Spear | 5 / 5 / 5 | Balanced fundamentals |
| Deborah | Staff | Paired blades | 3 / 5 / 7 | Fast spacing and reads |
| Gideon | Sword | Hammer | 5 / 6 / 4 | Measured punish game |
| Jonathan | Bow | Sword | 4 / 3 / 8 | Fast ranged movement |
| Moses | Staff | Sling | 4 / 7 / 4 | Deliberate resilient control |
| Esther | Paired blades | Staff | 3 / 4 / 8 | Agile close-range precision |
| Miriam | Staff | Sling | 3 / 6 / 6 | Rhythmic spacing |
| Nehemiah | Hammer | Sword | 6 / 7 / 2 | Grounded heavy defense |
| Caleb | Spear | Gauntlets | 7 / 5 / 3 | Strong measured pressure |

Every fighter has the two listed weapons, six character-specific grounded heavy signatures, weapon-family light/aerial/recovery attacks, and the complete unarmed kit. Weapon-family attacks share simulation rules; character animation styling may differ within those exact rules. No fighter receives extra damage because of perceived holiness, historical rank or gender.

### Combat non-negotiables

1. Run simulation at exactly **60 fixed ticks per second**. Rendering may run at display refresh rate and interpolate. Never multiply combat frame windows by render delta.
2. Implement grounded run, stop, pivot, dash, dash-jump, ground jump, two air jumps, variable jump cut, directional air dodge, stationary dodge, fast-fall, wall slide, wall jump, recovery attack, ground pound, chase movement after confirmed hits, and an air-dodge-to-grounded-attack cancel. These are defined as original rules in `02_Gameplay/04_Physics_Movement_Camera.md`.
3. Support neutral, side and down light attacks on the ground; neutral, side and down light attacks in the air; heavy recovery/ground-pound in air; neutral, side and down signatures on ground or during a valid cancel.
4. Provide clear startup, active and recovery frames; attack shapes are authored and mirrored deterministically. Animated brush trails are visual, never collision truth.
5. Implement damage accumulation, knockback scaling, hitstun, whiff vulnerability, invulnerability windows, trades, projectile limits and deterministic ownership. Never make every attack connect or let signatures cancel their recovery freely.
6. Spawn neutral weapon pickups that become the recipient’s alternating weapon pair. Implement dropping, throwing, unarmed fighting and denied pickup while stunned. No separate paid combat unlocks.
7. Never allow cosmetic skins, training assistance or rendering quality to change combat outcome. No unbounded wall recovery, endless dodge loops, infinite true combos or hurtbox changes from animation scale.

### Target stack and architecture

Use TypeScript for the production headless simulation, a local-bundled PixiJS-family renderer or tested Canvas/WebGL renderer, and semantic HTML/CSS menus. Validate and pin compatible package versions when implementation begins. All dependencies compile into the installed game; no CDN, runtime package resolution or network service. The separate prototype intentionally uses dependency-free JavaScript and Canvas, embeds its five PNG assets and runs as one PLAY.html file.

Separate simulation from DOM, canvas, sound, clocks and storage. Production canonical state uses bounded integers, explicit IDs, seeded deterministic randomness, stable iteration and serializable data. Rendering and camera smoothing consume state. The supplied production JSON is the target full mechanics contract; the prototype's simpler floating-point implementation is explicitly a separate vertical slice. Do not claim it implements all 147 production attack records.

Runtime is **fully offline after installation**, including first installed launch, story narration/context, every level, bots, saves, controls and all required art. No account, login, matchmaking, remote leaderboard, ads, analytics, cloud save, streaming audio, external fonts or downloadable chapter dependency. Documentation URLs are optional development references, not runtime links. Package the PC build with all bytes. For iPad, ship a signed app with bundled assets in a native web view or an equivalent native build. A PWA can be an optional browser distribution, but cache installation is not the sole offline guarantee. Files/Quick Look opening an HTML file is not a reliable iPad executable path; never claim a PC HTML ZIP is an installed iPad app.

Development may use a local tool server and build dependencies. These are development tools only; the delivered standalone PC prototype does not need them. Do not add an authoritative game service or a required network connection to any release artifact.

### Launch modes

- **Story:** 84 levels, fourteen six-level chapters, fully local progression and checkpoints.
- **Quick battle:** solo versus computer, with Easy / Hard / Extremely Hard.
- **Duel, Waves and Boss** encounters with visible mode-specific objectives.
- Training and a short tutorial.
- Same-device local 1v1 and 2–4-player free-for-all/2v2 with separately assigned controllers; implement and verify as a production feature.
- Optional offline challenge replay and local completion medals. No global ranking or cross-device session is part of the scope.

iPad touch controls one local player. Extra local players need separately assigned physical controllers. Do not replace simultaneous combat with pass-and-play. One PC keyboard plus controllers is the baseline; shared keyboard requires rollover testing. The supplied prototype supports one human versus bots, two fighters and three arenas; local multiplayer and the full campaign are design targets, not implemented prototype features.

### The 84-level story adventure

Use **Dru and Ken**, two original fictional friends, as the campaign's continuous protagonists in a living illustrated Story Archive. Its biblical accounts remain fixed; its playable exercises are clearly labeled inventions. Chapter order: Beginning; Promise; Divided Family; Exodus; Law/Land; Judges; First Kings; Divided Kingdom; Prophets; Exile/Return; Messiah’s Arrival; Kingdom Near; Mercy/Truth; Cross/Resurrection. Wisdom, prophecy and parables are labeled interludes. This covers the main narrative arc to resurrection, not every verse or all later books.

Use 16 multiple-opponent wave levels, 11 single-boss levels and 57 escort/traversal/puzzle/exploration/survival/witness levels. Every level has a unique task, reference, narrative transition, encounter specification, difficulty behavior, checkpoint, art prompt and acceptance criteria. Goliath is a special David reenactment ending with one decisive stone. Miracles happen in source-based narration, never because the player empties a health bar. Levels 79–84 put weapons away and present Last Supper, Gethsemane/arrest, denial, cross, burial and empty tomb with restraint, captions and optional context.

Start implementation with [11_Story_Campaign/00_CAMPAIGN_MASTER_PROMPT.md](11_Story_Campaign/00_CAMPAIGN_MASTER_PROMPT.md), then [the level index](11_Story_Campaign/06_LEVEL_INDEX_AND_CHAPTER_ORDER.md). The separate prototype does not implement these levels.

### Visual and biblical direction

Create premium hand-drawn 2D artwork with strong silhouettes, approximately 4.5-head character proportions, ink contours, warm cel shading, readable hands, cloth and bronze props, parchment framing and restrained jewel colors. Faces, costumes, poses and environments must be original. Use the supplied images as concept guides, not as finished animation atlases. Generate/redraw clean separated parts, animation frames, VFX, portraits and collision-reviewed arena layers before final integration.

These characters come from different historical periods. The framing is a **fictional exhibition inspired by biblical history**, not an asserted meeting in history, resurrection event or description of heaven. Scripture snippets and context panels are optional and accurate. Distinguish “Bible background” from “Invented game moves.” God, Jesus and the Holy Spirit are not playable combatants; miracles and sacred objects are not spam attacks. Victories do not mean God prefers the winner. Ephesians 6:12 concerns spiritual conflict, not a command for physical aggression. Keep the game’s competitive sport and the biblical teaching context clear.

### UI and accessibility

Main menu exposes Play, Learn, Fighters and Settings. Play offers **Story / Quick battle / Local**. Story opens Continue and chapter selection; Quick battle opens fighter, computer difficulty, encounter and arena. Advanced details live behind More options, Moves, Context or Journal. Keep Play, the current objective, Pause and remaining lives visible. Avoid a store/events dashboard.

Use semantic form controls, visible keyboard/controller focus and reliable dialog focus return. Minimum general targets 48 CSS pixels, adjustable combat buttons 64–100 pixels. Support left-handed touch, button scale/opacity, dead zone, remapping, reduced motion, captions, UI scaling, numeric damage and shape/number player labels. Color never carries essential information alone. Witness levels suppress the combat HUD and show Interact / Listen / Continue.

Every mode pauses the actual simulation on explicit pause, focus/visibility loss or required-controller disconnect. Clear held input, preserve a safe state, resume only by a visible button and show a brief countdown where useful. Handle touch cancellation, audio suspension, browser storage failure and rotation as ordinary lifecycle events. Do not resume automatically after a long background.

### Engineering quality and performance

Target 60 Hz fixed simulation and 60 FPS presentation on a physically measured baseline iPad and ordinary PC. At 30 FPS rendering, simulation remains fixed-rate. Reduce decorative effects before mechanics. Bound projectile, particle, actor and history counts; release texture memory between chapters. Decode required assets from the installed package and provide real loading progress/recovery.

Difficulty changes the computer’s delayed observation, decisions, spacing, recovery and accuracy while using the same legal inputs, damage, movement and resources. Easy / Hard / Extremely Hard use 27/14, 12/6 and 6/3 tick observation/decision targets. Boss scale/guard are explicit encounter rules, not hidden difficulty boosts. Do not promise human playtest win rates or all-iPad performance without evidence.

Offline acceptance includes installation followed by airplane-mode first launch, caches cleared of development leftovers, completed matches, story checkpoints, local export/import and continued play with storage denied. A file build must contain no external runtime resource URLs, fetch/WebSocket dependency or startup authentication. Build tools may need internet to acquire dependencies; playing the installed game must not.

### Build order and completion evidence

Read README_START_HERE.md, `03_Offline`, canonical `09_Data`, and the campaign master/index in `11_Story_Campaign`. Deliver:

1. Foundation: movement, fixed ticks, input selection, one arena, debug shapes and headless replay.
2. Playable combat slice: David/Samson, bots in all three difficulties, duel/waves/boss, damage/lives, real victory/loss, pause/rematch, embedded art and PC/touch smoke tests.
3. Campaign proof: levels 1–6, one mixed wave level, one boss, companion task, witness scene and local save recovery.
4. Full offline content: all 12 arena fighters, eight weapon families/unarmed, six arena maps, all 84 campaign levels and local multiplayer.
5. Art and accessibility: complete required animations, layered maps, source-aware cutscenes, captions, touch/remapping, performance and all menu paths.
6. Distribution: PC bundle and signed iPad package; fresh-installed airplane-mode device tests; explicit release notes and remaining limits.

At each phase state what is actually playable. Source prompts and attractive concept sheets are not implemented levels or animation clips. The supplied prototype is an early combat slice, not the full game. Record commands, actual results, failures and remaining work; fix failing gates before advertising completion.

### Required code and data outputs

Create simulation, combat, input, rendering, UI, audio, bot, campaign, save and asset-loading modules; validated fighter/move/weapon/map/level data; meaningful tests; reproducible builds; asset provenance/readiness; tuning notes; and plain PC/iPad play instructions. Use local profile/checkpoint/replay files with schema/content versions, backups and migration. Import treats files as data and never executes embedded code.

The full roster's detailed mechanics remain in `09_Data`. `campaign.json` defines 84 level records and the matching standalone prompts. Every required asset/text/audio is bundled. Keep implementation and build dependencies separate from the player’s launch. Provide an offline installation checklist and known limitations. Publication and paid distribution are separate actions.

If details conflict, prioritize explicit owner instructions → this fully offline master → canonical data → specialized prose → concept appearance. Update data and prose together. Do not derive collision dimensions from painted concept images.

### The final product test

A newcomer chooses Keyboard, Touch or a detected Controller, starts a computer encounter in three clear decisions, understands lives/damage, recovers from offstage, pauses/rematches and plays with the internet disconnected. A story player can continue locally across 84 levels, meet groups of enemies and single large bosses, retry a checkpoint and finish the resurrection finale without a combat skill gate. On a supported signed iPad installation, the same complete content works in airplane mode after a fresh launch.

## ELI5

Build a playground fighting sport. The more bumps a fighter takes, the farther the next bump sends them. Falling outside the playground costs one life. The same playground rules use a keyboard, controller or touch screen, and all game content stays on the device. The story is a journey through the Bible; the final chapter listens to the account of Jesus’ death and resurrection. The Bible supplies the people and story background; the arena moves are invented for the game.
