# Codex brief: smooth, seamless fighter animation

Paste this to Codex. It asks for animation that moves as smoothly as a polished commercial platform fighter, while keeping the game's own original look. Do not copy any other game's characters, poses or frames.

## Where the animation is today (measured 2026-11-11)

- **Attacks:** about 5 drawings per attack, spread over 23–76 simulation ticks. That is roughly 6 new drawings a second, so attacks read as a slideshow.
- **Holds:** some drawings stay on screen for up to 39 ticks (0.65 s), for example `samson_hammer_dsig` and `nehemiah_hammer_dsig`. Characters look frozen mid-move.
- **Idle:** one still drawing per fighter. Nobody breathes.
- **Dodge:** 4 drawings. **Hitstun:** 2 drawings.
- **Run:** 12 drawings at 2 ticks each (30 a second). This one is already smooth. Use it as the quality bar for everything else.

## The target

1. **Frame rate.** Show a new drawing every 2–3 simulation ticks (20–30 drawings a second) in every clip. Hold a drawing longer than 4 ticks only on purpose: the anticipation before a big signature, or the final settle.
2. **Idle.** 8–12 drawings, looping seamlessly: a breathing rise and fall, a small weapon sway, cloth and hair following through. The first and last drawings must join with no pop.
3. **Attacks** (all 172 ids in `production-pack/09_Data/attacks.json`). Per attack, at least:
   - **Anticipation:** 2–4 drawings winding up across the `startup` ticks.
   - **Smear or blur drawing:** 1–2 drawings on the swing itself, with the weapon stretched along its arc.
   - **Contact:** the strongest drawing, held across the exact `active` ticks.
   - **Follow-through and recovery:** 3–6 drawings easing back to idle across the `recovery` ticks. The last drawing must match the idle pose, so the next clip starts without a jump.
   - Clip `ticks` must still add up to exactly `totalTicks`, with contact lined up with the active window (see `docs/ART_INTEGRATION.md`).
4. **Movement transitions.** Jump take-off (2 drawings), rise, apex, fall, landing squash (2–3 drawings), turnaround (2–3 drawings), dash start and stop. Each must start from the pose the previous state ends on.
5. **Dodge.** 8 or more drawings, including a readable fade or ghost pose during the invulnerable ticks.
6. **Hitstun.** 6 or more drawings: the impact recoil, a tumble loop for long launches, and a recovery flip.
7. **Consistency.**
   - Same scale, pivot at the feet and ground line on every drawing.
   - No drawing may shift the feet unless the character is actually moving.
   - Weapons stay in the same hand, at the same size, from the same angle family across a clip.
   - Faces and costume colours stay identical from frame to frame, with no AI drift between drawings.
8. **Squash, stretch and overlap.** Use them on jumps, landings and heavy hits. Let cloth, hair and capes trail the body by 1–2 drawings.

## File size: this is just as important

The single-file game is about 80 MB. The production pack's target is 25 MB for the first match, and 80 MB loads slowly on an iPad. Doubling or tripling the drawings will make this worse unless you also:

- Trim every drawing to its visible pixels before packing, with no empty margins.
- Pack all of a fighter's drawings into tight atlases, at most 2048×2048 each.
- Draw at the size the game actually shows. A standing fighter is 96 px tall at zoom 1, so source art much past 2× that size is wasted.
- Quantize or compress the PNGs (for example with pngquant), keeping clean outlines.
- Re-run `npm run build` and report the new size of `dist/PLAY.html` with each delivery. Aim to stay under 40 MB on the way to 25 MB.

## How to deliver

- Work one fighter at a time, starting with David. Commit each fighter separately with `npm test` and `npm run art:check` passing.
- Update `assets/runtime/fighters/fighters.json` clips and frames only. Never change gameplay data in `production-pack/09_Data`, hitboxes or the simulation; the engine owns timing and collisions.
- Keep drafts and backups out of git. `.gitignore` already ignores `artifacts/`, `*-complete.png`, `*-down.png`, `*-elemental.png`, `*-fluid-run.png`, `*-run-cycle.png` and `fighters-before-*.json`.
- With each fighter, include a short side-by-side preview (a GIF or the `assets/animation-production` preview page) of idle, run, one light attack, one signature and hitstun.

## Done means

For every fighter: no drawing held over 4 ticks except deliberate anticipation, idle has 8 or more looping drawings, every attack has 10 or more drawings with a smear and a held contact pose, transitions don't pop, all tests pass, and the build is smaller than when you started.
