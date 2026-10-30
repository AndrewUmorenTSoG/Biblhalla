(function (root) {
  'use strict';
  class GameInput {
    constructor(canvas, touchLayer, onPause) {
      this.canvas = canvas;
      this.touchLayer = touchLayer;
      this.onPause = onPause;
      this.mode = 'keyboard';
      this.active = false;
      this.heldKeys = new Set();
      this.pressedKeys = new Set();
      this.touchHeld = new Set();
      this.touchPressed = new Set();
      this.touchPointers = new Map();
      this.joystick = { pointer: null, x: 0, y: 0 };
      this.previousGamepad = [];
      this.bindKeyboard();
      this.bindTouch();
    }
    clear() {
      this.heldKeys.clear(); this.pressedKeys.clear(); this.touchHeld.clear(); this.touchPressed.clear(); this.touchPointers.clear();
      this.joystick = { pointer: null, x: 0, y: 0 };
      this.previousGamepad = [];
      this.touchLayer.querySelectorAll('.held').forEach(el => el.classList.remove('held'));
      const thumb = this.touchLayer.querySelector('.stick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    }
    setMode(mode) {
      this.clear(); this.mode = mode;
      this.touchLayer.hidden = mode !== 'touch';
    }
    bindKeyboard() {
      document.addEventListener('keydown', event => {
        if (!this.active || event.target.closest('input,select,textarea,[contenteditable],dialog')) return;
        if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); this.onPause(); return; }
        const keys = ['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyJ','KeyK','KeyL','ShiftLeft','ShiftRight'];
        if (!keys.includes(event.code)) return;
        event.preventDefault();
        if (!this.heldKeys.has(event.code)) this.pressedKeys.add(event.code);
        this.heldKeys.add(event.code);
      });
      document.addEventListener('keyup', event => this.heldKeys.delete(event.code));
      root.addEventListener('blur', () => this.clear());
    }
    bindTouch() {
      for (const button of this.touchLayer.querySelectorAll('[data-action]')) {
        const release = event => {
          this.touchPointers.delete(event.pointerId);
          const action = button.dataset.action;
          if (![...this.touchPointers.values()].includes(action)) this.touchHeld.delete(action);
          button.classList.remove('held');
        };
        button.addEventListener('pointerdown', event => {
          if (!this.active) return;
          event.preventDefault(); button.setPointerCapture(event.pointerId);
          const action = button.dataset.action;
          this.touchPointers.set(event.pointerId, action); this.touchHeld.add(action); this.touchPressed.add(action);
          button.classList.add('held');
        });
        for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, release);
      }
      const stick = this.touchLayer.querySelector('.stick');
      const move = event => {
        if (event.pointerId !== this.joystick.pointer) return;
        const rect = stick.getBoundingClientRect();
        const dx = (event.clientX - rect.left - rect.width/2) / (rect.width * .34);
        const dy = (event.clientY - rect.top - rect.height/2) / (rect.height * .34);
        this.joystick.x = Math.abs(dx) > .28 ? Math.sign(dx) : 0;
        this.joystick.y = Math.abs(dy) > .42 ? Math.sign(dy) : 0;
        stick.querySelector('.stick-thumb').style.transform = `translate(${Math.max(-30,Math.min(30,dx*25))}px,${Math.max(-30,Math.min(30,dy*25))}px)`;
      };
      stick.addEventListener('pointerdown', event => {
        if (!this.active) return;
        event.preventDefault(); this.joystick.pointer = event.pointerId; stick.setPointerCapture(event.pointerId); move(event);
      });
      stick.addEventListener('pointermove', move);
      for (const name of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(name, event => {
        if (event.pointerId === this.joystick.pointer) { this.joystick = { pointer: null, x: 0, y: 0 }; stick.querySelector('.stick-thumb').style.transform = 'translate(0,0)'; }
      });
    }
    getGamepad() {
      return navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
    }
    read() {
      const input = root.Covenant.inputFrame();
      if (!this.active) return input;
      if (this.mode === 'touch') {
        input.x = this.joystick.x; input.y = this.joystick.y;
        for (const action of ['jump','light','heavy','dodge','item']) input[action] = this.touchPressed.has(action);
        input.jumpHeld = this.touchHeld.has('jump'); this.touchPressed.clear();
      } else if (this.mode === 'controller') {
        const pad = this.getGamepad();
        if (!pad) return input;
        const down = i => !!pad.buttons[i]?.pressed;
        const pressed = i => down(i) && !this.previousGamepad[i];
        input.x = down(14) ? -1 : down(15) ? 1 : Math.abs(pad.axes[0] || 0) > .25 ? Math.sign(pad.axes[0]) : 0;
        input.y = down(12) ? -1 : down(13) ? 1 : Math.abs(pad.axes[1] || 0) > .35 ? Math.sign(pad.axes[1]) : 0;
        input.jump = pressed(0); input.jumpHeld = down(0); input.light = pressed(2); input.heavy = pressed(3); input.dodge = pressed(1) || pressed(7); input.item = pressed(5);
        if (pressed(9)) this.onPause();
        this.previousGamepad = pad.buttons.map(b => b.pressed);
      } else {
        const held = (...keys) => keys.some(k => this.heldKeys.has(k));
        const pressed = (...keys) => keys.some(k => this.pressedKeys.has(k));
        input.x = Number(held('KeyD','ArrowRight')) - Number(held('KeyA','ArrowLeft'));
        input.y = Number(held('KeyS','ArrowDown')) - Number(held('KeyW','ArrowUp'));
        input.jump = pressed('Space'); input.jumpHeld = held('Space'); input.light = pressed('KeyJ'); input.heavy = pressed('KeyK'); input.dodge = pressed('ShiftLeft','ShiftRight'); input.item = pressed('KeyL');
        this.pressedKeys.clear();
      }
      return input;
    }
  }
  root.Covenant.GameInput = GameInput;
})(window);
