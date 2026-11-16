import type { BossMove, MatchOptions } from '../../sim/src/types.ts';

function strike(name: string, width: number, height: number, tell: number, active: number, recovery: number, damage: number, caption: string, frame: number): BossMove {
  return { name, kind: 'melee', width, height, tell, active, recovery, damageTenths: damage * 10, forceQ: 1300, angle: 45, caption, frame };
}

const claw = strike('Claw slash', 85, 85, 30, 10, 25, 8, 'One paw draws back. Step outside the claws, then strike.', 6);
const bite = { ...strike('Fang lunge', 120, 72, 34, 14, 34, 12, 'His jaws open. Jump the bite and land behind him.', 8), advanceUnits: 44 };
const toss = { ...strike('Mane throw', 60, 80, 44, 16, 45, 15, 'Both paws reach forward. Dodge the grab or back out of reach.', 10), grab: true, forceQ: 3500 };
const swat = strike('Side swat', 105, 92, 36, 12, 32, 11, 'One shoulder rolls back. Wait out the paw before stepping in.', 6);
const slam = strike('Overhead crush', 95, 155, 54, 12, 52, 19, 'The paw lifts overhead. Move past his back and punish the landing.', 8);
const rake = strike('Double rake', 145, 65, 40, 18, 38, 14, 'Both paws drop. Jump his low reach or dodge across it.', 10);
const thrust = strike('Spear thrust', 220, 72, 40, 12, 35, 14, 'The spear levels. Jump the point and close the distance.', 0);
const sweep = { ...strike('Ground sweep', 0, 42, 48, 14, 40, 15, 'Goliath lowers his spear. Leave the floor before the sweep.', 0), kind: 'sweep' as const };
const rush = { ...strike('Champion charge', 95, 110, 42, 24, 54, 17, 'He sets his shoulder. Leave his line and sling during recovery.', 0), kind: 'charge' as const };

export const DAVID_FIGHTS = [
  { name: 'Lion Man', part: '001', arena: 'wilderness_waystation', skin: 'lion', hero: 'samson', scale: 1.15, guard: 750, intro: 'A lion breaks from cover at the edge of the flock. David turns to meet him before he reaches the sheep.', phases: [[claw, bite, toss], [bite, claw, toss], [toss, bite, claw]] },
  { name: 'Bear', part: '001', arena: 'deborahs_palm_court', skin: 'bear', hero: 'samson', scale: 1.32, guard: 1050, intro: 'The flock scatters among the trees. A bear rears up in the gap. David has room for a sling shot if he can draw out the heavy paw.', phases: [[swat, slam], [swat, rake, slam], [rake, swat, slam]] },
  { name: 'Goliath', part: '002', arena: 'elah_training_terrace', skin: 'goliath', hero: 'saul', scale: 3, guard: 1700, intro: 'At Elah the two armies stand across the valley. David steps out with his sling. The champion lowers his spear.', phases: [[thrust], [thrust, sweep], [rush, sweep, thrust]] },
];

export function davidFightOptions(index: number, difficulty: string, inputId: string): MatchOptions {
  const fight = DAVID_FIGHTS[index];
  return { mode: 'boss', storyFight: index, arena: fight.arena, difficulty, bossName: fight.name, bossScript: { phases: fight.phases },
    fighters: [{ hero: 'david', human: true, team: 0, inputId, stocks: 3 }, { hero: fight.hero, human: false, inputId: 'cpu', name: fight.name, team: 1, stocks: 1, guard: fight.guard, scale: fight.scale }] };
}

/** Quick Battle uses the same opponent and moves without recording a chapter victory. */
export function withChapterOpponent(options: MatchOptions, inputId: string): MatchOptions {
  const index = DAVID_FIGHTS.findIndex(fight => fight.skin === options.opponent);
  if (index < 0 || (options.mode !== 'duel' && options.mode !== 'boss')) return options;
  const encounter = davidFightOptions(index, options.difficulty ?? 'easy', inputId);
  const enemy = encounter.fighters![1];
  return { ...options, opponent: encounter.fighters![1].hero, exhibitionOpponent: index, bossName: encounter.bossName, bossScript: encounter.bossScript,
    fighters: [{ hero: options.hero ?? 'david', team: 0, human: true, inputId },
      { ...enemy, stocks: options.mode === 'boss' ? 1 : undefined }] };
}
