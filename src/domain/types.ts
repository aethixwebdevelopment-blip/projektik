export type Goal = 'strength' | 'cardio' | 'mobility';
export type Capability = 'available' | 'limited' | 'unavailable' | 'unknown';
export type ReviewStatus = 'demo' | 'pending' | 'approved' | 'rejected';

export interface MovementProfile {
  id: string;
  displayName: string;
  availableMovements: string[];
  restrictedMovements: string[];
  limbCapabilities: Record<string, Capability>;
  supportedPositions: string[];
  positionTransitionConstraints: string[];
  equipmentAvailable: string[];
  environments: string[];
  preferredDurationMinutes: number;
  accessibility: {
    largeText: boolean;
    reducedMotion: boolean;
    reducedTransparency: boolean;
    audioInstructions: boolean;
    captions: boolean;
    highContrast: boolean;
  };
  updatedAt: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  goals: Goal[];
  targetAreas: string[];
  requiredMovements: string[];
  requiredCapabilities: string[];
  supportedPositions: string[];
  requiredEquipment: string[];
  allowedEnvironments: string[];
  spaceRequirement: 'small' | 'medium' | 'large';
  transitionRequirement: string;
  difficulty: 1 | 2 | 3;
  mediaUrl?: string;
  mediaCaptions?: string;
  safetyUncertainty?: boolean;
  safetyNotes: string[];
  reviewStatus: ReviewStatus;
  contentVersion: number;
}

export interface SessionContext {
  goal: Goal;
  environment: string;
  equipment: string[];
  space: 'small' | 'medium' | 'large';
  durationMinutes: number;
  preferredPosition?: string;
  dailyRestrictedMovements: string[];
  dailyDifficultyCap?: 1 | 2 | 3;
  demoMode: boolean;
}

export interface FeedbackRecord {
  exerciseId: string;
  response: 'suitable' | 'too-hard' | 'too-easy' | 'uncomfortable' | 'cannot-do' | 'another';
  createdAt: string;
}

export interface CompletedSession {
  id: string;
  date: string;
  goal: Goal;
  exerciseIds: string[];
  durationMinutes: number;
  feedback: FeedbackRecord[];
}
