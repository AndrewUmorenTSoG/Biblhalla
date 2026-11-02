// Keyboard remapping. Every action owns exactly one key; choosing a key that another
// action already uses swaps the two, so no key ever drives two controls. The one
// deliberate exception is Up and Jump, which may share a key (W by default, as in
// tap-jump). The arrow keys move only while no action is bound to them.

export type KeyBindings = Record<string, string>;

/** Keys a player may bind: letters, digits, arrows, numpad, punctuation and modifiers. */
export const BINDABLE_KEY = /^(Key[A-Z]|Digit[0-9]|Numpad([0-9]|Add|Subtract|Multiply|Divide|Decimal|Enter)|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Enter|Escape|Backspace|Tab|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal|Backquote)$/;

const ARROWS: Record<string, string> = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

export interface RebindResult { bindings: KeyBindings; swappedWith: string | null; error: string | null }

/** Bind `code` to `action`; a clash moves the other action onto this action's old key. */
export function rebind(bindings: KeyBindings, action: string, code: string): RebindResult {
  if (!(action in bindings)) return { bindings, swappedWith: null, error: `Unknown control ${action}` };
  if (!BINDABLE_KEY.test(code)) return { bindings, swappedWith: null, error: 'That key cannot be used. Try another.' };
  if (action !== 'pause' && code === 'Escape') return { bindings, swappedWith: null, error: 'Escape is kept for cancelling. Try another.' };
  const next = { ...bindings };
  const clashes = Object.keys(next).filter(k => k !== action && next[k] === code && !sharable(action, k));
  for (const k of clashes) next[k] = bindings[action];
  next[action] = code;
  return { bindings: next, swappedWith: clashes[0] ?? null, error: null };
}

/** Up and Jump may share one key; every other pair must not. */
const SHARED_PAIR = ['up', 'jump'];
function sharable(a: string, b: string): boolean { return SHARED_PAIR.includes(a) && SHARED_PAIR.includes(b) && a !== b; }

/** True when no key drives two controls (apart from the Up/Jump pair). */
export function bindingsAreUnique(bindings: KeyBindings): boolean {
  const keys = Object.keys(bindings);
  return keys.every((a, i) => keys.slice(i + 1).every(b => bindings[a] !== bindings[b] || sharable(a, b)));
}

/** Controls that share a key with `action` (only ever the Up/Jump pair). */
export function sharedWith(bindings: KeyBindings, action: string): string[] {
  return Object.keys(bindings).filter(k => k !== action && bindings[k] === bindings[action]);
}

/** Whether a key press belongs to the game (so it is captured and not scrolled). */
export function isGameKey(bindings: KeyBindings, code: string): boolean {
  return Object.values(bindings).includes(code) || arrowFallback(bindings, code) !== null;
}

/** The direction an unbound arrow key stands for, or null. */
export function arrowFallback(bindings: KeyBindings, code: string): string | null {
  const bound = new Set(Object.values(bindings));
  for (const [dir, arrow] of Object.entries(ARROWS)) if (arrow === code && !bound.has(code)) return dir;
  return null;
}

/** Semantic frame from held keys and this tick's new presses. */
export function keyboardFrame(bindings: KeyBindings, held: Set<string>, edges: Set<string>) {
  const h = (a: string) => held.has(bindings[a]) || [...held].some(c => arrowFallback(bindings, c) === a);
  const e = (a: string) => edges.has(bindings[a]);
  return {
    x: Number(h('right')) - Number(h('left')), y: Number(h('up')) - Number(h('down')),
    jump: e('jump'), jumpHeld: h('jump'), light: e('light'), heavy: e('heavy'), heavyHeld: h('heavy'),
    dodge: e('dodge'), item: e('item'), interact: e('interact'), interactHeld: h('interact'),
    emote: [0, 1, 2, 3].find(n => e('emote' + n)) ?? -1,
  };
}
