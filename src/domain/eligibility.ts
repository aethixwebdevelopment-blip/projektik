import type { Exercise, MovementProfile, SessionContext } from './types';

export type EligibilityResult = { eligible: true; reasons: string[] } | { eligible: false; reasons: string[] };

/** Hard safety/fit filters run before ranking. A better score can never restore a rejected item. */
export function checkEligibility(exercise: Exercise, profile: MovementProfile, context: SessionContext): EligibilityResult {
  const failures: string[] = [];
  if (context.demoMode ? exercise.reviewStatus !== 'demo' && exercise.reviewStatus !== 'approved' : exercise.reviewStatus !== 'approved') {
    failures.push('obsah-nie-je-schvaleny-pre-rezim');
  }
  if (exercise.reviewStatus === 'rejected') failures.push('obsah-je-zamietnuty');
  if (exercise.safetyUncertainty) failures.push('nevyriesena-bezpecnostna-nejistota');
  const unavailable = exercise.requiredMovements.some((movement) =>
    !profile.availableMovements.includes(movement) || profile.restrictedMovements.includes(movement) || context.dailyRestrictedMovements.includes(movement),
  );
  if (unavailable) failures.push('pohyb-nie-je-potvrdeny-alebo-je-obmedzeny');
  const capabilityMissing = exercise.requiredCapabilities.some((capability) => profile.limbCapabilities[capability] !== 'available');
  if (capabilityMissing) failures.push('schopnost-nie-je-potvrdena');
  if (!exercise.supportedPositions.some((position) => profile.supportedPositions.includes(position))) failures.push('nevyhovujuca-poloha');
  if (profile.positionTransitionConstraints.includes('bez-presunu') && exercise.transitionRequirement !== 'bez-presunu') failures.push('cvik-vyzaduje-nepotvrdeny-presun');
  if (!context.environment || !exercise.allowedEnvironments.includes(context.environment) || !profile.environments.includes(context.environment)) failures.push('nevyhovujuce-prostredie');
  if (!exercise.requiredEquipment.every((item) => profile.equipmentAvailable.includes(item) && context.equipment.includes(item))) failures.push('chyba-pomocka');
  const size = { small: 1, medium: 2, large: 3 } as const;
  if (size[exercise.spaceRequirement] > size[context.space]) failures.push('nedostatok-priestoru');
  if (context.dailyDifficultyCap && exercise.difficulty > context.dailyDifficultyCap) failures.push('dnesna-narocnost-je-prilis-vysoka');
  return failures.length ? { eligible: false, reasons: failures } : { eligible: true, reasons: ['pohyb-aj schopnosti sú potvrdené', 'poloha, prostredie a pomôcky vyhovujú'] };
}
