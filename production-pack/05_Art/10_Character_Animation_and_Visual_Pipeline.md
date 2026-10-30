# Art direction and character animation pipeline prompt

Act as animation director and technical artist. Read each character’s move sheet, panel key and signature table. Generated images in `10_Generated_Artwork` are concept/reference sheets and arena paintings. They are not nine-frame animation atlases, clean cutouts or collision-authoritative diagrams. Plan the production work needed to convert them into consistent playable assets.

## Cohesive direction

Hand-drawn 2D, approximately 4.5-head heroic proportions, expressive faces, clear silhouettes, clean dark outlines and warm cel shading. Brass, cloth and wood should look materially different using a small number of shading bands. Use biblical-era-inspired clothing without claiming reconstructions are archaeologically exact. Cast uses varied brown complexions and individual faces. Female characters are athletic and dignified; elderly characters are capable without mockery. No copied reference-game character features, emotes, typography or map landmarks.

## Character production deliverables

For each fighter: model/turnaround sheet, color key, neutral weapon A/B idle, portrait, selection icon, clean separated parts or frame-by-frame source, and exported animations. Choose either frame-by-frame sprite atlases or a properly licensed skeletal pipeline and document the choice. Do not mix art-dependent simulation into either. Costume elements must be attached consistently and remain readable in left/right views. Mirror-safe accessories need review if asymmetry matters.

Required locomotion: idle, walk/run, start/stop, pivot, dash, ground jump, air jump, jump apex, fall, fast fall, wall slide, wall jump, landing. Required defense: spot dodge, directional air dodge, hurt light/heavy, hitstun, safe ring-out, respawn. Required items: neutral pickup, weapon pickup, throw anticipation/release/recovery, drop. Required combat: the eight shared attacks for both assigned weapons, three unarmed grounded heavies and eight unarmed basics, plus six fighter signatures. Shared animations may be retargeted only when hands and weapon arcs remain correct.

## Timing contract

Animation clips correspond to startup, active and recovery ticks in attack data. Retiming may interpolate drawing presentation but never changes authoritative active windows. Contact pose should visually reach the authored collision region. Anticipation shows attack direction; side signatures shift body weight visibly, anti-airs open upward silhouettes, down moves lower the fighter. Strong attacks have a clear vulnerable ending pose. Do not reuse the same pose with different colored sparkles for six signatures.

For a 21/5/29 move, source animation has a documented 55-tick timeline. At 60 Hz the active window begins at local tick 21. A sprite sheet may use fewer unique drawings held across multiple ticks; export an explicit frame-duration list. Store foot pivot at a stable feet-center origin, weapon socket coordinates and bounding boxes per frame. Do not derive pivot from transparent margins every frame.

## Export and atlas budgets

Starter frame target 256×256 or a trimmed equivalent with metadata; large weapon sweeps may need a wider transparent cell. Atlas pages ≤2048×2048 for baseline, with padding/extrusion to prevent bleeding. Use nearest versus linear filtering deliberately; this non-pixel art normally uses linear filtering with edge-safe atlases. Texture source may be high resolution, but device-specific runtime variants can be lower. Atlas metadata includes logical bounds, trim offset, pivot, page, frame rect and duration. No parchment backgrounds baked into combat sprites.

Create named production layers: body, clothing, hair, primary prop, secondary prop, foreground VFX. Optional shadows sit on stage separately. Team/player markers sit above animation, not painted on costumes. Damage tint or outline is a renderer effect and cannot change hurtbox. Keep alpha clean; no opaque white fringing against dark arenas.

## Environment pipeline

Generated map paintings guide color and silhouettes. Redraw into sky, far scenery, mid scenery, playable platform surfaces, recoverable walls and optional front decoration. Every platform top comes from JSON coordinates. Background parallax is cosmetic; gameplay surfaces stay fixed to collision coordinates. Never slice a painting into guessed collision rectangles. Decorative ropes/plants must not suggest nonexistent climbable surfaces. Provide a grayscale collision/debug render and a final small-size screenshot.

## VFX

Ordinary stone/wood/sword trails, dust, small neutral impact bursts and friendly KO arcs. VFX may communicate direction and force but not divine intervention. No destructive miracle spell, biblical text as projectile or holy aura measuring righteousness. Light attacks get short thin trails; signatures get wider but brief trails. Limit opacity and duration to preserve opponent silhouette. Reduced motion disables flashes/shake independently of simulation events.

## Acceptance and asset honesty

Preview every character in a 120–160 CSS-pixel match-height view, light/dark maps, mirrored stance and a four-player scene. Compare each signature contact pose to the debug shape. Check eyes, hands, weapon grip, missing fingers, cloth continuity and panel-number correspondence. AI art may approximate a pose; exact animation trajectory follows written choreography/data. Mark status as concept, animation-ready or runtime-ready; do not label concepts as production sprites. Record all remaining redraw/rig/animation work in the asset catalog.
