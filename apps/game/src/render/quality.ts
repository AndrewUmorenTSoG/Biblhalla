// Presentation quality (17_Performance): when frames run slow, cut decoration first
// (particles, parallax), never the simulation, hit boxes or animation length. Recovers
// only after a long stretch of good frames, so it does not flicker between modes.

export const FRAME_BUDGET_MS = 1000 / 60;
/** Average frame time (ms) over the window that switches to low quality. */
export const SLOW_MS = 24;
/** Average frame time that is comfortably fast enough to go back to high. */
export const FAST_MS = 18;
const WINDOW = 90;

export class QualityGovernor {
  low = false;
  private samples: number[] = [];
  private goodWindows = 0;

  /** Feed each displayed frame's duration; returns true when the mode changed. */
  frame(ms: number): boolean {
    if (!Number.isFinite(ms) || ms <= 0 || ms > 250) return false; // tab switches and stalls say nothing about load
    this.samples.push(ms);
    if (this.samples.length < WINDOW) return false;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    if (!this.low && avg > SLOW_MS) { this.low = true; this.goodWindows = 0; return true; }
    if (this.low) {
      this.goodWindows = avg < FAST_MS ? this.goodWindows + 1 : 0;
      if (this.goodWindows >= 4) { this.low = false; this.goodWindows = 0; return true; }
    }
    return false;
  }
}

/** Particle cap for the current mode. */
export function particleCap(low: boolean): number { return low ? 30 : 90; }
