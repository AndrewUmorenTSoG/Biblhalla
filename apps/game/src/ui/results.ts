import type { SimState } from '../../../../packages/sim/src/types.ts';
import type { RuntimeArt } from '../render/renderer.ts';

function node(tag: string, text: string, cls?: string) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (cls) element.className = cls;
  return element;
}

/** All three headline statistics belong to the fighter in the spotlight. */
export function presentResult(
  world: SimState,
  art: RuntimeArt,
  portrait: (hero: string) => HTMLElement,
  replay?: string,
) {
  const get = (id: string) => document.getElementById(id)!;
  const result = world.result!;
  const places = result.placements ?? [];
  const player = world.fighters.find(f => f.human) ?? world.fighters[0];
  const local = ['local', 'ffa', 'teams'].includes(world.mode);
  const draw = /\bdraw\b/i.test(result.reason);
  const lesson = world.mode === 'training';
  const solo = world.mode === 'waves' || world.mode === 'story';
  const winnerId = result.winners?.[0] ?? places[0]?.fighter;
  const opponent = world.fighters.find(f => !f.human && f.stocks > 0);
  const victor =
    !result.won && world.options.storyFight !== undefined ? opponent : world.fighters.find(f => f.id === winnerId);
  const focus = (!draw && !lesson && !solo ? victor : undefined) ?? player;
  const won = result.won || (local && !!victor?.human);
  const team = world.mode === 'teams' && !draw;
  const theme = replay || lesson || draw ? 'neutral' : won ? 'victory' : 'defeat';
  get('result-dialog').dataset.theme = theme;
  get('result-outcome').textContent = replay
    ? 'Replay'
    : lesson
      ? 'Training'
      : draw
        ? 'Draw'
        : won
          ? 'Victory'
          : 'Defeat';
  get('result-title').textContent = team ? 'Team ' + (focus.team + 1) : focus.name;
  get('result-subtitle').textContent =
    replay ??
    (lesson
      ? 'Lesson complete'
      : draw
        ? 'Shared result'
        : solo
          ? won
            ? 'Waves cleared'
            : 'Last stand'
          : team
            ? focus.name + ' · Team spotlight'
            : focus === victor || won
              ? 'Champion of the Arena'
              : 'Match complete');
  const bossIndex = world.options.storyFight ?? world.options.exhibitionOpponent;
  const skin = focus.partner
    ? 'lion'
    : focus.guard != null && bossIndex !== undefined
      ? ['lion', 'bear', 'goliath'][bossIndex]
      : undefined;
  const stage = get('result-art');
  stage.replaceChildren();
  if (skin && art.images[skin]) {
    const image = art.images[skin];
    // Boss sheets include weapon reach and foot registration. Frame the bust for the podium.
    const [x, y, size] = skin === 'goliath' ? [24, 127, 230] : [19, 15, 155];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    stage.append(canvas);
    const paint = () => canvas.getContext('2d')?.drawImage(image, x, y, size, size, 0, 0, size, size);
    if (image.naturalWidth) paint();
    else image.addEventListener('load', paint, { once: true });
  } else stage.append(portrait(focus.hero));
  get('result-reason').textContent = result.reason === 'All three lives used' ? 'Final stock lost' : result.reason;
  const seconds = Math.floor((result.ticks ?? world.tick) / 60);
  const stats = get('result-stats');
  stats.replaceChildren();
  for (const [label, value] of [
    ['Damage dealt', Math.floor(focus.damageDealt / 10)],
    ['Lives left', focus.stocks],
    ['Match time', Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')],
  ]) {
    const card = node('div', '');
    card.append(node('dt', String(label)), node('dd', String(value)));
    stats.append(card);
  }
  const list = get('result-ranking');
  list.replaceChildren();
  get('ranking-title').hidden = !places.length;
  for (const p of places) {
    const row = node('li', '', 'result-place');
    row.dataset.place = String(p.place);
    const detail = p.stocks === 0 ? 'Eliminated' : p.stocks + (p.stocks === 1 ? ' life left' : ' lives left');
    const identity = node('div', '');
    identity.append(node('strong', p.name), node('small', (p.human ? 'P' + p.fighter + ' · ' : '') + detail));
    row.append(
      node('b', String(p.place).padStart(2, '0'), 'result-rank'),
      identity,
      node('span', Math.floor(p.damageDealt / 10) + ' DMG'),
    );
    list.append(row);
  }
  get('result-select').hidden = !!replay || lesson || world.options.storyFight !== undefined;
}
