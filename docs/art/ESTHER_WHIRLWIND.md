# Esther's dagger whirlwind

The former forward dagger light was named Hurricane Spin but played two slash poses, dealt one hit and drew five stacked elliptical rings. It now plays a full-body turn through front, profile and back drawings, with wispy air crossing in front of and behind the fighter. Forward Heavy uses the same turn sequence as a stronger Tempest Dance. Esther's other dagger wind effects also use open tapered streamlines instead of the old ring shape.

## Animation and effects

Twenty-four new drawings: four anticipation, sixteen turning/slashing angles, four braking/recovery. Both daggers stay in her hands. The new 1024 × 352 action texture is separate from the existing Esther atlas, so her other drawings, movement and attacks are preserved. Finished spins settle into her equipped dagger idle; no concept cutout or screen-plane rotation is used to simulate turning.

The runtime draws translucent white/cool-blue streamlines and sparse airborne flecks. Trails have varying curvature, width and opacity, and weave behind and ahead of the body without forming an opaque cone. Wind follows the action and disappears if the fighter is interrupted. Reduced motion uses static trail geometry without orbiting particles. These are code-native effects; body poses were generated with the built-in imagegen tool and imported as transparent sprites.

Source sheet, exact generation prompt, alpha-cleanup prompt, contact sheet and standalone simulation preview stay local in `assets/animation-production/esther-whirlwind/`, following LOCAL_ART_WORKFLOW.md. The runtime texture and integration code are committed.

## Four controlled contacts

- Side + Light: 8 startup / 32 active / 18 recovery ticks.
- Side + Heavy: 20 startup / 32 active / 28 recovery ticks, retaining Heavy charge scaling.
- Four independent damage groups start eight action ticks apart. Each group can strike a given target once; it cannot damage every simulation tick.
- Damage distribution is 20% / 20% / 20% / 40% of the existing move damage. Total base damage is retained.
- The first three hits have zero launch force, keeping the target within the finite spin. The fourth restores full launch force and sends the target away from Esther on the side they occupy.
- The spin gives no invulnerability. An interruption cancels the remaining contacts; whiffs do not damage distant targets.

## Validation

366 tests passed. Tests cover four contacts on both sides and with either facing at low/high accumulated damage, a stronger finishing contact, interruption, distance limits, all 24 registered drawings, every active angle, finite wind geometry and reduced motion. TypeScript, the formatter, strict art validation and the offline build passed. Sixteen preview runs exercised both moves, facing directions, charge settings and reduced motion. Rendered the actual simulation to inspect the turning body, held daggers, layered wind and damage counter. Hardware FPS and browser gameplay were not measured by these checks.

Built `dist/PLAY.html`: 53,199,605 bytes. All eleven other fighter manifest entries and all pre-existing Esther frame records are preserved.

Rebuild local artwork and preview with `node tools/art/import-esther-whirlwind.ts` and `node tools/art/preview-esther-whirlwind.ts`. Run `node tools/art/smoke-esther-whirlwind.ts` after generating the preview. Production uses the normal `npm run build` command.
