// Temps de jeu par activité (UsageDay.activitySeconds), pour les statistiques d'un enfant. Pur, testé sous Vitest.
import type { UsageDay } from '../storage';

/** Jour local "YYYY-MM-DD" au format de `dayKey` (storage/index.ts), recalculé ici pour rester pur et sans IndexedDB. */
function localDayKey(ms: number): string {
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `day` décalé de `deltaDays` (peut être négatif), même format "YYYY-MM-DD". */
function shiftDayKey(day: string, deltaDays: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return localDayKey(date.getTime());
}

/** Secondes actives par activité (ActivityId de src/socle/app/session.ts), pour une période. */
export type ActivityTotals = Record<string, number>;

export interface ActivityTimeSummary {
  /** Secondes actives par activité, aujourd'hui (`dayKey()`). */
  today: ActivityTotals;
  /** Secondes actives par activité, sur les 7 derniers jours (aujourd'hui et les 6 précédents). */
  week: ActivityTotals;
}

/**
 * Temps par activité (docs/specs/HUB.md §5.5) : les secondes non ventilées de chaque jour
 * (`activeSeconds` − somme de `activitySeconds`, jamais négatif) sont ajoutées à `map` (la Carte),
 * puisqu'avant la v2 seuls la carte et les parties de niveaux étaient comptés.
 */
export function summarizeActivityTime(days: readonly UsageDay[], today: string): ActivityTimeSummary {
  const weekKeys = new Set(Array.from({ length: 7 }, (_, i) => shiftDayKey(today, -i)));
  const byDay = new Map(days.map((d) => [d.day, d]));

  function accumulate(dayKeys: Iterable<string>): ActivityTotals {
    const totals: ActivityTotals = {};
    for (const key of dayKeys) {
      const usage = byDay.get(key);
      if (!usage) continue;
      const activitySeconds = usage.activitySeconds ?? {};
      let ventilated = 0;
      for (const [activity, seconds] of Object.entries(activitySeconds)) {
        totals[activity] = (totals[activity] ?? 0) + seconds;
        ventilated += seconds;
      }
      const remainder = Math.max(0, usage.activeSeconds - ventilated);
      totals.map = (totals.map ?? 0) + remainder;
    }
    return totals;
  }

  return { today: accumulate([today]), week: accumulate(weekKeys) };
}
