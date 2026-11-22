// Résumé global (tous niveaux confondus) affiché en tête des statistiques d'un enfant.
// Calcul direct à partir des parties : pas besoin de moteur, donc testable ici sans dépendance.
import type { GameRecordBase, Run, UsageDay } from '../storage';

export interface RunsSummary {
  /** Parties lancées, tous niveaux confondus. */
  totalRuns: number;
  /** Manches réussies du premier coup / manches jouées ; null si aucune manche. */
  firstTryRate: number | null;
  /** Temps de jeu cumulé (somme des durées de manches), en ms. */
  playTimeMs: number;
}

export function summarizeRuns(runs: Run[]): RunsSummary {
  let roundsPlayed = 0;
  let firstTry = 0;
  let playTimeMs = 0;
  for (const run of runs) {
    for (const round of run.rounds) {
      roundsPlayed += 1;
      if (round.firstTry) firstTry += 1;
      playTimeMs += round.durationMs;
    }
  }
  return {
    totalRuns: runs.length,
    firstTryRate: roundsPlayed > 0 ? firstTry / roundsPlayed : null,
    playTimeMs,
  };
}

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

/** Total toutes activités confondues (= somme des `activeSeconds` de la période, cf. §5.5). */
export function totalActivitySeconds(totals: ActivityTotals): number {
  return Object.values(totals).reduce((sum, seconds) => sum + seconds, 0);
}

export interface GameRecordsSummary {
  /** Enregistrements du jeu, tous statuts, y compris en cours. */
  total: number;
  /** `status = 'completed'`. */
  completed: number;
  /** `endReason` vaut `quit` ou `closed`. */
  abandoned: number;
  /** `endReason = 'time-up'` ; ce ne sont pas des abandons. */
  interrupted: number;
  /** Somme des `activeMs`. */
  activeMs: number;
  /** Jours locaux distincts, parmi aujourd'hui et les 6 précédents, où au moins une partie a commencé. */
  daysPlayedInWeek: number;
  /** `startedAt` le plus récent ; null si aucune partie. */
  lastPlayedAt: number | null;
}

/** Indicateurs communs d'un jeu (docs/specs/HUB.md §5.5), à partir de ses enregistrements et de l'instant courant. */
export function summarizeGameRecords(records: readonly GameRecordBase[], now: number): GameRecordsSummary {
  const today = localDayKey(now);
  const weekKeys = new Set(Array.from({ length: 7 }, (_, i) => shiftDayKey(today, -i)));
  let completed = 0;
  let abandoned = 0;
  let interrupted = 0;
  let activeMs = 0;
  let lastPlayedAt: number | null = null;
  const daysPlayed = new Set<string>();
  for (const record of records) {
    if (record.status === 'completed') completed += 1;
    if (record.endReason === 'quit' || record.endReason === 'closed') abandoned += 1;
    if (record.endReason === 'time-up') interrupted += 1;
    activeMs += record.activeMs;
    if (lastPlayedAt === null || record.startedAt > lastPlayedAt) lastPlayedAt = record.startedAt;
    const day = localDayKey(record.startedAt);
    if (weekKeys.has(day)) daysPlayed.add(day);
  }
  return {
    total: records.length,
    completed,
    abandoned,
    interrupted,
    activeMs,
    daysPlayedInWeek: daysPlayed.size,
    lastPlayedAt,
  };
}
