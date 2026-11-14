// Controller and arrow-key navigation for menus and dialogs. The D-pad or left stick
// moves focus spatially between visible controls, South activates, East goes back.
// Pure geometry lives in `nextFocus` so it can be tested without a browser.

export type NavDirection = 'up' | 'down' | 'left' | 'right';
export interface NavRect { x: number; y: number; w: number; h: number }

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const REPEAT_DELAY_MS = 380, REPEAT_RATE_MS = 140;
const STICK_THRESHOLD = 0.55;

/**
 * Index of the best candidate in `direction` from `from`, or -1. Candidates must lie
 * ahead of the current control; distance along the axis counts once, sideways drift
 * counts three times, so focus prefers the control straight ahead.
 */
export function nextFocus(from: NavRect, candidates: NavRect[], direction: NavDirection): number {
  const cx = from.x + from.w / 2, cy = from.y + from.h / 2;
  let best = -1, bestScore = Infinity;
  candidates.forEach((r, i) => {
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    const ahead = direction === 'up' ? cy - y : direction === 'down' ? y - cy : direction === 'left' ? cx - x : x - cx;
    if (ahead <= 1) return;
    const drift = direction === 'up' || direction === 'down' ? Math.abs(x - cx) : Math.abs(y - cy);
    const score = ahead + drift * 3;
    if (score < bestScore) { best = i; bestScore = score; }
  });
  return best;
}

/** Menu scope: the open modal dialog if there is one, otherwise the visible screen. */
function scope(): ParentNode {
  const dialogs = [...document.querySelectorAll('dialog[open]')];
  return (dialogs.at(-1) as ParentNode | undefined) ?? document;
}

function visibleControls(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => {
    if (el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

const rectOf = (el: Element): NavRect => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };

export function moveFocus(direction: NavDirection): boolean {
  const controls = visibleControls(scope());
  if (!controls.length) return false;
  const current = document.activeElement as HTMLElement | null;
  if (!current || !controls.includes(current)) {
    // Start inside the visible screen's content rather than the header.
    const content = controls.find(el => el.closest('#screens .screen:not([hidden])')) ?? controls[0];
    content.focus();
    return true;
  }
  // Selects and range inputs keep left/right for changing their value.
  if ((direction === 'left' || direction === 'right') && current.matches('select, input[type=range]')) return false;
  const others = controls.filter(el => el !== current);
  const i = nextFocus(rectOf(current), others.map(rectOf), direction);
  if (i < 0) return false;
  others[i].focus();
  others[i].scrollIntoView?.({ block: 'nearest' });
  return true;
}

/** A polled gamepad has no native arrow-key default action on form controls. */
function navigatePad(direction: NavDirection): void {
  const control = document.activeElement;
  const horizontal = direction === 'left' || direction === 'right';
  if (!horizontal || !control || !scope().contains(control) || control.matches(':disabled')) {
    moveFocus(direction);
    return;
  }
  const step = direction === 'right' ? 1 : -1;
  if (control instanceof HTMLSelectElement && !control.multiple) {
    let index = control.selectedIndex + step;
    while (index >= 0 && index < control.options.length && control.options[index].matches(':disabled')) index += step;
    if (index < 0 || index >= control.options.length) return;
    control.selectedIndex = index;
  } else if (control instanceof HTMLInputElement && control.type === 'range') {
    const before = control.value;
    if (step > 0) control.stepUp();
    else control.stepDown();
    if (control.value === before) return;
  } else {
    moveFocus(direction);
    return;
  }
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Polls connected controllers while menus are active. `onBack` handles East when no
 * dialog is open (e.g. return to the previous screen).
 */
export class MenuNavigator {
  private held = new Map<string, number>();
  private previous: boolean[] = [];
  onBack: () => void = () => {};

  poll(pads: Gamepad[], now: number): void {
    const pad = pads[0];
    if (!pad) { this.held.clear(); return; }
    const b = pad.buttons.map(x => x.pressed);
    const ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
    const dirs: Record<NavDirection, boolean> = {
      up: !!b[12] || ay < -STICK_THRESHOLD, down: !!b[13] || ay > STICK_THRESHOLD,
      left: !!b[14] || ax < -STICK_THRESHOLD, right: !!b[15] || ax > STICK_THRESHOLD,
    };
    for (const d of Object.keys(dirs) as NavDirection[]) {
      if (!dirs[d]) { this.held.delete(d); continue; }
      const since = this.held.get(d);
      if (since === undefined) { this.held.set(d, now); navigatePad(d); }
      else if (now - since >= REPEAT_DELAY_MS) { this.held.set(d, now - REPEAT_DELAY_MS + REPEAT_RATE_MS); navigatePad(d); }
    }
    const pressed = (n: number) => b[n] && !this.previous[n];
    if (pressed(0)) (document.activeElement as HTMLElement | null)?.click();
    if (pressed(1)) {
      const dialog = [...document.querySelectorAll('dialog[open]')].at(-1) as HTMLDialogElement | undefined;
      if (dialog) dialog.dispatchEvent(new Event('cancel', { cancelable: true })) && dialog.close();
      else this.onBack();
    }
    this.previous = b;
  }
}

/** Arrow keys move focus in menus (Tab still works everywhere). */
export function bindArrowKeys(isMenuActive: () => boolean): void {
  window.addEventListener('keydown', e => {
    if (!isMenuActive()) return;
    const map: Record<string, NavDirection> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const d = map[e.key];
    if (!d) return;
    if (e.target instanceof HTMLTextAreaElement || (e.target instanceof HTMLInputElement && e.target.type === 'text')) return;
    if (moveFocus(d)) e.preventDefault();
  });
}
