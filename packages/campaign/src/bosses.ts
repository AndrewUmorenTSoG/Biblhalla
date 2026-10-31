// Authored boss patterns for the ten Story Archive training bosses, transcribed from
// each level's boss phases in campaign.json. Tells, recovery and lanes are fixed per
// move; difficulty only changes the quiet gap between moves (sim/boss.ts).
// Goliath (L041) is a separate composure reenactment, not a boss pattern.

import type { BossMove, BossScript } from '../../sim/src/index.ts';

type Shape = Pick<BossMove, 'kind' | 'width' | 'height'>;
const LOW_CHARGE: Shape = { kind: 'charge', width: 70, height: 40 }; // jump over
const RUSH: Shape = { kind: 'charge', width: 80, height: 90 };
const SWING: Shape = { kind: 'slam', width: 120, height: 160 };
const LANE: Shape = { kind: 'lane', width: 110, height: 140 };
const THRUST: Shape = { kind: 'lane', width: 260, height: 60 }; // duck under or dodge through
const SWEEP: Shape = { kind: 'sweep', width: 0, height: 45 }; // jump to a shelf

function move(name: string, shape: Shape, tell: number, recovery: number, caption: string, damageTenths = 120, active = 12): BossMove {
  return { name, ...shape, tell, active, recovery, damageTenths, forceQ: 900, angle: 45, caption };
}

export const BOSS_SCRIPTS: Record<string, BossScript> = {
  L017: { phases: [
    [move('Shield advance', LOW_CHARGE, 36, 32, 'Raised key: a low charge is coming. Jump over it.', 120, 24)],
    [move('Key-chain swing', SWING, 36, 32, 'Key-chain raised: leave the marked lane.'), move('Shield rush', RUSH, 36, 32, 'Shield lowered: a short rush.', 120, 18)],
    [move('Charge', LOW_CHARGE, 36, 12, 'Charge, then a pause.', 120, 24), move('Swing', SWING, 36, 42, 'The swing follows. Punish the long recovery.')],
  ] },
  L018: { phases: [
    [move('Sack toss', SWING, 42, 30, 'A sack is landing in the marked lane. Move to the other side.')],
    [move('Rolling sack', LOW_CHARGE, 36, 36, 'A model sack rolls across the floor. Jump the gap.', 100, 30)],
    [move('Sack toss', SWING, 42, 12, 'Toss…'), move('Rolling sack', LOW_CHARGE, 36, 36, '…then the push. Punish from above.', 100, 30)],
  ] },
  L021: { phases: [
    [move('Spear lane', THRUST, 36, 32, 'Shoulder drawn: a straight thrust. Drop low or dodge through.')],
    [move('Shield shove', RUSH, 36, 32, 'Shield shove.', 110, 16), move('Overhead strike', SWING, 36, 32, 'Overhead strike: leave the lane.')],
    [move('Shove', RUSH, 36, 12, 'Shove…', 110, 16), move('Thrust', THRUST, 36, 40, '…then the thrust. Punish the 40-tick end lag.')],
  ] },
  L027: { phases: [
    [move('Wide sweep', SWEEP, 42, 36, 'Wide sweep: jump to the centre shelf.')],
    [move('Wide sweep', SWEEP, 42, 36, 'Wide sweep.'), move('Descending strike', SWING, 36, 36, 'A marked strike is falling. The marker is locked.')],
    [move('Wide sweep', SWEEP, 42, 12, 'Sweep…'), move('Descending strike', SWING, 36, 48, '…and strike. A 48-tick opening follows.')],
  ] },
  L034: { phases: [
    [move('Pounce', SWING, 42, 36, 'Crouching: a pounce to a fixed point. Sidestep, then counter.', 120, 14)],
    [move('Ground dash', LOW_CHARGE, 36, 32, 'Dust kicks up: a short dash along the floor.', 110, 20), move('Pounce', SWING, 42, 36, 'Crouching: pounce.', 120, 14)],
    [move('Feint', SWING, 42, 8, 'A feint…', 0, 1), move('Pounce', SWING, 30, 36, '…then the real pounce. One platform stays safe.', 120, 14)],
  ] },
  L035: { phases: [
    [move('Mallet slam', LANE, 42, 36, 'Mallet raised: leave the marked floor lane.', 140)],
    [move('Lane sweep', RUSH, 42, 30, 'A slow sweep from one side.', 120, 30), move('Lane sweep', RUSH, 42, 36, 'And from the other side.', 120, 30)],
    [move('Mallet slam', LANE, 42, 12, 'Slam…', 140), move('Centre leap', SWING, 36, 40, '…then a leap to the marked centre. Punish the landing.', 130)],
  ] },
  L040: { phases: [
    [move('Swat', LANE, 36, 36, 'Shoulder rising: stay beyond the paw envelope.', 120, 10)],
    [move('Low rush', LOW_CHARGE, 36, 32, 'A low rush along the floor.', 110, 22), move('Swat', LANE, 36, 36, 'Standing swat.', 120, 10)],
    [move('Rush to marker', RUSH, 36, 48, 'The rush stops at the marker and leaves the back open.', 110, 22)],
  ] },
  L048: { phases: [
    [move('Javelin', THRUST, 42, 36, 'Arm raised: the javelin follows the marked line. Cross underneath after it flies.', 120, 10)],
    [move('Javelin', THRUST, 42, 12, 'Javelin…', 120, 10), move('Lunging sweep', SWEEP, 36, 36, '…then a lunging sweep. Use the high platform.')],
    [move('Javelin', THRUST, 42, 10, 'First throw.', 120, 10), move('Javelin', THRUST, 36, 54, 'Second throw, then a long exposed recovery.', 120, 10)],
  ] },
  L054: { phases: [
    [move('Shield rush', RUSH, 42, 36, 'Flag raised: a shield rush down the locked lane. Jump behind.', 120, 22)],
    [move('Shield rush', RUSH, 42, 30, 'Shield rush.', 120, 22), move('Overhead slam', LANE, 42, 36, 'A different lane is marked for the slam.', 140)],
    [move('Shield rush', RUSH, 42, 12, 'Rush…', 120, 22), move('Overhead slam', LANE, 42, 48, '…slam. A 48-tick opening follows.', 140)],
  ] },
  L059: { phases: [
    [move('Cross-court thrust', THRUST, 42, 36, 'Shoulder drawn: a straight thrust down the locked lane. Dodge late.')],
    [move('Cross-court thrust', THRUST, 42, 30, 'Thrust.'), move('Shield sweep', SWEEP, 36, 36, 'A low shield sweep. Use the upper ledge.')],
    [move('Thrust', THRUST, 42, 12, 'Thrust…'), move('Shield sweep', SWEEP, 36, 48, '…sweep, then 48 ticks to punish.')],
  ] },
};
