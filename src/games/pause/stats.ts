// Statistiques parent des pauses de révision (docs/specs/PAUSES-REVISION.md §3). Pur, testé sous Vitest.
import { isPauseRecord, type ReadingRecord } from '../../socle/storage/readings';

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Signaux « pause difficile » listés au parent, du plus récent au plus ancien. */
export const MAX_HARD_SIGNALS = 10;

export interface PauseStats {
  /** Pauses terminées ces 7 derniers jours. */
  doneThisWeek: number;
  /** Réponses à la « première question » (graphème maîtrisé tiré au hasard) ces 7 derniers jours. */
  firstQuestions: number;
  /** Dont justes du premier coup. */
  firstCorrect: number;
  /** Taux de réussite de la première question, ou null s'il n'y en a pas encore. */
  firstRate: number | null;
  /** Pauses terminées au 3e échec : instants (ms), du plus récent au plus ancien. */
  hardAt: number[];
}

export function pauseRecords(records: readonly ReadingRecord[]): ReadingRecord[] {
  return records.filter(isPauseRecord);
}

/** Instant d'une pause : sa fin, sinon son début. */
function pauseAt(record: ReadingRecord): number {
  return record.endedAt ?? record.startedAt;
}

export function summarizePauses(records: readonly ReadingRecord[], now: number): PauseStats {
  const pauses = pauseRecords(records);
  const recent = pauses.filter((r) => now - pauseAt(r) < WEEK_MS);
  const answers = recent.flatMap((r) => r.answers).filter((a) => a.retention === true && !a.retry);
  const firstCorrect = answers.filter((a) => a.correct).length;
  const hardAt = pauses
    .filter((r) => r.hard === true)
    .map(pauseAt)
    .sort((a, b) => b - a)
    .slice(0, MAX_HARD_SIGNALS);
  return {
    doneThisWeek: recent.filter((r) => r.status === 'completed').length,
    firstQuestions: answers.length,
    firstCorrect,
    firstRate: answers.length > 0 ? firstCorrect / answers.length : null,
    hardAt,
  };
}
