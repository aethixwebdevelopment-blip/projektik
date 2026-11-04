import type { Exercise, FeedbackRecord, SessionContext } from './types';

const WEIGHTS = { goal: 10, targetArea: 4, position: 3, difficulty: 2, feedback: 1 } as const;

export function rankCandidates(candidates: Exercise[], context: SessionContext, target?: Exercise, feedback: FeedbackRecord[] = []): Exercise[] {
  return [...candidates].sort((a, b) => score(b, context, target, feedback) - score(a, context, target, feedback) || a.id.localeCompare(b.id));
}

function score(item: Exercise, context: SessionContext, target?: Exercise, feedback: FeedbackRecord[] = []): number {
  let result = item.goals.includes(target?.goals.find((g) => g === context.goal) ?? context.goal) ? WEIGHTS.goal : 0;
  if (target) result += item.targetAreas.filter((area) => target.targetAreas.includes(area)).length * WEIGHTS.targetArea;
  if (context.preferredPosition && item.supportedPositions.includes(context.preferredPosition)) result += WEIGHTS.position;
  result += (4 - Math.abs(item.difficulty - (context.dailyDifficultyCap ?? target?.difficulty ?? 1))) * WEIGHTS.difficulty;
  result -= feedback.filter((entry) => entry.exerciseId === item.id && ['too-hard', 'uncomfortable', 'cannot-do'].includes(entry.response)).length * WEIGHTS.feedback;
  result += feedback.filter((entry) => entry.exerciseId === item.id && entry.response === 'suitable').length * WEIGHTS.feedback;
  return result;
}
