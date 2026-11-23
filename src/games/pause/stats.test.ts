// Statistiques parent des pauses (docs/specs/PAUSES-REVISION.md §3).
import { describe, expect, it } from 'vitest';
import type { ReadingRecord } from '../../socle/storage/readings';
import type { ReadingAnswer } from '../reading/types';
import { MAX_HARD_SIGNALS, WEEK_MS, summarizePauses } from './stats';

const NOW = new Date(2026, 10, 25, 12, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;

function answer(over: Partial<ReadingAnswer> = {}): ReadingAnswer {
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
    at: NOW,
    ...over,
  };
}

let n = 0;
function pause(over: Partial<ReadingRecord> & { answers?: ReadingAnswer[] } = {}): ReadingRecord {
  n += 1;
  return {
    id: `p${n}`,
    profileId: 'p',
    startedAt: NOW - 60_000,
    endedAt: NOW,
    status: 'completed',
    endReason: null,
    activeMs: 30_000,
    stage: 2,
    planned: 3,
    newItemId: null,
    demos: [],
    answers: [],
    review: false,
    context: 'pause',
    ...over,
  };
}

describe('summarizePauses', () => {
  it('rien : aucun chiffre, pas de signal', () => {
    expect(summarizePauses([], NOW)).toEqual({ doneThisWeek: 0, firstQuestions: 0, firstCorrect: 0, firstRate: null, hardAt: [] });
  });

  it('compte les pauses de la semaine et ignore les séances d\'aventure', () => {
    const adventure = pause({ context: undefined, levelId: 'l1' });
    const records = [pause(), pause({ endedAt: NOW - 3 * DAY }), pause({ endedAt: NOW - WEEK_MS - DAY }), adventure];
    expect(summarizePauses(records, NOW).doneThisWeek).toBe(2);
  });

  it('taux de la première question : seulement les réponses `retention` du premier coup', () => {
    const records = [
      pause({ answers: [answer({ retention: true }), answer({ correct: true })] }),
      pause({ answers: [answer({ retention: true, correct: false, chosen: 'i' }), answer({ retention: true, retry: true })] }),
      pause({ answers: [answer({ retention: true })] }),
    ];
    const stats = summarizePauses(records, NOW);
    expect(stats.firstQuestions).toBe(3);
    expect(stats.firstCorrect).toBe(2);
    expect(stats.firstRate).toBeCloseTo(2 / 3);
  });

  it('liste les « pauses difficiles » avec leur heure, la plus récente d\'abord', () => {
    const early = pause({ hard: true, endedAt: NOW - 2 * DAY });
    const late = pause({ hard: true, endedAt: NOW - 1000 });
    const stats = summarizePauses([early, pause(), late], NOW);
    expect(stats.hardAt).toEqual([NOW - 1000, NOW - 2 * DAY]);
    expect(summarizePauses(Array.from({ length: 15 }, (_, i) => pause({ hard: true, endedAt: NOW - i * 1000 })), NOW).hardAt).toHaveLength(
      MAX_HARD_SIGNALS,
    );
  });
});
