import type { BossMove, MatchOptions } from '../../sim/src/types.ts';
import type { MapDef } from '../../content/src/index.ts';
import { DAVID_FIGHTS } from './david-fights.ts';

export interface StorySlide {
  text: string;
  speaker?: string;
  scene: number;
}
export const MOSES_PARTS = [
  {
    title: 'The Calling',
    map: 'Desert Wilderness',
    art: 'calling',
    columns: 3,
    rows: 3,
    reference: 'Exodus 3–4',
    objective: 'Defeat the four wilderness opponents to unlock Return to Egypt.',
    slides: [
      { text: 'Moses tended his flock in the wilderness. Evening settled over the grass.', scene: 0 },
      { text: 'Beyond the grazing sheep, a strange golden light flickered upon the mountain.', scene: 1 },
      { text: 'He drew closer. Fire surrounded the bush, yet its branches remained alive.', scene: 2 },
      { text: 'The bush burned with fire, yet it was not consumed.', scene: 3 },
      { text: 'Moses, I have seen the suffering of My people.', speaker: 'The voice from the bush', scene: 4 },
      {
        text: 'Go to Pharaoh. Bring My people, the Israelites, out of Egypt.',
        speaker: 'The voice from the bush',
        scene: 5,
      },
      { text: 'Who am I that I should go? What if they do not believe me?', speaker: 'Moses', scene: 6 },
      { text: 'I will be with you.', speaker: 'The voice from the bush', scene: 7 },
      { text: 'So Moses went.', scene: 8 },
    ],
  },
  {
    title: 'Return to Egypt',
    map: 'Royal Palace Courtyard',
    art: 'return',
    columns: 2,
    rows: 2,
    reference: 'Exodus 4–5',
    objective: 'Defeat both Kedar guards to gain entry.',
    slides: [
      { text: 'The gates of Egypt rose before Moses. Watchful guards lined the approach.', scene: 0 },
      { text: 'Beyond the courtyard stretched a hall of towering pillars and royal gold.', scene: 1 },
      { text: 'Whispers followed him. Who would dare bring such a demand before Pharaoh?', scene: 2 },
      { text: 'Moses stood at the doors. He would not turn back.', scene: 3 },
    ],
  },
  {
    title: 'The Staff of God',
    map: 'Egyptian Temple Grounds',
    art: 'staff',
    columns: 3,
    rows: 2,
    reference: 'Exodus 4; 7',
    objective: 'Fight through the elite soldiers and palace guard to reach the court.',
    slides: [
      { text: 'In a quiet palace corridor, Moses met Aaron.', scene: 0 },
      { text: 'The Lord has sent us. We must speak together.', speaker: 'Moses', scene: 1 },
      { text: 'Moses lifted the staff. A sign would answer doubt.', scene: 2 },
      { text: 'The staff became a serpent. The watching servants drew back in astonishment.', scene: 3 },
      { text: 'The Lord confirmed His word with signs.', scene: 4 },
    ],
  },
  {
    title: 'Before Pharaoh',
    map: 'Pharaoh’s Great Hall',
    art: 'pharaoh',
    columns: 3,
    rows: 2,
    reference: 'Exodus 5; 7',
    objective: 'Defeat Pharaoh’s defenders.',
    slides: [
      { text: 'Pharaoh sat above the court, surrounded by the splendour of Egypt.', scene: 0 },
      { text: 'Moses and Aaron stood before him.', scene: 1 },
      { text: 'Let My people go.', speaker: 'Moses', scene: 2 },
      { text: 'Pharaoh laughed. He would not release the people.', scene: 3 },
      { text: 'The court fell silent. Fear and tension passed through the crowd.', scene: 4 },
    ],
  },
  {
    title: 'The Magicians of Egypt',
    map: 'Pharaoh’s Throne Palace',
    art: 'finale',
    columns: 3,
    rows: 2,
    reference: 'Exodus 7 · fictional arena finale',
    objective: 'Defeat all three magicians. Pharaoh is a spectator, never a target.',
    slides: [
      { text: 'The great throne palace opened before them.', scene: 0 },
      { text: 'From his throne, Pharaoh watched and waited.', scene: 1 },
      { text: 'Fire. Shadow. Lightning. Three magicians stepped into the arena together.', scene: 2 },
      { text: 'Moses and Aaron stood ready.', scene: 3 },
      { text: 'THE FINAL CONFRONTATION', scene: 4 },
    ],
  },
] as const;
export const MOSES_ENDING: StorySlide[] = [
  { text: 'Pharaoh’s confidence began to fade. Moses and Aaron stood victorious.', scene: 5 },
  { text: 'The Lord’s power was displayed before Egypt.', scene: 5 },
];

function spell(
  name: string,
  element: 'fire' | 'shadow' | 'lightning',
  frame: number,
  width: number,
  height: number,
  tell: number,
  damage: number,
): BossMove {
  return {
    name,
    element,
    kind: 'lane',
    frame,
    width,
    height,
    tell,
    active: 14,
    recovery: 40,
    damageTenths: damage * 10,
    forceQ: 1550,
    angle: 67,
    caption:
      element === 'lightning'
        ? 'A spark marks the ground. Move before the bolt falls.'
        : element === 'fire'
          ? 'Embers gather at your feet. Leave the glowing ground.'
          : 'Violet smoke gathers. Step out before the shadow rises.',
  };
}
const mageScripts = {
  'mage-fire': [
    [spell('Ember rise', 'fire', 0, 110, 110, 42, 16)],
    [spell('Furnace flare', 'fire', 1, 130, 145, 48, 19)],
    [spell('Cinder sweep', 'fire', 2, 155, 80, 44, 18)],
  ],
  'mage-shadow': [
    [spell('Shadow snare', 'shadow', 0, 105, 90, 44, 14)],
    [spell('Veil rupture', 'shadow', 1, 125, 120, 48, 17)],
    [spell('Crescent dusk', 'shadow', 2, 150, 80, 44, 16)],
  ],
  'mage-lightning': [
    [spell('Storm call', 'lightning', 0, 75, 220, 48, 18)],
    [spell('Sky fork', 'lightning', 1, 95, 235, 52, 21)],
    [spell('Thunder seal', 'lightning', 2, 120, 170, 48, 19)],
  ],
};
export function mosesMap(index: number): MapDef {
  const p = MOSES_PARTS[index];
  if (!p) throw new Error('Unknown Moses part');
  const id = 'moses-' + index;
  const main = {
    id: id + '-main',
    kind: 'solid' as const,
    rectUnits: [-560, 0, 1120, 80] as [number, number, number, number],
    wallRecoverable: true,
  };
  const positions =
    index === 4
      ? [
          [-150, 220, 300, 16],
          [-405, 145, 185, 16],
          [220, 145, 185, 16],
        ]
      : index === 0
        ? [
            [-340, 155, 220, 16],
            [140, 175, 220, 16],
          ]
        : [
            [-370, 155, 230, 16],
            [140, 155, 230, 16],
          ];
  return {
    id,
    name: p.map,
    scriptureContext: p.reference,
    main,
    platforms: positions.map((r, i) => ({
      id: id + '-upper-' + i,
      kind: 'oneWay',
      rectUnits: r as [number, number, number, number],
    })),
    blastBoundsUnits: { minX: -1050, maxX: 1050, minY: -620, maxY: 760 },
    spawnFeetUnits: [
      [-330, 82],
      [280, 82],
      [420, 82],
      [80, 82],
      [-80, 82],
    ],
    pickupSpawnUnits: [
      [-200, 120],
      [200, 120],
    ],
    competitiveCandidate: true,
    competitiveApproved: false,
    artReference: 'moses-arenas',
    artStatus: 'runtime_alpha',
  };
}
export function mosesFightOptions(index: number, difficulty: string, inputId: string): MatchOptions {
  const p = MOSES_PARTS[index];
  if (!p) throw new Error('Unknown Moses part');
  const skins =
    index === 0
      ? ['tiras', 'tiras', 'tiras', 'tiras']
      : index === 1
        ? ['kedar', 'kedar']
        : index === 2
          ? ['kedar', 'tiras', 'kedar']
          : index === 3
            ? ['tiras', 'kedar', 'tiras']
            : ['mage-fire', 'mage-shadow', 'mage-lightning'];
  const enemies = skins.map((skin, i) => {
    const mage = skin.startsWith('mage-');
    const phases = mage ? mageScripts[skin as keyof typeof mageScripts] : DAVID_FIGHTS[skin === 'kedar' ? 3 : 4].phases;
    return {
      hero: mage ? 'moses' : skin === 'kedar' ? 'esther' : 'nehemiah',
      skin,
      name: mage
        ? skin.slice(5)[0].toUpperCase() + skin.slice(6) + ' Magician'
        : (index === 2 ? 'Elite ' : index === 3 ? 'Royal ' : '') +
          (skin === 'kedar' ? 'Kedar' : 'Tiras') +
          ' ' +
          (i + 1),
      team: 1,
      human: false,
      inputId: 'moses-cpu-' + i,
      stocks: 1,
      guard: mage ? 1800 : index >= 2 ? 1400 : 1000,
      scale: mage ? 1.1 : skin === 'tiras' ? 1.2 : 1.05,
      ...(i ? { partnerScript: { phases }, partnerDelay: 90 + i * 45 } : {}),
      phases,
    };
  });
  return {
    mode: 'boss',
    mosesPart: index,
    storyFight: 5 + index,
    arenaOverride: mosesMap(index),
    difficulty,
    inputId,
    matchMinutes: 8,
    bossName: p.title,
    bossScript: { phases: enemies[0].phases },
    fighters: [
      { hero: 'moses', human: true, team: 0, inputId, stocks: 3 },
      ...enemies.map(({ phases, ...enemy }) => enemy),
    ],
  };
}
