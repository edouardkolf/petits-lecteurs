// Échecs d'une pause de révision (docs/specs/PAUSES-REVISION.md §2.4 à 2.6). Pur.
//  - un échec = une mauvaise réponse (un choix faux, un mauvais nombre de frappes) ;
//  - au 2e échec : repli sur une question plus sûre (une seule fois) ;
//  - au 3e échec : la pause se termine en douceur et le parent reçoit un signal « pause difficile ».
import type { FlowState } from '../reading/flow';
import type { ReadingQuestion } from '../reading/types';

export const FALLBACK_AT = 2;
export const EXIT_AT = 3;

export type FailureAction = 'continue' | 'fallback' | 'exit';

/** `failures` : nombre d'échecs de la pause, celui qui vient d'arriver compris. */
export function onPauseFailure(failures: number, fallbackUsed: boolean): FailureAction {
  if (failures >= EXIT_AT) return 'exit';
  if (failures === FALLBACK_AT && !fallbackUsed) return 'fallback';
  return 'continue';
}

/**
 * Remplace la question en cours par le repli. Sa démonstration éventuelle est sautée (l'enfant vient d'échouer : pas
 * de leçon de plus) sans être comptée comme faite.
 */
export function replaceCurrent(state: FlowState, question: ReadingQuestion): FlowState {
  const queue = [...state.queue];
  queue[state.index] = question;
  return { ...state, queue, pendingDemos: state.pendingDemos.filter((g) => g !== question.game) };
}
