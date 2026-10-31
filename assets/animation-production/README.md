# Biblhalla animation production

## Current integration

All twelve fighters have the 38 required playback slots: movement/defence plus 33 attacks. This is structural coverage, not 456 independently drawn animations. The runtime art remains animation alpha. Armed moves share some anticipation/recovery drawings; unarmed directional moves share punch or kick sequences. Some signature strike poses still come from the original concept art.

The latest pass adds 192 generated unarmed/defence drawings across the roster, extracted as connected figures so extended limbs are not clipped by a fixed grid. The exact built-in image-generation prompts are saved as *-unarmed-defence.prompt.txt beside the source PNGs. Original images and manifests are preserved.

Running cadence follows actual movement speed. Airborne poses follow vertical velocity, landing has a short compression pose, dodges and hit reactions play once instead of looping, and paused/hitstop presentation stays still. Fighter positions interpolate between simulation ticks without changing physics. Camera easing is independent of display refresh rate.

The arena renderer now matches the simulation's bottom-origin rectangles. A simulation-based test verifies that grounded feet meet each painted floor. Contact shadows help establish weight.

## Review

- playback.html: run, jump, idle, dodge and hit reaction previews for all twelve fighters.
- attacks.html: all attack clips and the eight weapon designs.
- defence-contact.png: extracted new poses, sorted alphabetically by character.
- review.html: original first-pass draft sheets and the full prompt specifications.

## Tools

- tools/art/import-movement.ts: movement extraction and packing.
- tools/art/import-attacks.ts: armed clips and exact canonical attack timing.
- tools/art/import-defence.ts: unarmed, dodge and hit-reaction clips.
- tools/art/pack-fighters.ts: compact 1024-wide runtime atlases with a 192-pixel standing body.
- tools/art/preview-movement.ts and preview-attacks.ts: standalone review pages.
- tools/art/validate-art.ts --strict: structure and required playback-slot validation.

Use the staged manifest backups when reproducing an import; the scripts preserve their baseline so reruns do not repeatedly append frames. Rebuild the game with node tools/build.ts after importing or packing.

## Verification

Typecheck, strict art validation (38/38 slots for each fighter), offline build, and all 100 project tests passed on 2026-10-31. Extracted poses were visually inspected as a contact sheet. This does not replace playtesting or a frame-by-frame professional animation review.
