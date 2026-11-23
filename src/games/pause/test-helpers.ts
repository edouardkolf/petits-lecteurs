// Fabrique de progressions pour les tests des pauses (jamais importé par l'app).
import { allItems } from '../reading/curriculum';
import type { ItemProgress, ItemState, ReadingGameId, ReadingProgress } from '../reading/types';

interface Spec {
  /** Graphèmes acquis (ids : 'a', 'm'…), avec un taux de premier coup par défaut de 100 %. */
  acquired?: string[];
  /** Graphèmes vus mais pas encore acquis. */
  learning?: string[];
  /** Taux de réussite du premier coup d'un graphème acquis (sur 10 réponses). */
  rates?: Record<string, number>;
  demosDone?: ReadingGameId[];
}

function item(state: ItemState, rate = 1): ItemProgress {
  const seen = state === 'new' ? 0 : 10;
  return {
    state,
    seen,
    correct: Math.round(seen * rate),
    streak: state === 'acquired' ? 3 : 0,
    missStreak: 0,
    streakDays: [],
    lastSeenAt: state === 'new' ? null : 1,
  };
}

export function progressWith(spec: Spec = {}): ReadingProgress {
  const items: Record<string, ItemProgress> = {};
  for (const id of allItems()) items[id] = item('new');
  for (const g of spec.learning ?? []) items[`g:${g}`] = item('learning', 0.5);
  for (const g of spec.acquired ?? []) items[`g:${g}`] = item('acquired', spec.rates?.[g] ?? 1);
  return { stage: 2, finished: false, items, demosDone: spec.demosDone ?? [], sessionsCompleted: 0 };
}
