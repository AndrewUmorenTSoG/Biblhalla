# Art integration contract

Fighter sprites, characters and weapons are produced separately (Codex) and dropped into this repository. The engine never reads art for gameplay: hurtboxes, hitboxes and platforms come only from `production-pack/09_Data`. Art must fit that data, not the other way round.

Run `npm run art:check` after any art change. It fails on structural problems and reports animation coverage; `--strict` also fails on coverage gaps.

## Fighters

One atlas PNG per fighter plus an entry in `assets/runtime/fighters/fighters.json`:

```json
{
  "david": {
    "image": "assets/runtime/fighters/david.png",
    "sha256": "<sha256 of the PNG bytes>",
    "readiness": "runtime_alpha",
    "source": "where it came from", "tool": "how it was made", "approval": "pending",
    "frames": {
      "idle_0": { "x": 0, "y": 0, "w": 150, "h": 220, "pivotX": 75, "pivotY": 220 }
    },
    "clips": {
      "idle": { "frames": ["idle_0", "idle_1"], "ticks": [12, 12] },
      "david_sling_nsig": { "frames": ["sling_n_0", "sling_n_1", "sling_n_2"], "ticks": [18, 5, 24] }
    }
  }
}
```

Rules:

- **Transparent PNG**, RGBA. No parchment, panel borders, numbers or presentation backgrounds.
- **Facing right.** The renderer mirrors for left-facing fighters.
- **Pivot at the feet**, centred between them. `pivotY` is the ground line.
- **Scale.** The `idle` frame (or the first frame of the `idle` clip) is drawn 96 px tall at zoom 1, which spans the shared 40×74-unit capsule plus head room. Keep every fighter's idle at a similar on-screen height; art size never changes the hurtbox.
- **Readiness.** Use `runtime_alpha` for finished art. `concept_cut` marks the current stand-ins. Anything else is not embedded in the build.
- **Hash.** `sha256` must match the PNG bytes; the build refuses mismatches.

### Clips

Clip names are either a loop clip or an attack id from `attacks.json`.

| Clip | Plays when | Timing |
| --- | --- | --- |
| `idle` | standing | loops on world time |
| `run` | moving on the ground | loops |
| `jump` | airborne | loops |
| `dodge` | dodge or dash | loops |
| `hitstun` | being launched | loops |
| `<attack id>` | that attack, e.g. `sword_nlight`, `samson_hammer_ssig`, `unarmed_dsig` | advances with the attack's own tick |

Attack clip `ticks` must add up to exactly that attack's `totalTicks` (startup + active + recovery). Line the contact pose up with the active window: `startup` ticks before contact, `active` ticks of contact.

Coverage per fighter: 5 loop clips + 8 attacks for each weapon in their pair + 11 unarmed attacks + 6 signatures = 38 clips. Missing clips fall back to the stand-in poses, so art can land one fighter or one weapon at a time.

### Weapons

Weapons are drawn into the fighter frames. Thrown weapons and pickup crates are still procedural; they use the shared 18×18 throw box regardless of how the weapon looks.

## Arenas

`assets/runtime/arenas/arenas.json` holds one far-backdrop band per arena (`readiness: concept_backdrop` today). Platforms are always drawn from `maps.json` collision. Painted art must not show platforms in places where the collision data has none.
