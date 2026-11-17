/** Action ticks, including anticipation, release, landing and retrieval. */
export const GIDEON_REBOUND_TICKS = [3, 3, 3, 3, 4, 4, 4, 2, 6, 8, 4, 4, 4, 4, 6, 6];
export function gideonReboundFrame(tick: number, state = '', charging = false) {
  if (charging) return 2;
  if (state === 'catch') return 13;
  if (state === 'settle') return tick < 62 ? 14 : 15;
  if (state === 'return') return 12;
  // While a charged shield stays out, wait empty-handed in the landing pose.
  if (state === 'out' && tick >= 48) return 11;
  let left = Math.max(0, tick);
  for (let i = 0; i < GIDEON_REBOUND_TICKS.length; i++) {
    if (left < GIDEON_REBOUND_TICKS[i]) return i;
    left -= GIDEON_REBOUND_TICKS[i];
  }
  return 15;
}
