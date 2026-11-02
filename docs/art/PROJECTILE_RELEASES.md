# Projectile release pass — 2 November 2026

Reviewed both supplied recordings: the preview displayed a small shield projectile alongside an equipped shield, and stones crossed the slinger's torso. Runtime and gallery now share explicit release origins from the character artwork.

Gideon and Nehemiah have eight new empty-handed body poses each. One shield drawing is attached during wind-up, absent from the hand during flight, and attached again during the catch. The same weapon drawing and scale render its flight. The throw remains extended for 24 ticks after release; charged delays are 29–48 ticks. Shields travel at 24 units per tick, stop at the existing 160-unit range, then return. Hit interruption triggers an immediate fast return. New shield attacks are blocked while that shield is away.

Sling stones travel at 32 units per tick and start at the extended sling release position. Bow attacks use drawn draw/release/follow-through/recovery frames and release from the bow tip. Fast projectiles retain swept collision checks. Release origins are canonical fighter data, also embedded in gallery art metadata. Wind trails remain subtle.

New images and exact built-in imagegen prompts are preserved in `assets/animation-production/releases`. Import with `node tools/art/import-releases.ts` after the elemental import. Original artwork is preserved; runtime shield atlases use the `-release.png` suffix.

The two recording contact sheets were reviewed, and the new shield body sheet was visually inspected. Automated checks cover release coordinates, speed, delay limits, interruption returns, swept hits, frame registration and the gallery. Interactive gameplay still needs hands-on review.
