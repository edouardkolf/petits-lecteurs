// Retour Android pendant le parcours parent : chaque étape (écran de la démo, page « Notre méthode », code parent,
// fiche enfant…) ajoute une entrée d'historique SUR LA MÊME ADRESSE (comme `navigate` de socle/app/routes.ts : même
// profondeur `depth`, +1 par entrée), avec sa clé dans `history.state.ob`. Le retour revient d'un cran au lieu de quitter.
// Aucun `hashchange` n'est émis : l'écran ne change que par les écouteurs `popstate` des composants du parcours.

interface StepState {
  depth: number | null;
  /** Clé de l'étape : 'demo:2', 'method', 'pin', 'child', 'voice', 'handoff'. Absente sur l'entrée de départ. */
  ob?: string;
  /** Nombre d'entrées ajoutées depuis l'entrée de départ du parcours. */
  n?: number;
}

function currentState(): StepState {
  const s = history.state as Partial<StepState> | null;
  return { depth: typeof s?.depth === 'number' ? s.depth : null, ob: s?.ob, n: s?.n };
}

/** Clé de l'étape de l'entrée d'historique courante (null sur l'entrée de départ). */
export function currentStepKey(): string | null {
  return currentState().ob ?? null;
}

/** Ajoute une entrée d'historique pour l'étape `key`. */
export function pushStep(key: string): void {
  const s = currentState();
  history.pushState({ depth: s.depth === null ? null : s.depth + 1, ob: key, n: (s.n ?? 0) + 1 } satisfies StepState, '');
}

let ending = false;

/** Vrai pendant que `endSteps` remonte l'historique : les écouteurs ne doivent pas réagir. */
export function stepsEnding(): boolean {
  return ending;
}

/**
 * Fin du parcours : on revient à l'entrée de départ (les entrées d'étapes ne doivent pas rester derrière l'écran
 * suivant), puis `then` s'exécute.
 */
export function endSteps(then: () => void): void {
  const n = currentState().n ?? 0;
  if (n <= 0) {
    then();
    return;
  }
  ending = true;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener('popstate', finish);
    ending = false;
    then();
  };
  window.addEventListener('popstate', finish);
  window.setTimeout(finish, 600);
  history.go(-n);
}
