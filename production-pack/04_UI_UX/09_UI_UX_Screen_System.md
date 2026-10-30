# Offline UI/UX implementation prompt

Build semantic responsive menus over the canvas/game renderer. One primary action per screen, visible Back, preserved selections, predictable focus and ordinary labeled controls. Progressive disclosure hides optional detail behind More options / Context / Moves, while Play, Pause, objectives, damage and lives remain visible.

Palette: parchment #F5ECDD, ink #252231, plum #3D2D56, brass #C49A4B, teal #147D83. Measure contrast; do not use pale brass for paragraph text. Two locally bundled font families at most. Base text 18 px with 1.4–1.6 line-height, 150% scaling, 3-pixel contrasting focus ring. General targets at least 48×48, CTA 56 high, adjustable combat targets 64–100, spacing 4/8/12/16/24/32/48.

| Screen | Essentials | Optional button |
|---|---|---|
| Input | Keyboard / Touch / detected Controller, check, Continue | Customize |
| Home | Play, Learn, Fighters, Settings | About |
| Play | Story, Quick battle, Local | More modes |
| Story | Continue, chapter cards, current checkpoint | Journal / Replay options |
| Quick battle | Fighter, Easy/Hard/Extremely Hard, Duel/Waves/Boss, arena, Play | Match options |
| Local setup | Assigned inputs/slots, teams, Ready, Start | Slot options |
| Fighter | Roster grid, name, role, two weapons, Ready | Moves / Bible context |
| Match | Numeric damage, lives, mode objective, timer where used, Pause | Controls |
| Witness | Interact / Listen / Continue, captions | Context / Journal |
| Results | Real win/loss/draw/objective, stats, Retry/Rematch, Menu | Details |
| Settings | Controls, Audio, Display, Accessibility, local saves | Advanced |

Input selection is explicit; touch may be recommended on iPad and keyboard on PC, but not forced. Controller choice is unavailable until detected and tested. One control profile per physical input. Focus returns after modal close; Escape closes the top dialog first. Game input stops while menus are active. No sign-up, email, room code or waiting queue screen.

Touch has movable/left-handed joystick and large actions, safe-area padding, opacity/size controls and pointer-cancel handling. Avoid controls covering the central landing zone. Caption all needed audio clues; numeric/shape labels supplement colors. Quiet story levels remove combat controls and moral scores. Controller B/east is Back in menus and a mapped legal action in combat; keep that contextual distinction visible.

Every offline match truly pauses on Pause/background/controller disconnect. Resume is deliberate. Leave asks only when losing current unsaved encounter/checkpoint work. Ordinary navigation has no needless confirmation. Settings save locally and display failure honestly. Rematch/Continue is never blocked by reward animation.

Use dynamic viewport/safe areas and capped content width. Test PC 1366×768/1920×1080, iPad landscape/portrait/split view, keyboard zoom and controller focus. Preserve world geometry through resize; never stretch sprites. Screen-reader menus/results are required; do not claim nonvisual real-time fighting access without specific testing.
