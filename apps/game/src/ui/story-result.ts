// Story results card: what the player achieved in this level, in plain words.

import { medalFor } from '../storage/profile.ts';

export interface StoryResultInput {
  level: { number: number; title: string; kind: string; combatEnabled: boolean; nextLevel: string | null };
  complete: boolean;
  difficulty: string;
  ticks: number;
  tasksDone: number;
  tasksTotal: number;
  /** Best difficulty finished before this run (undefined if never). */
  previousBest: string | undefined;
}
export interface StoryResult { title: string; lines: string[]; medal: string | null; newBest: boolean }

const DIFFICULTY_NAMES: Record<string, string> = { easy: 'Easy', hard: 'Hard', extreme: 'Extremely Hard' };
const RANK = ['easy', 'hard', 'extreme'];

export function formatTime(ticks: number): string {
  const s = Math.max(0, Math.floor(ticks / 60));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function storyResult(r: StoryResultInput): StoryResult {
  const name = `Level ${r.level.number} · ${r.level.title}`;
  const tasks = r.tasksTotal ? `${r.tasksDone} of ${r.tasksTotal} tasks` : null;
  if (!r.complete) {
    return { title: name, medal: null, newBest: false,
      lines: [tasks ? `${tasks} done. Your progress up to the last checkpoint is kept.` : 'Your progress up to the last checkpoint is kept.', 'Retry from the checkpoint whenever you are ready.'] };
  }
  const medal = medalFor(r.level, r.difficulty);
  const newBest = r.level.kind !== 'witness' && RANK.indexOf(r.difficulty) > RANK.indexOf(r.previousBest ?? '');
  const lines = [
    [tasks, `Time ${formatTime(r.ticks)}`, r.level.kind === 'witness' ? null : DIFFICULTY_NAMES[r.difficulty] ?? r.difficulty].filter(Boolean).join(' · '),
  ];
  if (medal) lines.push(newBest && r.previousBest ? `${medal.label} — a new best for this level.` : medal.label);
  if (r.level.number === 84) lines.push('The Story Archive is complete.');
  else if (r.level.nextLevel) lines.push('The next level is open.');
  return { title: name, lines, medal: medal?.tier ?? null, newBest };
}
