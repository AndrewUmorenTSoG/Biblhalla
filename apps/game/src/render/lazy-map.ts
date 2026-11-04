// Values built on first read, so large art sheets decode only when something draws them.

/** An object whose values are built from `source` the first time each key is read. */
export function lazyMap<S, T>(source: Record<string, S>, make: (s: S) => T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [id, value] of Object.entries(source)) {
    let built: T | undefined;
    Object.defineProperty(out, id, { enumerable: true, get: () => (built ??= make(value)) });
  }
  return out;
}

