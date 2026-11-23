// Déclenchement des pauses de révision (docs/specs/PAUSES-REVISION.md §2.1). Pur : aucune horloge, aucun stockage.
// Le compteur est le temps actif cumulé dans les mini-jeux depuis la dernière pause, pour l'enfant (changer de jeu
// ne le remet pas à zéro) ; `SessionProvider` l'alimente et le persiste, les écrans de jeu posent la pause à la fin
// de l'unité en cours.
import type { ActivityId } from '../../socle/app/session';
import type { PauseSettingsValue } from '../../socle/storage/readings';

/** Mini-jeux où le temps compte pour la pause (jamais l'aventure ni l'accueil). */
export const PAUSE_ACTIVITIES: readonly ActivityId[] = ['coloring', 'memory', 'order', 'maze', 'robot'];

/** Intervalles proposés au parent (minutes) et défaut. */
export const PAUSE_INTERVALS_MIN = [3, 5, 10] as const;
export const DEFAULT_PAUSE_INTERVAL_MIN = 5;
/** Option admin « Pauses toutes les 30 s (test) ». */
export const ADMIN_TEST_INTERVAL_MS = 30_000;

export function isPauseActivity(activity: ActivityId | null): boolean {
  return activity !== null && PAUSE_ACTIVITIES.includes(activity);
}

/** Les pauses sont-elles activées pour cet enfant ? (par défaut, oui) */
export function pausesEnabled(settings: PauseSettingsValue | undefined): boolean {
  return settings?.enabled !== false;
}

/** Intervalle en ms entre deux pauses ; `null` = pauses désactivées (le réglage de l'admin ne réactive jamais). */
export function pauseIntervalMs(settings: PauseSettingsValue | undefined, adminTest: boolean): number | null {
  if (!pausesEnabled(settings)) return null;
  if (adminTest) return ADMIN_TEST_INTERVAL_MS;
  return (settings?.intervalMin ?? DEFAULT_PAUSE_INTERVAL_MIN) * 60_000;
}

/** Ajoute `elapsedMs` au compteur seulement si l'activité est un mini-jeu (et pas la pause elle-même, imputée à 'reading'). */
export function accumulatePause(counterMs: number, activity: ActivityId | null, elapsedMs: number): number {
  if (!isPauseActivity(activity) || elapsedMs <= 0) return counterMs;
  return counterMs + elapsedMs;
}

/** Une pause est due quand le compteur a atteint l'intervalle. */
export function isPauseDue(counterMs: number, intervalMs: number | null): boolean {
  return intervalMs !== null && counterMs >= intervalMs;
}
