import type { Exercise, FeedbackRecord, MovementProfile, SessionContext } from './types';
import { checkEligibility } from './eligibility';
import { rankCandidates } from './ranking';

export function buildWorkout(exercises: Exercise[], profile: MovementProfile, context: SessionContext, feedback: FeedbackRecord[] = []) {
  const eligible = exercises.filter((item) => item.goals.includes(context.goal) && checkEligibility(item, profile, context).eligible);
  const ranked = rankCandidates(eligible, context, undefined, feedback);
  const count = Math.max(1, Math.min(5, Math.ceil(context.durationMinutes / 8)));
  const selected = ranked.slice(0, count);
  return {
    exercises: selected,
    empty: selected.length === 0,
    explanation: selected.length
      ? 'Najprv sme ponechali cviky pre vybraný cieľ a potvrdené podmienky. Potom sme ich zoradili podľa pohodlnej polohy, náročnosti a tvojej predchádzajúcej spätnej väzby.'
      : 'Momentálne nemáme vhodnú ukážkovú aktivitu pre tvoj profil, vybraný cieľ a dnešné podmienky. Skús upraviť tréning alebo pohybový profil.',
  };
}

export function findSwaps(exercises: Exercise[], profile: MovementProfile, context: SessionContext, source: Exercise, feedback: FeedbackRecord[] = [], excludedIds: string[] = []) {
  const candidates = exercises.filter((item) => item.id !== source.id && !excludedIds.includes(item.id) && item.goals.some((goal) => source.goals.includes(goal)) && checkEligibility(item, profile, context).eligible);
  return rankCandidates(candidates, context, source, feedback);
}

export function explainSwap(candidate: Exercise, source: Exercise, profile: MovementProfile, context: SessionContext): string {
  const rules = checkEligibility(candidate, profile, context);
  const reasons = [];
  if (candidate.goals.some((goal) => source.goals.includes(goal))) reasons.push('má rovnaký všeobecný cieľ');
  if (candidate.supportedPositions.some((position) => profile.supportedPositions.includes(position))) reasons.push('vyhovuje potvrdená poloha');
  if (!candidate.requiredEquipment.length) reasons.push('nepotrebuje ďalšiu pomôcku');
  else if (candidate.requiredEquipment.every((item) => profile.equipmentAvailable.includes(item) && context.equipment.includes(item))) reasons.push('potrebné pomôcky máš k dispozícii');
  if (rules.eligible) reasons.push('prešla kontrolou použitých pravidiel vhodnosti');
  return `Tento variant sme vybrali, pretože ${reasons.join(', ')}. Neznamená to, že je odborne alebo fyziologicky rovnocenný.`;
}
