/** Decode once per texture; a countdown must never consume time behind missing fighters. */
export class SpriteReadiness {
  private states = new WeakMap<HTMLImageElement, 'loading' | 'ready' | 'error'>();
  check(images: (HTMLImageElement | undefined)[]): 'loading' | 'ready' | 'error' {
    let result: 'loading' | 'ready' | 'error' = 'ready';
    for (const image of images) {
      if (!image) return 'error';
      let state = this.states.get(image);
      if (!state) {
        state = 'loading';
        this.states.set(image, state);
        void image.decode().then(
          () => this.states.set(image, 'ready'),
          () => this.states.set(image, 'error'),
        );
      }
      if (state === 'error') return 'error';
      if (state === 'loading') result = 'loading';
    }
    return result;
  }
}
