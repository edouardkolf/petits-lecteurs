import { describe, expect, it } from 'vitest';
import type { UsageDay } from '../storage';
import { summarizeActivityTime } from './stats';

function usageDay(day: string, activeSeconds: number, activitySeconds?: Record<string, number>): UsageDay {
  return { profileId: 'p', day, activeSeconds, extraMinutes: 0, ...(activitySeconds ? { activitySeconds } : {}) };
}

const totalOf = (totals: Record<string, number>): number => Object.values(totals).reduce((sum, v) => sum + v, 0);

describe('summarizeActivityTime', () => {
  it('ventile les secondes du jour, et met le reste non ventilé sur la carte', () => {
    const days = [usageDay('2026-09-28', 600, { hub: 100, coloring: 200 })];
    const result = summarizeActivityTime(days, '2026-09-28');
    expect(result.today).toEqual({ hub: 100, coloring: 200, map: 300 });
    expect(totalOf(result.today)).toBe(600);
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
    expect(totalOf(result.week)).toBe(210);
  });

  it('ignore les jours sans donnée enregistrée', () => {
    const result = summarizeActivityTime([], '2026-09-28');
    expect(result.today).toEqual({});
    expect(result.week).toEqual({});
  });
});
