// Public simulation API. createEngine binds content once; every function is
// deterministic and free of DOM, storage, audio and wall-clock access.

import type { Content, Rect } from '../../content/src/index.ts';
import { createContext } from './context.ts';
import type { Fighter, FighterConfig, Input, InputFrame, InputFrames, MatchOptions, SimState } from './types.ts';
import { Q, hash, nextRandom, roundMul, snapshot } from './fixed.ts';
import { create, createFighter, finish, input, pause } from './state.ts';
import { eligibleItem, selectMove, startAttack } from './moveResolver.ts';
import { invincible, moveFighter } from './physics.ts';
import { capsuleRect, rectFor, segmentBox } from './combat.ts';
import type { Box } from './combat.ts';
import { knockOut } from './rules.ts';
import { step } from './step.ts';
import { newReplay, simulateReplay, validateReplay } from './replay.ts';

export * from './types.ts';
export type { Replay, ReplayEntry } from './replay.ts';
export { Q, hash, snapshot, roundMul } from './fixed.ts';
export { MAX_REPLAY_ENTRIES } from './replay.ts';

export function createEngine(content: Content) {
  const ctx = createContext(content);
  return {
    Q,
    content,
    P: ctx.P,
    R: ctx.R,
    moves: ctx.moves,
    defs: ctx.defs,
    input,
    hash,
    snapshot,
    roundMul,
    rng: (s: SimState) => nextRandom(s),
    create: (options?: MatchOptions) => create(ctx, options),
    step: (s: SimState, inputs?: InputFrames) => step(ctx, s, inputs),
    pause: (s: SimState, on?: boolean) => pause(s, on),
    finish: (s: SimState, won: boolean, reason: string, winners?: number[]) => finish(s, won, reason, winners),
    createFighter: (s: SimState, cfg: FighterConfig, slot: number) => createFighter(ctx, s, cfg, slot),
    selectMove: (f: Fighter, i: InputFrame, grounded?: boolean) => selectMove(ctx, f, input(i), grounded),
    startAttack: (s: SimState, f: Fighter, i: InputFrame, airCancel?: boolean) => startAttack(ctx, s, f, input(i), airCancel),
    eligibleItem: (s: SimState, f: Fighter) => eligibleItem(ctx, s, f),
    moveFighter: (s: SimState, f: Fighter, dx: number, dy: number) => moveFighter(ctx, s, f, dx, dy),
    knockOut: (s: SimState, f: Fighter) => knockOut(ctx, s, f),
    invincible,
    rectFor: (f: Fighter, rect: Rect, facing?: number) => rectFor(f, rect, facing),
    capsuleRect: (f: Fighter, b: Box) => capsuleRect(ctx, f, b),
    segmentBox,
    newReplay: (initial: SimState) => newReplay(ctx, initial),
    validateReplay: (raw: unknown) => validateReplay(ctx, raw),
    simulateReplay: (raw: unknown) => simulateReplay(ctx, raw),
  };
}

export type Engine = ReturnType<typeof createEngine>;
export type { Input };
