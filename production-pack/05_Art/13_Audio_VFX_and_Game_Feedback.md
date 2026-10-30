# Audio, VFX and satisfying feedback prompt

Act as audio director and feedback engineer. Create original game music and sounds matched to combat event IDs. Do not use Brawlhalla music, announcer recordings or recognizable UI sounds. Audio polish supports timing and readability; it never changes physics or hides important information.

## Sound hierarchy

UI: short soft clicks, one confirmation tone and one error tone. Locomotion: cloth/floor foot taps at reduced level, distinct jump/landing, quiet wall contact. Weapon: wood versus bronze whoosh, sling rotation/release, bow string, heavy mallet sweep. Impact: light tap and stronger signature hit; safe ring-out burst instead of death cry. Match: original 3/2/1 cues, Start, final stock indicator and respectful result sting. Critical cues must be audible above music without being harsh.

Use sample variation only cosmetically; choose variation by event hash, not simulation RNG. Pool audio nodes and cap simultaneous voices. Prioritize local/nearby impacts over far footsteps. At four players, keep dense strikes intelligible rather than four max-volume layers. Music ducks slightly for result announcements. UI preview respects master volume and a user’s initial audio gesture.

## Music

Original energetic hand percussion, strings and light melodic motifs with modern game rhythm; no claim to reproduce historical biblical music. Six arena arrangements may share a motif but differ in instrumentation/color. Loop seams are clean. Neutral competitive musical tone, no sudden worship-song playback or licensed melody unless separately requested and rights cleared. Music toggles independently of effects and narration.

## Event reconciliation

Use stable event IDs from simulation. Deduplicate events on state restore. Speculative light impact may play quietly once; do not replay it loudly after correction. A speculative KO never triggers a permanent victory fanfare. Final result music waits for simulation finalization. Suspended audio contexts resume after a tap; browser resume does not double-trigger old buffered impacts. Backgrounding stops cosmetic loops immediately.

## VFX budgets

Light hit: 3–5 tick restrained contact burst; signature: 5–8 tick larger burst with clear outline. Weapon trail active only near the actual attack; no lingering wall of particles. Ground dust is noncolliding. Ring-out effect follows the side boundary, not a fake explosive death. Stock-loss animation is distinct from match winner. Screen shake default maximum 6 CSS px for heavy impact and 2 for light, duration <150 ms; can be disabled. These are render targets, not simulation constants.

## Accessibility

Subtitles for spoken instructions, text timer/countdown and visual stock-loss cues. Do not use sound as the only indication of dodge readiness, controller disconnect, storage failure or match start. Avoid rapid high-contrast flashing; reduced-motion reduces bursts, shake, zoom and decorative loops. Provide a volume preview and remember values. Screen narration is optional rather than continuous commentary.

## Deliverables and acceptance

Audio manifest with file, event, bus, peak level, loop points and provenance; VFX atlas/animation metadata; event reconciliation tests; dense four-player mix review. Test muted music, muted effects, suspended Safari audio, Bluetooth device changes, state restore hits and repeated rematches. Report missing original sound work honestly; placeholder beeps are development assets.
