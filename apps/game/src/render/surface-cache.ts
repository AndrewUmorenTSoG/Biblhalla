import { paintArenaSurface } from './arena-scenes.ts';

/** Rasterize fixed collision surfaces once; changing route geometry gets a new key. */
export class SurfaceCache {
  private entries = new Map<string, HTMLCanvasElement>();
  private readonly createCanvas: () => HTMLCanvasElement;
  constructor(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')) { this.createCanvas = createCanvas; }

  clear() { this.entries.clear(); }

  draw(c: CanvasRenderingContext2D, theme: string, rect: number[], solid: boolean) {
    const [x, bottom, width, thickness] = rect;
    const imageWidth = Math.ceil(width + 4), imageHeight = Math.ceil(thickness + 403);
    // Avoid a very large texture on unusual or user-authored campaign geometry.
    if (imageWidth > 2048 || imageHeight > 1024) {
      paintArenaSurface(c, theme, rect, solid);
      return;
    }
    const key = `${theme}|${solid}|${rect.join(',')}`;
    let image = this.entries.get(key);
    if (!image) {
      image = this.createCanvas();
      image.width = imageWidth; image.height = imageHeight;
      const target = image.getContext('2d');
      if (!target) { paintArenaSurface(c, theme, rect, solid); return; }
      target.translate(-x + 2, -bottom + 401);
      paintArenaSurface(target, theme, rect, solid);
      this.entries.set(key, image);
      if (this.entries.size > 10) this.entries.delete(this.entries.keys().next().value!);
    } else {
      // Keep recently visible route tiles resident.
      this.entries.delete(key); this.entries.set(key, image);
    }
    c.drawImage(image, x - 2, bottom - 401);
  }
}
