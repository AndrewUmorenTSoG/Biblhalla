// Fixed-step accumulator: converts variable display frames into exact 60 Hz
// simulation ticks. Display rate never changes simulation results.

export const TICK_MS = 1000 / 60;
export const MAX_CATCH_UP_TICKS = 5;
/** Longest frame gap honoured; anything longer (tab switch, debugger) is dropped. */
export const MAX_FRAME_MS = 120;
/** Consecutive overloaded frames before the game pauses with a performance message. */
export const SUSTAINED_OVERLOAD_FRAMES = 30;

export interface AdvanceResult {
  ticks: number;
  /** True when the backlog exceeded the catch-up budget and was discarded. */
  overloaded: boolean;
  /** True once overload has lasted SUSTAINED_OVERLOAD_FRAMES frames in a row. */
  sustained: boolean;
}

export class FixedStepRunner {
  accumulator = 0;
  overloadStreak = 0;

  reset(): void {
    this.accumulator = 0;
    this.overloadStreak = 0;
  }

  /**
   * Run up to MAX_CATCH_UP_TICKS ticks for `elapsedMs` of display time. `tick`
   * returns false to stop early (pause, result, story card); remaining time is
   * then discarded so resuming never fast-forwards.
   */
  advance(elapsedMs: number, tick: () => boolean): AdvanceResult {
    this.accumulator += Math.min(MAX_FRAME_MS, Math.max(0, elapsedMs));
    let ticks = 0;
    while (this.accumulator >= TICK_MS && ticks < MAX_CATCH_UP_TICKS) {
      this.accumulator -= TICK_MS;
      ticks++;
      if (!tick()) {
        this.accumulator = 0;
        this.overloadStreak = 0;
        return { ticks, overloaded: false, sustained: false };
      }
    }
    const overloaded = ticks === MAX_CATCH_UP_TICKS && this.accumulator >= TICK_MS;
    if (overloaded) this.accumulator = 0;
    this.overloadStreak = overloaded ? this.overloadStreak + 1 : 0;
    return { ticks, overloaded, sustained: this.overloadStreak >= SUSTAINED_OVERLOAD_FRAMES };
  }
}
