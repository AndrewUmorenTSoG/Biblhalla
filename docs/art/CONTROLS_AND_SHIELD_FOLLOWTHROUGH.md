# Controls and shield throw follow-through

The controls reference uses a compact black options panel, Keyboard / Controller / Touch tabs, grouped table rows and boxed bindings. Values come from the active profile. Default W jumps and aims up; S crouches and selects down attacks. The retired Up=W / Down=Space / Jump=ArrowUp layout migrates to W/S, retaining unrelated bindings when valid. Other custom layouts remain supported.

Shield throws now progress through three wind-up drawings, hold the fully extended release drawing for 24 simulation ticks (0.4 seconds), then follow through. Actual projectile return overrides the hold, with dedicated reaching, catching and settling drawings. No new art replaces the existing hand-drawn release sprites. Ground slams no longer select the catch/settle override just because their startup ended.

Verification: TypeScript, offline build, full tests and attack preview smoke check. Canvas stubs validate execution and frame selection; physical gameplay appearance still requires a browser playthrough.
