# Drawn slinger pass — 2 November 2026

David, Moses and Miriam each have sixteen new full-body drawings with the sling physically included: four idle weight shifts, four running poses, four airborne/landing phases, and four wind-up/acceleration/release/follow-through poses. The release drawing contains an empty pouch; the separately simulated stone leaves at the authored release tick. Ordinary sling idle/run/jump poses no longer use an unarmed body with a separate weapon layer.

Source images and exact built-in imagegen prompts are preserved under `assets/animation-production/slingers`. All three source sheets were visually inspected. `slingers.html` plays the four movement/cast groups for each fighter. Runtime atlases use the `-drawn-sling.png` suffix. `tools/art/import-slingers.ts` preserves its initial manifest baseline and retains the full alpha contents of each source cell, including thin sling cords.

Generic weapon throws now rotate the equipped artwork as one rigid object at its equipped size. They do not substitute a differently shaped perspective sprite. The actual weapon family is kept on the projectile and on the recoverable ground item. Only neutral pickups use the blue flaming sword marker. In a browser, an unloaded flight asset is not replaced with a procedural weapon drawing; embedded assets preload on the title screen.

Generate the previews with `tools/art/preview-slingers.ts` and both modes of `tools/art/preview-attacks.ts`, then rebuild with `tools/build.ts`. Original art and prior weapon perspective sheets remain preserved.

Tests check the actual equipped texture/frame identity during rotation, all sixteen slinger poses, body-frame selection, empty-hand ownership after throws, attack timing, standing-line registration and the shared renderer. Contact sheets were inspected and automated preview playback exercised; interactive gameplay has not been manually verified in this pass.
