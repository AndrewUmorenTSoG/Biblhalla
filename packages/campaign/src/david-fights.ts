// David's chapter fights: the three opponents (the lion, the bear and Goliath), their
// scripted moves and timing, and the match options used to start each fight.

import type { BossMove, MatchOptions } from '../../sim/src/types.ts';

function strike(name: string, width: number, height: number, tell: number, active: number, recovery: number, damage: number, caption: string, frame: number): BossMove {
  return { name, kind: 'melee', width, height, tell, active, recovery, damageTenths: damage * 10, forceQ: 1300, angle: 45, caption, frame };
}

const claw = { ...strike('Claw slash', 85, 85, 30, 10, 25, 8, 'One paw draws back. Step outside the claws, then strike.', 6), advanceUnits: 15 };
const bite = { ...strike('Fang lunge', 120, 72, 34, 14, 34, 12, 'His jaws open. Jump the bite and land behind him.', 8), advanceUnits: 44 };
const toss = { ...strike('Mane throw', 60, 80, 44, 16, 45, 15, 'Both paws reach forward. Dodge the grab or back out of reach.', 10), grab: true, forceQ: 3500 };
const swat = { ...strike('Side swat', 105, 92, 36, 12, 32, 11, 'One shoulder rolls back. Wait out the paw before stepping in.', 6), advanceUnits: 22 };
const slam = strike('Overhead crush', 95, 155, 54, 12, 52, 19, 'The paw lifts overhead. Move past his back and punish the landing.', 8);
const rake = strike('Double rake', 145, 65, 40, 18, 38, 14, 'Both paws drop. Jump his low reach or dodge across it.', 10);
const thrust = { ...strike('Spear thrust', 179, 100, 29, 9, 25, 24, 'The spear levels. Jump the point and close the distance.', 0), advanceUnits: 24 };
const sweep = { ...strike('Shield quake', 0, 42, 37, 12, 31, 30, 'Goliath raises his gold shield. Jump as it strikes the ground.', 0), kind: 'sweep' as const };
const rush = { ...strike('Champion charge', 95, 110, 32, 21, 42, 34, 'He sets his shoulder. Leave his line and sling during recovery.', 0), kind: 'charge' as const };

export const DAVID_FIGHTS = [
  { name: 'Lion Man', part: '001', arena: 'wilderness_waystation', skin: 'lion', hero: 'samson', scale: 1.15, guard: 750, intro: 'A lion breaks from cover at the edge of the flock. David turns to meet him before he reaches the sheep.', phases: [[claw, bite, toss], [bite, claw, toss], [toss, bite, claw]] },
  { name: 'Bear', part: '002', arena: 'deborahs_palm_court', skin: 'bear', hero: 'samson', scale: 1.32, guard: 1050, intro: 'The flock scatters among the trees. A bear rears up in the gap. David has room for a sling shot if he can draw out the heavy paw.', phases: [[swat, slam], [swat, rake, slam], [rake, swat, slam]] },
  { name: 'Goliath', part: '003', arena: 'elah_training_terrace', skin: 'goliath', hero: 'saul', scale: 3, guard: 3200, intro: 'At Elah the two armies stand across the valley. David steps out with his sling. The champion lowers his spear.', phases: [[thrust], [thrust, sweep], [rush, sweep, thrust]] },
];

export const DAVID_CHAPTER = DAVID_FIGHTS.map((fight, index) => index === 1
  ? { ...fight, name: 'Lion Man and Bear', intro: 'The lion circles back as the bear blocks the path. I must split them up and keep the ledge behind me clear.' }
  : fight);

export function davidFightOptions(index: number, difficulty: string, inputId: string): MatchOptions {
  const fight = DAVID_FIGHTS[index];
  const options: MatchOptions = { mode: 'boss', storyFight: index, arena: fight.arena, difficulty, bossName: fight.name, bossScript: { phases: fight.phases },
    fighters: [{ hero: 'david', human: true, team: 0, inputId, stocks: 3 }, { hero: fight.hero, human: false, inputId: 'cpu', name: fight.name, team: 1, stocks: 1, guard: fight.guard, scale: fight.scale }] };
  if (index === 1) {
    options.bossName = DAVID_CHAPTER[index].name;
    options.fighters![1].stocks = 2;
    const lion = DAVID_FIGHTS[0];
    options.fighters!.push({ hero: lion.hero, human: false, inputId: 'cpu2', name: lion.name, team: 1,
      stocks: 2, guard: lion.guard, scale: lion.scale, partnerScript: { phases: lion.phases } });
  }
  return options;
}

/** Quick Battle uses the same opponent and moves without recording a chapter victory. */
export function withChapterOpponent(options: MatchOptions, inputId: string): MatchOptions {
  const index = DAVID_FIGHTS.findIndex(fight => fight.skin === options.opponent);
  if (index < 0 || (options.mode !== 'duel' && options.mode !== 'boss')) return options;
  const encounter = davidFightOptions(index, options.difficulty ?? 'easy', inputId);
  const enemy = encounter.fighters![1];
  return { ...options, opponent: encounter.fighters![1].hero, exhibitionOpponent: index, bossName: DAVID_FIGHTS[index].name, bossScript: encounter.bossScript,
    fighters: [{ hero: options.hero ?? 'david', team: 0, human: true, inputId },
      { ...enemy, stocks: options.mode === 'boss' ? 1 : undefined }] };
}
