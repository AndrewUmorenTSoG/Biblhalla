// Gameplay telegraphs drawn in world units (y up): boss tells and hazard zones,
// wave arrival markers, rising water and the Goliath reenactment lanes.
// Every marker also carries a text label so nothing relies on colour alone.

import type { SimState } from '../../../../packages/sim/src/index.ts';
import type { Scene } from '../../../../packages/campaign/src/index.ts';
import { Q } from '../../../../packages/sim/src/index.ts';
import { AIM_ZONE, GOLIATH_X, STONE_BAY_X } from '../../../../packages/campaign/src/goliath.ts';
import { EMBER_HALF_WIDTH, SIGHT_UNITS } from '../../../../packages/campaign/src/controller.ts';

const TELL = 'rgba(214,164,72,.32)', TELL_EDGE = '#b5832f';
const ACTIVE = 'rgba(176,64,48,.45)', ACTIVE_EDGE = '#8e2f22';
const WATER = 'rgba(70,128,170,.42)';

function label(c: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  c.save();
  c.translate(x, y);
  c.scale(1, -1);
  c.font = 'bold 14px system-ui';
  c.textAlign = 'center';
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(255,248,230,.9)';
  c.strokeText(text, 0, 0);
  c.fillStyle = '#1d2f35';
  c.fillText(text, 0, 0);
  c.restore();
}

function zone(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, text: string): void {
  c.fillStyle = active ? ACTIVE : TELL;
  c.strokeStyle = active ? ACTIVE_EDGE : TELL_EDGE;
  c.lineWidth = 3;
  c.setLineDash(active ? [] : [10, 6]);
  c.fillRect(x, y, w, h);
  c.strokeRect(x, y, w, h);
  c.setLineDash([]);
  label(c, text, x + w / 2, y + h + 16);
}

export function drawEncounter(c: CanvasRenderingContext2D, world: SimState, scene: Scene | null): void {
  const hz = world.bossHazard;
  if (hz) {
    const [x, y, w, h] = hz.box.map(v => v / Q);
    zone(c, x, y, w, h, hz.stage === 'active', hz.stage === 'active' ? hz.name.toUpperCase() : `${hz.name} · ${Math.ceil(hz.ticks / 60 * 10) / 10}s`);
  }
  const cue = world.cue;
  if (cue) {
    const x = cue.x / Q, y = cue.y / Q;
    c.strokeStyle = TELL_EDGE;
    c.lineWidth = 3;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.ellipse(x, y + 37, 26, 40, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    label(c, `${cue.role.replace(/_/g, ' ')} arriving`, x, y + 92);
  }
  if (!scene) return;
  const w = scene.water;
  if (w && w.state !== 'calm') {
    const top = w.state === 'high' ? 110 : 80 + 20 * (1 - w.ticksToSurge / w.tell);
    c.fillStyle = WATER;
    c.fillRect(-400, -120, 4600, top + 120);
    label(c, w.state === 'high' ? 'SURGE — stay on a ledge' : 'Water rising', scene.world.fighters[0].x / Q, top + 40);
  }
  // Archive travelers: simple cloaked figures with a status label (art pending from Codex).
  for (const t of scene.travelers) {
    const x = t.x / Q, y = t.y / Q;
    c.fillStyle = t.state === 'safe' ? '#7d9a7a' : '#b98f5b';
    c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x + 8, y + 46); c.lineTo(x - 8, y + 46); c.closePath(); c.fill();
    c.beginPath(); c.arc(x, y + 56, 10, 0, Math.PI * 2); c.fillStyle = '#d2a982'; c.fill();
    label(c, t.state === 'waiting' ? 'Traveler — Interact to regroup' : t.state === 'following' ? 'Following' : 'Safe', x, y + 84);
  }
  if (scene.sightLines) {
    for (const [a, b] of scene.covers) {
      c.fillStyle = 'rgba(60,92,70,.35)';
      c.fillRect(a / Q, 80, (b - a) / Q, 46);
      label(c, 'Cover — hold Down', (a + b) / 2 / Q, 142);
    }
    for (const h of scene.hazards) {
      if (h.state === 'safe' || !h.facing) continue;
      const x = h.x / Q, reach = SIGHT_UNITS * h.facing;
      c.fillStyle = h.state === 'active' ? 'rgba(214,164,72,.35)' : 'rgba(214,164,72,.14)';
      c.beginPath(); c.moveTo(x, 140); c.lineTo(x + reach, 200); c.lineTo(x + reach, 80); c.lineTo(x, 110); c.closePath(); c.fill();
      label(c, h.state === 'active' ? 'WATCHING' : 'Turning…', x, 230);
    }
  }
  for (const lane of scene.embers) {
    if (lane.state !== 'safe') zone(c, lane.x / Q - EMBER_HALF_WIDTH, 80, EMBER_HALF_WIDTH * 2, 60, lane.state === 'active', lane.state === 'active' ? 'EMBERS' : 'Embers gathering');
    if (!lane.kenCrossed) label(c, 'Ken crosses when clear', lane.x / Q, 170);
  }
  const wind = scene.wind;
  if (wind && (wind.state === 'warning' || wind.state === 'gust')) {
    const px = scene.world.fighters[0].x / Q;
    c.strokeStyle = wind.state === 'gust' ? 'rgba(235,245,250,.75)' : 'rgba(235,245,250,.35)';
    c.lineWidth = 2;
    for (let n = 0; n < 14; n++) {
      const sx = px + 520 - ((n * 97 + scene.tick * (wind.state === 'gust' ? 18 : 6)) % 1040), sy = 100 + (n * 53) % 260;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 60, sy); c.stroke();
    }
    label(c, wind.state === 'gust' ? 'GUST — hold Down to brace' : 'Gust coming', px, 300);
  }
  if (scene.level.number === 41) {
    const g = scene.goliath;
    for (const lane of g.lanes) if (lane.state !== 'safe') zone(c, lane.x / Q - 60, 80, 120, 70, lane.state === 'active', lane.state === 'active' ? 'SPEAR LANE' : 'Spear lane marked');
    if (!g.stone) label(c, 'Stream stone — Interact', STONE_BAY_X, 130);
    if (g.advance.state !== 'idle') {
      const x = g.advance.state === 'active' ? g.advance.x / Q : GOLIATH_X - 60;
      zone(c, x - 40, 80, 80, 50, g.advance.state === 'active', g.advance.state === 'active' ? 'JUMP' : 'Shield advance');
    }
    if (g.stage === 'aim') zone(c, AIM_ZONE[0], 80, AIM_ZONE[1] - AIM_ZONE[0], 8, false, 'Aim from here — Interact');
  }
}
