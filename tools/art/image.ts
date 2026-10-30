// Minimal RGBA image helpers for the offline art pipeline (no native dependencies).

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export interface Image { width: number; height: number; data: Uint8Array }

export function readPng(path: string): Image {
  const png = PNG.sync.read(readFileSync(path));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

export function encodePng(img: Image): Buffer {
  const png = new PNG({ width: img.width, height: img.height });
  png.data = Buffer.from(img.data);
  return PNG.sync.write(png, { colorType: 6 });
}

export function writePng(path: string, img: Image): Buffer {
  const bytes = encodePng(img);
  writeFileSync(path, bytes);
  return bytes;
}

export function blank(width: number, height: number): Image {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

export function crop(img: Image, x0: number, y0: number, w: number, h: number): Image {
  const out = blank(w, h);
  for (let y = 0; y < h; y++) {
    const src = ((y0 + y) * img.width + x0) * 4;
    out.data.set(img.data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}

/** Area-average downscale by an arbitrary factor (premultiplied alpha). */
export function resize(img: Image, w: number, h: number): Image {
  const out = blank(w, h);
  const sx = img.width / w, sy = img.height / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) * 4, al = img.data[i + 3];
          r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++;
        }
      }
      const o = (y * w + x) * 4;
      if (a) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
      out.data[o + 3] = a / n;
    }
  }
  return out;
}

export function blit(dst: Image, src: Image, dx: number, dy: number): void {
  for (let y = 0; y < src.height; y++) {
    const s = y * src.width * 4;
    dst.data.set(src.data.subarray(s, s + src.width * 4), ((dy + y) * dst.width + dx) * 4);
  }
}

export const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
