// Les réponses d'une pause ne comptent ni pour le parcours de niveaux ni pour la maîtrise (PAUSES-REVISION.md §3),
// et le format reste importable (export v5 : champs optionnels).
import { describe, expect, it } from 'vitest';
import { isPauseRecord, isPauseSettings, isReadingRecord, type ReadingRecord } from '../../socle/storage/readings';
import { levelProgress, LEVELS } from '../reading/levels';
import { computeProgress } from '../reading/progress';
import { summarizeReading } from '../reading/stats';
import type { ReadingAnswer } from '../reading/types';

const AT = new Date(2026, 0, 5, 10, 0).getTime();
const day = (d: number) => AT + d * 24 * 60 * 60 * 1000;

function answer(at: number, over: Partial<ReadingAnswer> = {}): ReadingAnswer {
  return {
    itemId: 'g:a',
    game: 'letter-sound',
    target: 'a',
    correct: true,
    chosen: null,
    choiceCount: 2,
    replays: 0,
    hinted: false,
    retry: false,
    ms: 1000,
    at,
    ...over,
  };
}

function record(over: Partial<ReadingRecord>): ReadingRecord {
  return {
    id: `r${Math.random()}`,
    profileId: 'p',
    startedAt: AT,
    endedAt: AT + 1000,
    status: 'completed',
    endReason: null,
    activeMs: 1000,
    stage: 2,
    planned: 5,
    newItemId: null,
    demos: [],
    answers: [],
    review: false,
    ...over,
  };
}

/** Cinq réponses justes chaque jour pendant 3 jours : 'g:a' serait acquis si les réponses comptaient. */
function pauseRecords(): ReadingRecord[] {
  return [0, 1, 2].map((d) =>
    record({
      startedAt: day(d),
      endedAt: day(d) + 5000,
      context: 'pause',
      planned: 3,
      answers: [answer(day(d) + 1000, { retention: true }), answer(day(d) + 2000), answer(day(d) + 3000)],
    }),
  );
}

describe('une pause n\'est pas une séance d\'aventure', () => {
  it('isPauseRecord', () => {
    expect(isPauseRecord(record({ context: 'pause' }))).toBe(true);
    expect(isPauseRecord(record({}))).toBe(false);
  });

  it('computeProgress : aucune réponse de pause ne fait avancer la maîtrise ni le compteur de séances', () => {
    const progress = computeProgress(pauseRecords());
    expect(progress.items['g:a']?.state).toBe('new');
    expect(progress.items['g:a']?.seen).toBe(0);
    expect(progress.sessionsCompleted).toBe(0);
  });

  it('en revanche les démonstrations vues pendant une pause comptent', () => {
    const progress = computeProgress([record({ context: 'pause', demos: ['same-start'] })]);
    expect(progress.demosDone).toEqual(['same-start']);
  });

  it('levelProgress : une pause, même avec un levelId, ne gagne jamais de niveau', () => {
    const level = LEVELS[0]!;
    const full = record({
      levelId: level.id,
      context: 'pause',
      planned: 5,
      answers: Array.from({ length: 5 }, (_, i) => answer(AT + i * 1000)),
    });
    expect(levelProgress([full]).passed.has(level.id)).toBe(false);
    expect(levelProgress([{ ...full, context: undefined }]).passed.has(level.id)).toBe(true);
  });

  it('les statistiques de l\'aventure ignorent les pauses', () => {
    const adventure = summarizeReading(pauseRecords(), undefined, day(4));
    expect(adventure.sessionsCompleted).toBe(0);
    expect(adventure.alerts).toEqual([]);
    expect(adventure.items.find((i) => i.itemId === 'g:a')?.seen).toBe(0);
  });
});

describe('validation à l\'import (export v5 compatible)', () => {
  it('accepte `context: pause`, `hard`, `retention`', () => {
    const base = record({ context: 'pause', hard: true, answers: [answer(AT, { retention: true })] });
    expect(isReadingRecord(base)).toBe(true);
    // les séances d'avant (sans les champs) restent valides
    expect(isReadingRecord(record({ answers: [answer(AT)] }))).toBe(true);
  });

  it('refuse des valeurs hors format', () => {
    expect(isReadingRecord({ ...record({}), context: 'jeu' })).toBe(false);
    expect(isReadingRecord({ ...record({}), hard: 'oui' })).toBe(false);
    expect(isReadingRecord(record({ answers: [{ ...answer(AT), retention: 'oui' } as unknown as ReadingAnswer] }))).toBe(false);
  });

  it('réglage des pauses : intervalles 3, 5, 10 et booléen', () => {
    expect(isPauseSettings({})).toBe(true);
    expect(isPauseSettings({ enabled: false, intervalMin: 10 })).toBe(true);
    expect(isPauseSettings({ intervalMin: 3 })).toBe(true);
    expect(isPauseSettings({ intervalMin: 4 })).toBe(false);
    expect(isPauseSettings({ enabled: 'non' })).toBe(false);
    expect(isPauseSettings(null)).toBe(false);
  });
});
