// Fixed-point helpers. All canonical positions/velocities are Q8 integers
// (256 per design unit). No trig and no unseeded randomness in the simulation.

export const Q = 256;

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Rounded n * p / d for permille-style or direction-table (1024) scaling. */
export const roundMul = (n: number, p: number, d = 1000) => Math.floor((n * p + Math.floor(d / 2)) / d);

export const approach = (a: number, b: number, step: number) => (a < b ? Math.min(b, a + step) : Math.max(b, a - step));

/** xorshift32 advanced in place on the state's `rng` field. */
export function nextRandom(s: { rng: number }): number {
  let x = s.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.rng = x >>> 0;
  return s.rng;
}

/** FNV-1a over a value's JSON (or a string). Used for state checksums. */
export function hash(value: unknown): string {
  let h = 2166136261;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  for (let n = 0; n < str.length; n++) {
    h ^= str.charCodeAt(n);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export const snapshot = <T>(value: T): T => JSON.parse(JSON.stringify(value));
