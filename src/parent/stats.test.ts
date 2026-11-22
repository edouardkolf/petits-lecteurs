import { describe, expect, it } from 'vitest';
import type { GameRecordBase, Run, UsageDay } from '../storage';
import {
  summarizeActivityTime,
  summarizeGameRecords,
  summarizeRuns,
  totalActivitySeconds,
} from './stats';

function run(rounds: Run['rounds'], levelId = 'l'): Run {
  return {
    id: 'r',
    profileId: 'p',
    levelId,
    trackId: 't',
    startedAt: 0,
    endedAt: 1,
    status: 'completed',
    endReason: null,
    replay: false,
    rounds,
    stars: 3,
  };
}

describe('summarizeRuns', () => {
  it('renvoie des zéros et un taux nul sans partie', () => {
    expect(summarizeRuns([])).toEqual({ totalRuns: 0, firstTryRate: null, playTimeMs: 0 });
  });

  it('cumule le temps de jeu et le taux de réussite au premier coup toutes parties confondues', () => {
    const runs = [
      run([
        { index: 0, taps: 1, firstTry: true, durationMs: 1000 },
        { index: 1, taps: 2, firstTry: false, durationMs: 2000 },
      ]),
      run([{ index: 0, taps: 1, firstTry: true, durationMs: 500 }]),
    ];

    const summary = summarizeRuns(runs);

    expect(summary.totalRuns).toBe(2);
    expect(summary.playTimeMs).toBe(3500);
    expect(summary.firstTryRate).toBeCloseTo(2 / 3);
  });
});

/** `n` manches dont `ok` réussies du premier coup, chacune de `ms` millisecondes. */
function rounds(n: number, ok: number, ms = 1000): Run['rounds'] {
  return Array.from({ length: n }, (_, index) => ({
    index,
    taps: index < ok ? 1 : 2,
    firstTry: index < ok,
    durationMs: ms,
  }));
}

function usageDay(day: string, activeSeconds: number, activitySeconds?: Record<string, number>): UsageDay {
  return { profileId: 'p', day, activeSeconds, extraMinutes: 0, ...(activitySeconds ? { activitySeconds } : {}) };
}

describe('summarizeActivityTime', () => {
  it('ventile les secondes du jour, et met le reste non ventilé sur la carte', () => {
    const days = [usageDay('2026-09-28', 600, { hub: 100, coloring: 200 })];
    const result = summarizeActivityTime(days, '2026-09-28');
    expect(result.today).toEqual({ hub: 100, coloring: 200, map: 300 });
    expect(totalActivitySeconds(result.today)).toBe(600);
  });

  it("accepte un jour d'avant la v2 (activitySeconds absent) : tout va à la carte", () => {
    const days = [usageDay('2026-09-28', 400)];
    const result = summarizeActivityTime(days, '2026-09-28');
    expect(result.today).toEqual({ map: 400 });
  });

  it('cumule sur les 7 derniers jours (aujourd’hui et les 6 précédents), sans compter les jours plus anciens', () => {
    const days = [
      usageDay('2026-09-22', 100, { hub: 100 }), // exactement 6 jours avant : inclus
      usageDay('2026-09-21', 999, { hub: 999 }), // 7 jours avant : exclu
      usageDay('2026-09-25', 50, { map: 50 }),
      usageDay('2026-09-28', 60, { coloring: 60 }),
    ];
    const result = summarizeActivityTime(days, '2026-09-28');
    expect(result.week).toEqual({ hub: 100, map: 50, coloring: 60 });
    expect(totalActivitySeconds(result.week)).toBe(210);
  });

  it('ignore les jours sans donnée enregistrée', () => {
    const result = summarizeActivityTime([], '2026-09-28');
    expect(result.today).toEqual({});
    expect(result.week).toEqual({});
  });
});

function gameRecord(startedAt: number, overrides: Partial<GameRecordBase> = {}): GameRecordBase {
  return {
    id: `r-${startedAt}`,
    profileId: 'p',
    startedAt,
    endedAt: startedAt + 1000,
    status: 'completed',
    endReason: null,
    activeMs: 1000,
    ...overrides,
  };
}

describe('summarizeGameRecords', () => {
  const now = new Date(2026, 8, 28, 12, 0, 0).getTime(); // 28/09/2026 midi (heure locale)

  it('renvoie des zéros et une dernière partie nulle sans enregistrement', () => {
    expect(summarizeGameRecords([], now)).toEqual({
      total: 0,
      completed: 0,
      abandoned: 0,
      interrupted: 0,
      activeMs: 0,
      daysPlayedInWeek: 0,
      lastPlayedAt: null,
    });
  });

  it('compte parties, terminées, abandons et interruptions séparément', () => {
    const records = [
      gameRecord(now, { status: 'completed' }),
      gameRecord(now, { status: 'abandoned', endReason: 'quit' }),
      gameRecord(now, { status: 'abandoned', endReason: 'closed' }),
      gameRecord(now, { status: 'abandoned', endReason: 'time-up' }),
      gameRecord(now, { status: 'in_progress', endReason: null }),
    ];
    const summary = summarizeGameRecords(records, now);
    expect(summary.total).toBe(5);
    expect(summary.completed).toBe(1);
    expect(summary.abandoned).toBe(2);
    expect(summary.interrupted).toBe(1);
    expect(summary.activeMs).toBe(5000);
  });

  it('donne la dernière partie (startedAt le plus récent)', () => {
    const older = new Date(2026, 8, 20).getTime();
    const summary = summarizeGameRecords([gameRecord(older), gameRecord(now)], now);
    expect(summary.lastPlayedAt).toBe(now);
  });

  it('compte les jours locaux distincts joués parmi les 7 derniers (aujourd’hui inclus)', () => {
    const today = new Date(2026, 8, 28, 9).getTime();
    const sixDaysAgo = new Date(2026, 8, 22, 9).getTime(); // dans la fenêtre
    const sevenDaysAgo = new Date(2026, 8, 21, 9).getTime(); // hors fenêtre
    const summary = summarizeGameRecords(
      [gameRecord(today), gameRecord(today + 1000), gameRecord(sixDaysAgo), gameRecord(sevenDaysAgo)],
      now,
    );
    expect(summary.daysPlayedInWeek).toBe(2);
  });
});
