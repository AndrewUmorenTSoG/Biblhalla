// Decorative scenery for the six arenas. Collision and playable ledges are
// always drawn separately from maps.json, so this layer has no gameplay effect.

export const arenaNames = [
  'elah_training_terrace', 'wilderness_waystation', 'jericho_outskirts',
  'deborahs_palm_court', 'susa_garden_balcony', 'jerusalem_builders_court',
] as const;

export interface ArenaTheme {
  stone: string;
  shadow: string;
  top: string;
  trim: string;
  accent: string;
}

export const arenaThemes: Record<string, ArenaTheme> = {
  elah_training_terrace: { stone: '#927b5f', shadow: '#594d42', top: '#e6d2a3', trim: '#c4a876', accent: '#345d83' },
  wilderness_waystation: { stone: '#b78562', shadow: '#745441', top: '#f0cb91', trim: '#d5a778', accent: '#267c80' },
  jericho_outskirts: { stone: '#a67c55', shadow: '#634a3f', top: '#e7c78d', trim: '#c49a6c', accent: '#315b93' },
  deborahs_palm_court: { stone: '#a8a18a', shadow: '#5b6258', top: '#e4dcc1', trim: '#c9bda1', accent: '#744a73' },
  susa_garden_balcony: { stone: '#a99387', shadow: '#61545b', top: '#f0dfbd', trim: '#d1b49f', accent: '#2c9299' },
  jerusalem_builders_court: { stone: '#9b8b78', shadow: '#5c5552', top: '#e6d5b2', trim: '#c1a786', accent: '#4f708e' },
};

function polygon(c: CanvasRenderingContext2D, points: number[], color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath();
  c.fill();
}

function palm(c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  c.strokeStyle = color; c.lineWidth = size * .085; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + size * .08, y - size * .48, x + size * .22, y - size); c.stroke();
  c.lineWidth = size * .045;
  for (let i = -3; i <= 3; i++) {
    const endX = x + size * (.22 + i * .2);
    c.beginPath(); c.moveTo(x + size * .22, y - size); c.quadraticCurveTo(endX, y - size * 1.16, endX + i * size * .045, y - size * (.72 + .06 * Math.abs(i))); c.stroke();
  }
}

/** Paint low-contrast, non-colliding scenery behind the exact playable surfaces. */
export function paintArenaScenery(c: CanvasRenderingContext2D, id: string, cameraX: number, reducedMotion: boolean) {
  const drift = reducedMotion ? 0 : Math.max(-32, Math.min(32, -cameraX * .04));
  c.save(); c.translate(drift, 0); c.globalAlpha = .55;
  switch (id) {
    case 'elah_training_terrace': {
      polygon(c, [-50, 500, 60, 405, 190, 470, 350, 365, 540, 460, 690, 385, 850, 465, 1080, 390, 1340, 500], '#7a8b78');
      polygon(c, [-50, 565, 100, 485, 220, 525, 390, 445, 560, 510, 745, 450, 905, 530, 1130, 465, 1340, 550], '#576f65');
      for (const [x, y] of [[85, 503], [290, 480], [1000, 475], [1170, 515]]) palm(c, x, y, 45, '#3d6558');
      for (const x of [205, 1030]) { c.fillStyle = '#b9a47d'; c.fillRect(x, 408, 5, 90); polygon(c, [x+5, 411, x+49, 418, x+5, 439], '#345d83'); }
      break;
    }
    case 'wilderness_waystation': {
      polygon(c, [-50, 520, 0, 365, 155, 350, 210, 465, 350, 490, 420, 350, 580, 355, 655, 480, 820, 460, 900, 330, 1100, 360, 1170, 470, 1340, 490], '#aa7962');
      polygon(c, [-50, 590, 125, 478, 315, 505, 485, 467, 640, 525, 825, 460, 1080, 510, 1340, 470], '#8c6659');
      for (const x of [170, 1030]) { c.fillStyle = '#755547'; c.fillRect(x, 430, 5, 98); c.fillRect(x+102, 430, 5, 98); polygon(c, [x, 432, x+57, 405, x+107, 432, x+90, 442, x+13, 442], '#277f83'); }
      break;
    }
    case 'jericho_outskirts': {
      c.fillStyle = '#8b6b55'; c.fillRect(-30, 390, 1360, 150);
      for (let x = -20; x < 1350; x += 95) { c.fillStyle = '#ad8865'; c.fillRect(x, 368, 66, 31); c.fillStyle = '#715848'; c.fillRect(x+6, 420, 2, 95); }
      for (const x of [150, 620, 1060]) { c.fillStyle = '#9b7554'; c.fillRect(x, 325, 100, 190); c.fillStyle = '#655b58'; c.fillRect(x+34, 408, 32, 70); }
      palm(c, 45, 545, 100, '#426b61'); palm(c, 1240, 540, 115, '#426b61');
      for (const x of [190, 670, 1120]) { c.fillStyle = '#7d6553'; c.fillRect(x, 285, 4, 72); polygon(c, [x+4, 285, x+44, 294, x+4, 313], '#315b93'); }
      break;
    }
    case 'deborahs_palm_court': {
      polygon(c, [-50, 560, 100, 445, 240, 485, 440, 425, 650, 500, 850, 425, 1040, 485, 1340, 440, 1340, 650], '#6c8c78');
      for (const [x,s] of [[95,150],[290,120],[1020,135],[1240,175]]) palm(c, x, 530, s, '#446c61');
      for (const x of [360, 790]) { c.fillStyle = '#a29484'; c.fillRect(x, 420, 6, 105); c.fillRect(x+145, 420, 6, 105); polygon(c, [x, 424, x+78, 405, x+151, 424, x+140, 437, x+13, 437], '#744a73'); }
      break;
    }
    case 'susa_garden_balcony': {
      c.fillStyle = '#b6928a'; c.fillRect(-30, 395, 1360, 160);
      for (let x = -30; x < 1350; x += 170) { c.fillStyle = '#338e91'; c.fillRect(x, 364, 150, 20); c.fillRect(x+16, 384, 18, 146); c.fillRect(x+116, 384, 18, 146); c.beginPath(); c.arc(x+75, 446, 49, Math.PI, 0); c.lineTo(x+124, 530); c.lineTo(x+26, 530); c.closePath(); c.fill(); c.fillStyle = '#d8b3a3'; c.beginPath(); c.arc(x+75, 459, 30, Math.PI, 0); c.lineTo(x+105, 530); c.lineTo(x+45, 530); c.closePath(); c.fill(); }
      for (const x of [80, 620, 1150]) palm(c, x, 525, 68, '#5b826c');
      break;
    }
    case 'jerusalem_builders_court': {
      c.fillStyle = '#918171'; c.fillRect(-30, 390, 1360, 170);
      for (let row = 0; row < 6; row++) for (let x = -70 + (row%2)*46; x < 1340; x += 92) { c.strokeStyle = '#5d5c58'; c.lineWidth = 2; c.strokeRect(x, 392+row*27, 89, 26); }
      for (const x of [140, 990]) { c.strokeStyle = '#5e615d'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 350); c.lineTo(x, 510); c.moveTo(x+110, 350); c.lineTo(x+110, 510); c.moveTo(x-8, 390); c.lineTo(x+118, 390); c.moveTo(x-8, 450); c.lineTo(x+118, 450); c.stroke(); polygon(c, [x, 352, x+112, 352, x+100, 377, x+12, 377], '#4f708e'); }
      break;
    }
  }
  c.restore();
}

/** A surface's visual face is derived from its collider, including its true top Y. */
export function paintArenaSurface(c: CanvasRenderingContext2D, id: string, rect: number[], solid: boolean) {
  // Runtime physics uses [left, bottom, width, height], including campaign maps.
  // World units with +Y up. Nothing is drawn above the collision top; trim may
  // hang below a ledge's underside, never across its standing surface.
  const [x, bottom, width, thickness] = rect;
  const top = bottom + thickness;
  const t = arenaThemes[id] ?? arenaThemes.elah_training_terrace;
  const style = SURFACES[id] ?? SURFACES.elah_training_terrace;
  c.save();
  c.beginPath(); c.rect(x - 1, bottom - 400, width + 2, thickness + 401); c.clip();
  (solid ? style.solid : style.ledge)(c, x, bottom, width, top, t);
  c.restore();
  // Every standing surface ends in the same crisp, readable top edge.
  c.fillStyle = t.top; c.fillRect(x, top - 4, width, 4);
  c.strokeStyle = t.shadow; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, top); c.lineTo(x + width, top); c.stroke();
}

type Painter = (c: CanvasRenderingContext2D, x: number, bottom: number, width: number, top: number, t: ArenaTheme) => void;

function block(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(x, y, w, h);
}

/** Courses of blocks; alternate rows are staggered like laid masonry. */
function courses(c: CanvasRenderingContext2D, x: number, bottom: number, width: number, top: number, rowH: number, blockW: number, face: string, alt: string, seam: string) {
  for (let y = top - rowH, row = 0; y > bottom - rowH; y -= rowH, row++) {
    const shift = (row % 2) * blockW / 2;
    for (let bx = x - shift, n = 0; bx < x + width; bx += blockW, n++) {
      block(c, bx, y, blockW - 3, rowH - 3, (n + row) % 3 === 0 ? alt : face);
    }
    block(c, x, y - 1, width, 2, seam);
  }
}

function plank(c: CanvasRenderingContext2D, x: number, bottom: number, width: number, top: number, wood: string, grain: string) {
  block(c, x, bottom, width, top - bottom, wood);
  c.strokeStyle = grain; c.lineWidth = 1.5;
  for (let y = bottom + 4; y < top - 2; y += 5) { c.beginPath(); c.moveTo(x + 4, y); c.lineTo(x + width - 4, y + (y % 3) - 1); c.stroke(); }
  for (let n = x + 40; n < x + width - 20; n += 70) block(c, n, bottom, 3, top - bottom, grain);
}

const SURFACES: Record<string, { solid: Painter; ledge: Painter }> = {
  // Limestone terrace: pale offset blocks, moss along the lip; ledges are iron-bracketed beams with a hanging banner.
  elah_training_terrace: {
    solid: (c, x, b, w, top, t) => {
      block(c, x, b, w, top - b, t.shadow);
      courses(c, x, b, w, top, 22, 74, '#cdbb92', '#b9a57c', t.shadow);
      for (let n = x + 18; n < x + w - 10; n += 57) block(c, n, top - 9, 14 + (Math.abs(n) % 9), 5, '#6f8a55');
    },
    ledge: (c, x, b, w, top, t) => {
      plank(c, x, b, w, top, '#8a6a48', '#5e4630');
      for (const bx of [x + 12, x + w - 22]) { block(c, bx, b - 18, 10, 18, '#4b4a4c'); block(c, bx - 4, b - 2, 18, 4, '#4b4a4c'); }
      block(c, x + w / 2 - 14, b - 46, 28, 46, t.accent); block(c, x + w / 2 - 14, b - 46, 28, 4, '#d5b05a');
    },
  },
  // Wind-carved sandstone: wavy strata in ochre and rose; ledges are rope-lashed planks with a teal cloth drape.
  wilderness_waystation: {
    solid: (c, x, b, w, top) => {
      const bands = ['#d39b6c', '#c0825a', '#e0b07e', '#b5734f'];
      let k = 0;
      for (let y = top; y > b; y -= 14, k++) {
        c.fillStyle = bands[k % bands.length];
        c.beginPath(); c.moveTo(x, y);
        for (let px = x; px <= x + w; px += 40) c.lineTo(px, y - 4 - 3 * Math.sin((px + k * 37) / 55));
        c.lineTo(x + w, y - 16); c.lineTo(x, y - 16); c.closePath(); c.fill();
      }
    },
    ledge: (c, x, b, w, top, t) => {
      plank(c, x, b, w, top, '#a77a4f', '#6d4a2c');
      c.strokeStyle = '#e4cf9c'; c.lineWidth = 2;
      for (let n = x + 10; n < x + w; n += 48) { c.beginPath(); c.moveTo(n, top - 1); c.lineTo(n + 6, b + 1); c.moveTo(n + 6, top - 1); c.lineTo(n, b + 1); c.stroke(); }
      c.fillStyle = t.accent; c.beginPath(); c.moveTo(x + 20, b); c.quadraticCurveTo(x + w / 2, b - 34, x + w - 20, b); c.closePath(); c.fill();
    },
  },
  // Mudbrick walls: small sun-dried bricks under an inset crenel band; ledges are bound palm logs.
  jericho_outskirts: {
    solid: (c, x, b, w, top, t) => {
      block(c, x, b, w, top - b, '#7a5a43');
      courses(c, x, b, w, top - 14, 11, 30, '#b07b52', '#9d6a46', '#6b4c38');
      for (let n = x; n < x + w; n += 36) block(c, n, top - 14, 22, 12, '#c58e60');
      block(c, x, top - 16, w, 2, t.shadow);
    },
    ledge: (c, x, b, w, top) => {
      const h = top - b;
      for (let n = x; n < x + w; n += 26) {
        c.fillStyle = '#8c6a46'; c.beginPath(); c.ellipse(n + 13, b + h / 2, 13, h / 2, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#5e4730'; c.lineWidth = 1.5; c.stroke();
      }
      for (const n of [x + 30, x + w - 36]) block(c, n, b, 6, h, '#c9a66a');
    },
  },
  // Pale court stone with a violet diamond inlay; ledges are woven reed mats on carved corbels.
  deborahs_palm_court: {
    solid: (c, x, b, w, top, t) => {
      block(c, x, b, w, top - b, '#cfc6ab');
      courses(c, x, b, w, top - 26, 26, 120, '#d8d0b6', '#c4bb9f', '#9f977f');
      block(c, x, top - 26, w, 20, '#e8e0c6');
      c.fillStyle = t.accent;
      for (let n = x + 10; n < x + w - 10; n += 30) { c.beginPath(); c.moveTo(n, top - 23); c.lineTo(n + 7, top - 16); c.lineTo(n, top - 9); c.lineTo(n - 7, top - 16); c.closePath(); c.fill(); }
    },
    ledge: (c, x, b, w, top) => {
      block(c, x, b, w, top - b, '#c7a564');
      c.strokeStyle = '#8c6d3a'; c.lineWidth = 2;
      for (let n = x; n < x + w; n += 10) { c.beginPath(); c.moveTo(n, b); c.lineTo(n + 10, top); c.stroke(); }
      for (const n of [x + 6, x + w - 26]) { c.fillStyle = '#b7ad94'; c.beginPath(); c.moveTo(n, b); c.lineTo(n + 20, b); c.lineTo(n + 10, b - 26); c.closePath(); c.fill(); }
    },
  },
  // Rose marble with a glazed turquoise-and-gold tile band; ledges are gilt-rimmed tiled slabs trailing vines.
  susa_garden_balcony: {
    solid: (c, x, b, w, top, t) => {
      block(c, x, b, w, top - b, '#c9a69c');
      courses(c, x, b, w, top - 24, 28, 140, '#d6b5ab', '#c39d93', '#9b7d75');
      for (let n = x, k = 0; n < x + w; n += 16, k++) block(c, n, top - 22, 15, 16, k % 2 ? t.accent : '#d9b453');
      block(c, x, top - 24, w, 2, '#8e6f57');
    },
    ledge: (c, x, b, w, top, t) => {
      for (let n = x, k = 0; n < x + w; n += 12, k++) block(c, n, b, 11, top - b, k % 2 ? t.accent : '#e6d3b0');
      block(c, x, b, w, 3, '#d9b453');
      c.strokeStyle = '#4f7d55'; c.lineWidth = 3;
      for (let n = x + 18; n < x + w - 10; n += 45) { c.beginPath(); c.moveTo(n, b); c.quadraticCurveTo(n + 8, b - 18, n - 2, b - 30 - (Math.abs(n) % 13)); c.stroke(); }
    },
  },
  // Rough ashlar with chisel marks, mid-construction; ledges are scaffold planks on timber cross-bracing.
  jerusalem_builders_court: {
    solid: (c, x, b, w, top) => {
      block(c, x, b, w, top - b, '#867664');
      courses(c, x, b, w, top, 34, 110, '#b9a588', '#a8957a', '#655a4f');
      c.strokeStyle = '#7a6b5a'; c.lineWidth = 1;
      for (let n = x + 8; n < x + w; n += 13) { c.beginPath(); c.moveTo(n, top - 6); c.lineTo(n + 4, top - 14); c.stroke(); }
    },
    ledge: (c, x, b, w, top) => {
      plank(c, x, b, w, top, '#b08d5f', '#7b5d3a');
      c.strokeStyle = '#6b5236'; c.lineWidth = 4;
      for (let n = x + 10; n < x + w - 40; n += 70) { c.beginPath(); c.moveTo(n, b); c.lineTo(n + 40, b - 34); c.moveTo(n + 40, b); c.lineTo(n, b - 34); c.stroke(); }
    },
  },
};

/** A menu thumbnail generated from the same visual and collision layers as play. */
export function paintArenaPreview(canvas: HTMLCanvasElement, map: { id: string; main: { rectUnits: number[] }; platforms: { rectUnits: number[] }[] }, backdrop?: HTMLImageElement) {
  const c = canvas.getContext('2d');
  if (!c) return;
  c.save(); c.scale(canvas.width / 1280, canvas.height / 720);
  const sky = c.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#87a6b1'); sky.addColorStop(.6, '#e3c7a0'); sky.addColorStop(1, '#796f61');
  c.fillStyle = sky; c.fillRect(0, 0, 1280, 720);
  if (backdrop?.complete && backdrop.naturalWidth) {
    const height = 330, width = height * backdrop.naturalWidth / backdrop.naturalHeight;
    c.drawImage(backdrop, 640-width/2, 0, width, height);
  }
  paintArenaScenery(c, map.id, 0, true);
  c.save(); c.translate(640, 460); c.scale(.85, -.85); c.translate(0, -170);
  for (const surface of [map.main, ...map.platforms]) paintArenaSurface(c, map.id, surface.rectUnits, surface === map.main);
  c.restore(); c.restore();
}
