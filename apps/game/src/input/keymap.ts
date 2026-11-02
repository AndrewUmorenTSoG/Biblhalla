// Keyboard remapping. Every action owns exactly one key; choosing a key that another
// action already uses swaps the two, so no key ever drives two controls. The arrow
// keys move only while no action is bound to them.

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
  const other = Object.keys(next).find(k => k !== action && next[k] === code) ?? null;
  if (other) next[other] = bindings[action];
  next[action] = code;
  return { bindings: next, swappedWith: other, error: null };
}

/** True when no key is shared between two actions. */
export function bindingsAreUnique(bindings: KeyBindings): boolean {
  const codes = Object.values(bindings);
  return new Set(codes).size === codes.length;
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
  };
}
