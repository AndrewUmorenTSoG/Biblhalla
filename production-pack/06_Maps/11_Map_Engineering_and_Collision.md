# Arena geometry, collision and camera prompt

Act as arena designer and collision engineer. Implement six original arenas using `09_Data/maps.json`. Generated artwork is visual direction; exact platform positions and blast zones come from data. Coordinates use X horizontal, Y up, platform top at its listed Y; main thickness extends downward. All launch geometry is symmetric even if background decoration is asymmetric.

## Coordinate and collider contract

Main entry `[x, topY, width, thickness]` becomes an axis-aligned solid from x to x+width, Y topY-thickness to topY. Upper platforms use the same dimensions but are one-way tops. Stable collider IDs allow deterministic ties. Main side walls are valid wall-slide surfaces. The underside blocks recovery rather than silently passing through. Decorative geometry has no collider and is painted at lower contrast. Spawn fighter feet at supplied points; validate free volume against its capsule.

Blast zone entry `[minX,maxX,minY,maxY]` is fixed world-space. Camera zoom never changes it. Test fighter center against it once after collision resolution. Do not use screen edges for KO. Camera limits may extend beyond blast region to show offstage warning arrows, but never pan so far the main arena is lost. No moving platforms, slippery terrain, wind, death traps or random destruction in competitive geometry at launch.

## Arena roster

Elah Training Terrace: main 1080 units, two upper side platforms at Y=150, baseline spacing arena.
Wilderness Waystation: main 1040, one center platform at Y=190, vertical neutral reads.
Jericho Outskirts: main 1120, two side platforms at Y=170 and center at Y=310, casual vertical arena; not in initial local competition pool.
Palm Court: main 1000, short center platform at Y=170, compact interactions.
Susa Garden Balcony: main 1160, two side platforms at Y=145, wide ranged arena; casual pending balance.
Builders’ Court: main 1080, two narrower side platforms at Y=170, familiar symmetric recovery.

Initial competitive eligibility is a proposal: Elah, Wilderness, Palm Court and Builders’ Court must still pass playtests. Local tournament selection may use a simple map draft; do not advertise a “balanced tournament pool” without measured matchup results. Every assigned player uses the same local simulation.

## Fairness review

For each map measure spawn-to-center travel time, distance from ledge to blast boundary, floor-to-upper-platform jump feasibility, recovery from left/right standardized launch points, projectile lane visibility, one-way drop consistency and camping loops. Because one ground jump rises about 200 units, side platforms at 145–190 are reachable; Jericho’s Y=310 platform requires another platform or air jump. Record actual outcomes after implementing the exact integrator.

No upper ledge should hide a fighter’s feet behind foreground art. No surface should look solid while letting the fighter fall through unless a clear one-way cue exists. Hazards, if later created for anthology content, use a separate map variant ID and cannot leak into local competition. Copying an existing reference map’s layout is not part of this design.

## Eight-player later variant

Create an explicitly new widened casual derivative, main width at least 1600 units and camera/upper-platform spacing reviewed for tablet readability. Eight participants need bigger silhouettes/markers rather than a permanently microscopic zoom. This derivative is future production work, not one of the six generated map concepts. Benchmark art and sim load before enabling it.

## Output and acceptance

Produce map loader, data validation, collision debug viewer, layer atlas manifest, preview thumbnail and per-map reachability report. Test swept dash into walls, under-stage recovery, platform drop-through, simultaneous landing, KO boundary edge equality, respawn safety and repeated state restore at a platform edge. Use deterministic overlays rather than generated images for precise geometry verification.
