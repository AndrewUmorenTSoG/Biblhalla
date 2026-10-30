# Input selection, mapping and touch prompt

Act as input engineer and tablet usability designer. Implement the same semantic game actions for touch, keyboard and controller. Read the physics and combat resolver first. No input adapter may directly change movement or attack data.

## First-launch screen

Title: **“How will you play?”** Three large labeled cards: **Touch**, **Keyboard**, **Controller**. Show a short description and a recommendation based on available touch input, fine pointer and actual gamepad input. Keep all reasonable choices selectable. An unconnected controller card offers **Connect and press a button**. Continue opens a short live test: move left/right, jump, light attack, dodge. Confirm with **Looks good — continue**. A first-time user may skip testing but still has a Controls button.

Persist a selected profile per device/browser, not one account-wide setting that forces an iPad to use a PC keyboard. Auto-detection may update on-screen glyphs only after a genuine input event from a different source. Do not repeatedly switch profiles because a thumb rests on a screen. Player device assignment is explicit in local lobbies.

## Default mapping

| Action | Keyboard | Standard controller | Touch |
|---|---|---|---|
| Move / aim | A/D, W/S aim; arrow alternative | Left stick / D-pad | Left virtual stick |
| Jump | Space | South face button | Large Jump |
| Light | J; optional left mouse | West face button | Light |
| Heavy | K; optional right mouse | North face button | Heavy |
| Dodge / dash | Shift | East face button or R2 | Dodge |
| Pickup / throw | L | Right bumper | Pickup/Throw contextual label |
| Drop weapon | Hold Down + L | Down + right bumper | Down aim + Pickup/Throw |
| Pause/menu | Escape | Menu/Start | Visible pause button |

Mouse aiming is not used: the directional grammar uses movement input and facing. Pointer coordinates never grant extra attack angles. Up does not jump by default. Up-to-jump is optional. Remapping includes conflict warnings and restore defaults. Suppress browser scrolling/context menus only on the active gameplay surface, never the entire website.

## Canonical input frame

One frame has `tick`, `playerId`, signed quantized `moveX`, `aimY`, and bitsets `held`, `pressed`, `released`. Opposite horizontal keys resolve to neutral; no last-key favoritism. Up/down conflict resolves neutral. Dead zone defaults to 0.22 for analog stick selection; movement is quantized to -1/0/1 for competitive parity. Air/ground side attacks use current facing from horizontal input; with no horizontal input, face remains last valid direction.

Ground/air attack selection: down wins over side; side wins over neutral. Up selects neutral attacks, not a fourth move family. Presses are rising-edge events, so held light does not auto-combo or repeatedly fire. Holding heavy may extend anticipation through the charge rule. Simultaneous priority is described in the combat file and tested. Pickup/throw, jump, light, heavy and dodge each pass through the same legality resolver on every device.

## Touch implementation

Use Pointer Events with explicit pointer capture. Track the joystick pointer separately from button pointers, and support movement+jump+attack/dodge simultaneously. Default layout: joystick bottom-left; four large action buttons in a curved lower-right cluster; small contextual pickup/throw near the cluster; pause in upper safe area. Neutral is a centered joystick. Do not make directional attacks require dragging off a button. Support optional fixed directional D-pad for better neutral control.

Combat buttons default to 76 CSS px, adjustable 64–100, with at least 12 px separation and safe-area padding. Touch labels show Light, Heavy, Jump and Dodge, plus small glyphs. Allow rearranging controls in a paused editor with sample background, restore, preview and save. Keep button clusters outside the center fighting region. A left-handed preset mirrors touch zones, never the actual game state. Provide control opacity and joystick sensitivity; no customization affects hitboxes or simulation.

On `pointercancel`, `lostpointercapture`, blur or visibility loss, clear held state and record release events. A finger sliding away from a captured button must not leave it stuck. Prevent double taps from browser zoom on the combat surface with appropriate `touch-action`, retaining browser zoom for menus. Test iPad split view, toolbar resize, rotation and safe-area behavior. Landscape is recommended; portrait shows **Rotate for more room** with Continue if still usable. Do not rely on unsupported forced orientation or fullscreen APIs.

## Local device assignment

Keyboard owns P1 by default on PC. Each gamepad joins by pressing its face button and is assigned one slot; the same physical device cannot control two fighters. iPad touch controls one slot, with controllers for additional local players. Gamepad API indices may change on reconnect; require re-confirmation if identity is ambiguous. A disconnect pauses local games and offers reassignment. All games pause, clear held inputs and resume only after explicit action.

## Acceptance

Every action is performed successfully in the control check on physical iPad touch, desktop keyboard and at least two standard controllers. Test three simultaneous touch pointers, diagonal+heavy, down+throw, neutral dodge then attack, long holds, rapid tapping, remapping, background/resume, controller reconnect, browser focus and resize. Capture input frames to prove the same semantic sequence resolves the same attacks on all devices. Display the selected input method in Settings through a single visible Controls button.
