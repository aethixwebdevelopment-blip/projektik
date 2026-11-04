import type { MovementProfile } from '../domain/types';

export const demoProfile: MovementProfile = {
  id: 'demo-samo', displayName: 'Demo profil',
  availableMovements: ['tlak-rukou', 'tah-rukou', 'otocenie-trupu', 'dosah-rukou'],
  restrictedMovements: [],
  limbCapabilities: { 'ruka-lava': 'available', 'ruka-prava': 'available', 'noha-lava': 'unknown', 'noha-prava': 'unknown', 'kontrola-trupu': 'available' },
  supportedPositions: ['v-sede'], positionTransitionConstraints: ['minimizovat-presuny'],
  equipmentAvailable: ['odporova-guma'], environments: ['doma'], preferredDurationMinutes: 20,
  accessibility: { largeText: false, reducedMotion: false, reducedTransparency: false, audioInstructions: false, captions: true, highContrast: false },
  updatedAt: '2026-11-04T00:00:00.000Z',
};
