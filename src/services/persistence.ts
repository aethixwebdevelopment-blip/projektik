import { demoProfile } from '../data/demo-profiles';
import type { CompletedSession, FeedbackRecord, MovementProfile } from '../domain/types';

const PROFILE_KEY = 'move4all:profile:v1';
const HISTORY_KEY = 'move4all:history:v1';
const FEEDBACK_KEY = 'move4all:feedback:v1';

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
const responses = new Set<FeedbackRecord['response']>(['suitable', 'too-hard', 'too-easy', 'uncomfortable', 'cannot-do', 'another']);
const isFeedbackRecord = (item: unknown): item is FeedbackRecord => Boolean(item && typeof item === 'object'
  && typeof (item as FeedbackRecord).exerciseId === 'string' && typeof (item as FeedbackRecord).createdAt === 'string'
  && responses.has((item as FeedbackRecord).response));
function write(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export const loadProfile = (): MovementProfile => {
  const saved = read<Partial<MovementProfile> | null>(PROFILE_KEY, null);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return structuredClone(demoProfile);
  const fallback = demoProfile;
  const accessibility: Partial<MovementProfile['accessibility']> = saved.accessibility && typeof saved.accessibility === 'object' ? saved.accessibility : {};
  const capabilities = saved.limbCapabilities && typeof saved.limbCapabilities === 'object' ? saved.limbCapabilities : {};
  const validCapability = (value: unknown) => value === 'available' || value === 'limited' || value === 'unavailable' || value === 'unknown';
  const safeCapabilities = Object.fromEntries(Object.entries(fallback.limbCapabilities).map(([key, defaultValue]) => [key, validCapability(capabilities[key]) ? capabilities[key] : defaultValue]));
  const safeDuration = typeof saved.preferredDurationMinutes === 'number' && Number.isFinite(saved.preferredDurationMinutes)
    ? Math.max(10, Math.min(40, Math.round(saved.preferredDurationMinutes / 5) * 5))
    : fallback.preferredDurationMinutes;
  return {
    ...fallback,
    ...saved,
    id: typeof saved.id === 'string' ? saved.id : fallback.id,
    displayName: typeof saved.displayName === 'string' ? saved.displayName : fallback.displayName,
    availableMovements: isStringArray(saved.availableMovements) ? saved.availableMovements : [...fallback.availableMovements],
    restrictedMovements: isStringArray(saved.restrictedMovements) ? saved.restrictedMovements : [...fallback.restrictedMovements],
    limbCapabilities: safeCapabilities,
    supportedPositions: isStringArray(saved.supportedPositions) ? saved.supportedPositions : [...fallback.supportedPositions],
    positionTransitionConstraints: isStringArray(saved.positionTransitionConstraints) ? saved.positionTransitionConstraints : [...fallback.positionTransitionConstraints],
    equipmentAvailable: isStringArray(saved.equipmentAvailable) ? saved.equipmentAvailable : [...fallback.equipmentAvailable],
    environments: isStringArray(saved.environments) ? saved.environments : [...fallback.environments],
    preferredDurationMinutes: safeDuration,
    accessibility: {
      largeText: accessibility.largeText === true,
      reducedMotion: accessibility.reducedMotion === true,
      reducedTransparency: accessibility.reducedTransparency === true,
      audioInstructions: accessibility.audioInstructions === true,
      captions: accessibility.captions !== false,
      highContrast: accessibility.highContrast === true,
    },
    updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : fallback.updatedAt,
  };
};
export const saveProfile = (profile: MovementProfile) => write(PROFILE_KEY, profile);
export const loadHistory = (): CompletedSession[] => {
  const history = read<unknown>(HISTORY_KEY, []);
  if (!Array.isArray(history)) return [];
  return history.filter((item): item is CompletedSession => Boolean(item && typeof item === 'object'
    && typeof item.id === 'string' && typeof item.date === 'string'
    && (item.goal === 'strength' || item.goal === 'cardio' || item.goal === 'mobility')
    && isStringArray(item.exerciseIds) && typeof item.durationMinutes === 'number' && Number.isFinite(item.durationMinutes) && Array.isArray(item.feedback)))
    .map((session) => ({ ...session, durationMinutes: Math.max(0, Math.round(session.durationMinutes)), feedback: session.feedback.filter(isFeedbackRecord) }));
};
export const saveSession = (session: CompletedSession) => write(HISTORY_KEY, [session, ...loadHistory()]);
export const loadFeedback = (): FeedbackRecord[] => {
  const feedback = read<unknown>(FEEDBACK_KEY, []);
  if (!Array.isArray(feedback)) return [];
  return feedback.filter(isFeedbackRecord);
};
export const saveFeedback = (record: FeedbackRecord) => write(FEEDBACK_KEY, [...loadFeedback(), record]);
export const clearDemoData = () => {
  try { [PROFILE_KEY, HISTORY_KEY, FEEDBACK_KEY].forEach((key) => localStorage.removeItem(key)); return true; } catch { return false; }
};
