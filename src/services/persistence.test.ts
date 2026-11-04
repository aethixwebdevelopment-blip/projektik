import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoProfile } from '../data/demo-profiles';
import { clearDemoData, loadHistory, loadProfile, saveFeedback, saveProfile, saveSession } from './persistence';

const values = new Map<string, string>();
let storage: Storage;

beforeEach(() => {
  values.clear();
  storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => vi.unstubAllGlobals());

describe('lokálne uloženie', () => {
  it('doplní chýbajúce polia staršieho profilu bezpečnými predvolenými hodnotami', () => {
    values.set('move4all:profile:v1', JSON.stringify({ id: 'old-profile', displayName: 'Alex', accessibility: { largeText: true }, availableMovements: ['tlak-rukou'] }));
    const profile = loadProfile();
    expect(profile.id).toBe('old-profile');
    expect(profile.displayName).toBe('Alex');
    expect(profile.accessibility).toMatchObject({ largeText: true, reducedTransparency: false, captions: true });
    expect(profile.limbCapabilities['ruka-prava']).toBe('available');
    expect(profile.environments).toEqual(demoProfile.environments);
  });

  it('poškodený JSON profilu bezpečne nahradí demo profilom', () => {
    values.set('move4all:profile:v1', '{broken');
    expect(loadProfile()).toMatchObject({ id: demoProfile.id, displayName: demoProfile.displayName });
  });

  it('odfiltruje chybné záznamy histórie a ich neplatnú spätnú väzbu', () => {
    values.set('move4all:history:v1', JSON.stringify([
      { id: 'valid', date: '2026-11-04T10:00:00.000Z', goal: 'strength', exerciseIds: ['band-press'], durationMinutes: 4, feedback: [{ exerciseId: 'band-press', response: 'suitable', createdAt: '2026-11-04T10:00:00.000Z' }, { response: 'broken' }] },
      { id: 4, date: '', goal: 'other', exerciseIds: [], durationMinutes: NaN, feedback: [] },
    ]));
    expect(loadHistory()).toMatchObject([{ id: 'valid', feedback: [{ response: 'suitable' }] }]);
  });

  it('vráti neúspech namiesto výnimky, ak prehliadač blokuje zápis alebo mazanie', () => {
    vi.stubGlobal('localStorage', { ...storage, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } });
    expect(saveProfile(demoProfile)).toBe(false);
    expect(saveSession({ id: 's', date: '2026-11-04', goal: 'strength', exerciseIds: ['band-press'], durationMinutes: 4, feedback: [] })).toBe(false);
    expect(saveFeedback({ exerciseId: 'band-press', response: 'suitable', createdAt: '2026-11-04' })).toBe(false);
    expect(clearDemoData()).toBe(false);
  });
});
