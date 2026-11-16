// Public entry point of the story campaign package: create a campaign and the level data.

export { createCampaign } from './controller.ts';
export type { CampaignApi, Scene, Marker, Hazard, Checkpoint, Card, Stage, ScenePhase } from './controller.ts';
export { LEVEL_SPECS, SUMMARIES, CHAPTER_COLORS } from './specs.ts';
export { BOSS_SCRIPTS } from './bosses.ts';
export type { LevelSpec, TaskType } from './specs.ts';
