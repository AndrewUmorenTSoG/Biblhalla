# Downward attack artwork integration

Implemented 2026-11-02 from the generated down-attack drawing brief. The completed brief was removed after integration; `npm run art:down-attacks` can regenerate it if needed.

All 12 fighters have 12 dedicated contact drawings each (144 total): down-light, down-air, ground-pound and down-signature for both weapons and unarmed. Existing anticipation and recovery frames remain. This is a contact-art pass, not 144 newly drawn full animation sequences.

The contact drawing occupies exactly startup through startup + active - 1. Canonical damage, collision geometry and attack duration are unchanged. S remains the default Down binding; S + J selects down-light/down-air and S + K selects down-signature/ground-pound, depending on grounded state. User remaps remain respected.

Sources and exact generation prompts are preserved in assets/animation-production/down-attacks. Runtime atlases use the -down-packed.png suffix. Original atlases and manifest baselines remain available.

Reproduce: node tools/art/import-down-attacks.ts; node tools/art/pack-fighters.ts --tag down; node tools/art/sprite-only.ts; node tools/art/preview-attacks.ts --down-only; node tools/build.ts. Import/packing baselines are immutable: review any later fighter edits before rerunning.

Review assets/animation-production/down-attacks.html for playback and hitbox overlays. The contact-sheet extraction was visually inspected. All playable clip references now use sprite drawings, excluding legacy concept frames and known edge-clipped action frames. Every sprite uses bottom registration, removing the active-frame dip below the preview line. Grounded recoil no longer rotates the feet below the platform. The preview and runtime share the same clip references. A three-character sequence strip was inspected against a floor line; browser gameplay was not verified in this pass. Weapon crates are now blue flaming sword pickup markers, with reduced-motion support.

Validation: TypeScript check, strict artwork validation, offline build and six focused animation/input tests passed. After the sprite-only fix, all 219 current regression tests passed, including 18 art/input checks; results are recorded locally in artifacts/sprite-fix-tests.log.
