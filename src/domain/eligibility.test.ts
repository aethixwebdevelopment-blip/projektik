import { describe, expect, it } from 'vitest';
import { demoExercises } from '../data/demo-exercises';
import { demoProfile } from '../data/demo-profiles';
import type { MovementProfile, SessionContext } from './types';
import { checkEligibility } from './eligibility';
import { buildWorkout, explainSwap, findSwaps } from './workout-generator';

const context: SessionContext = { goal: 'strength', environment: 'doma', equipment: ['odporova-guma'], space: 'small', durationMinutes: 20, preferredPosition: 'v-sede', dailyRestrictedMovements: [], demoMode: true };
const profile = (): MovementProfile => structuredClone(demoProfile);

describe('tvrdý filter vhodnosti', () => {
  it('neodporučí cvik s nedostupným povinným pohybom', () => {
    const person = profile(); person.availableMovements = [];
    expect(checkEligibility(demoExercises[0], person, context).eligible).toBe(false);
  });
  it('nepovažuje neznámu schopnosť za potvrdenú', () => {
    const person = profile(); person.limbCapabilities['ruka-prava'] = 'unknown';
    expect(checkEligibility(demoExercises[0], person, context)).toMatchObject({ eligible: false, reasons: ['schopnost-nie-je-potvrdena'] });
  });
  it('vylúči chýbajúcu pomôcku', () => {
    const person = profile();
    expect(checkEligibility(demoExercises[0], person, { ...context, equipment: [] })).toMatchObject({ eligible: false, reasons: ['chyba-pomocka'] });
  });
  it('vylúči cvik v nepodporovanej polohe', () => {
    const person = profile(); person.supportedPositions = ['v-stoje'];
    expect(checkEligibility(demoExercises[0], person, context).eligible).toBe(false);
  });
  it('vylúči cvik s nevyriešenou bezpečnostnou neistotou', () => {
    expect(checkEligibility({ ...demoExercises[0], safetyUncertainty: true }, profile(), context)).toMatchObject({ eligible: false, reasons: ['nevyriesena-bezpecnostna-nejistota'] });
  });
  it('vylúči cvik, ktorý vyžaduje nepovolený presun', () => {
    const person = profile(); person.positionTransitionConstraints = ['bez-presunu'];
    expect(checkEligibility({ ...demoExercises[0], transitionRequirement: 'zmena-polohy' }, person, context)).toMatchObject({ eligible: false, reasons: ['cvik-vyzaduje-nepotvrdeny-presun'] });
  });
  it('neodporúča demo obsah v produkčnom režime', () => {
    expect(checkEligibility(demoExercises[0], profile(), { ...context, demoMode: false })).toMatchObject({ eligible: false, reasons: ['obsah-nie-je-schvaleny-pre-rezim'] });
  });
  it('nepovolí schválený ani demo cvik označený ako zamietnutý', () => {
    expect(checkEligibility({ ...demoExercises[0], reviewStatus: 'rejected' }, profile(), context).eligible).toBe(false);
  });
  it('denné obmedzenie vyradí pohyb iba pre túto kontrolu', () => {
    expect(checkEligibility(demoExercises[0], profile(), { ...context, dailyRestrictedMovements: ['tlak-rukou'] }).eligible).toBe(false);
    expect(checkEligibility(demoExercises[0], profile(), context).eligible).toBe(true);
  });
});

describe('návrh a SMART SWAP', () => {
  it('swap zachová všeobecný cieľ, ak je dostupná vhodná alternatíva', () => {
    const alternatives = findSwaps(demoExercises, profile(), context, demoExercises[0]);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.every((item) => item.goals.includes('strength'))).toBe(true);
  });
  it('swap neponúkne cvik, ktorý je už v tomto návrhu', () => {
    const source = demoExercises[0];
    const candidates = findSwaps(demoExercises, profile(), context, source, [], [demoExercises[1].id]);
    expect(candidates.some((item) => item.id === demoExercises[1].id)).toBe(false);
  });
  it('bez kandidátov oznámi, že nemá vhodnú alternatívu', () => {
    const result = buildWorkout(demoExercises, { ...profile(), availableMovements: [], limbCapabilities: {} }, context);
    expect(findSwaps(demoExercises, { ...profile(), availableMovements: [], limbCapabilities: {} }, context, demoExercises[0])).toEqual([]);
    expect(result.empty).toBe(true);
    expect(result.explanation).toContain('Momentálne nemáme vhodnú');
  });
  it('vysvetlenie swapu uvádza pravidlá a upozorňuje na demo stav', () => {
    const alternative = findSwaps(demoExercises, profile(), context, demoExercises[0])[0];
    const explanation = explainSwap(alternative, demoExercises[0], profile(), context);
    expect(explanation).toContain('rovnaký všeobecný cieľ');
    expect(explanation).toContain('kontrolou použitých pravidiel vhodnosti');
    expect(explanation).toContain('Neznamená to, že je odborne');
  });
  it('vysvetlenie cieľa a poradia je stabilné pri rovnakom vstupe', () => {
    const first = buildWorkout(demoExercises, profile(), context);
    const second = buildWorkout(demoExercises, profile(), context);
    expect(first.exercises.map((item) => item.id)).toEqual(second.exercises.map((item) => item.id));
    expect(first.explanation).toBe(second.explanation);
  });
  it('spätná väzba neobíde tvrdé pravidlá a swap ponúkne iba dostupné možnosti', () => {
    const noEquipment = { ...context, equipment: [] };
    expect(checkEligibility(demoExercises[0], profile(), noEquipment).eligible).toBe(false);
    const alternatives = findSwaps(demoExercises, profile(), noEquipment, demoExercises[0]);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.every((item) => checkEligibility(item, profile(), noEquipment).eligible)).toBe(true);
    expect(alternatives.every((item) => item.requiredEquipment.length === 0)).toBe(true);
  });
});
