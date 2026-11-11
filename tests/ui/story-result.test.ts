import test from 'node:test';
import assert from 'node:assert/strict';
import { storyResult, formatTime } from '../../apps/game/src/ui/story-result.ts';

const level = { number: 12, title: 'Water at the Well', kind: 'carry', combatEnabled: false, nextLevel: 'L013' };

test('a finished level names the level, tasks, time, difficulty and medal', () => {
  const r = storyResult({ level, complete: true, difficulty: 'hard', ticks: 60 * 125, tasksDone: 3, tasksTotal: 3, previousBest: undefined });
  assert.equal(r.title, 'Level 12 · Water at the Well');
  assert.equal(r.lines[0], '3 of 3 tasks · Time 2:05 · Hard');
  assert.equal(r.medal, 'silver');
  assert.ok(r.lines.includes('The next level is open.'));
});

test('beating your best difficulty is called out; repeating it is not', () => {
  assert.equal(storyResult({ level, complete: true, difficulty: 'extreme', ticks: 600, tasksDone: 3, tasksTotal: 3, previousBest: 'easy' }).newBest, true);
  assert.match(storyResult({ level, complete: true, difficulty: 'extreme', ticks: 600, tasksDone: 3, tasksTotal: 3, previousBest: 'easy' }).lines.join(' '), /new best/);
  assert.equal(storyResult({ level, complete: true, difficulty: 'easy', ticks: 600, tasksDone: 3, tasksTotal: 3, previousBest: 'hard' }).newBest, false);
});

test('witness levels never mention difficulty or a new best', () => {
  const r = storyResult({ level: { ...level, number: 84, kind: 'witness', nextLevel: null }, complete: true, difficulty: 'extreme', ticks: 600, tasksDone: 4, tasksTotal: 4, previousBest: 'easy' });
  assert.equal(r.medal, 'witness');
  assert.equal(r.newBest, false);
  assert.ok(!/Hard|Easy/.test(r.lines.join(' ')));
  assert.ok(r.lines.includes('The Story Archive is complete.'));
});

test('an unfinished level reassures the player that checkpoint progress is kept', () => {
  const r = storyResult({ level, complete: false, difficulty: 'hard', ticks: 600, tasksDone: 1, tasksTotal: 3, previousBest: undefined });
  assert.equal(r.medal, null);
  assert.match(r.lines[0], /1 of 3 tasks done/);
  assert.equal(formatTime(59), '0:00');
});
