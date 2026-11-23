// Contenu d'une pause de révision (docs/specs/PAUSES-REVISION.md §2.3). Pur : tout le hasard vient du `Rng`.
// Cascade : (1) des graphèmes maîtrisés (`acquired`), tirés au hasard ; (2) sinon un jeu d'écoute ; (3) en bonus,
// la première lettre du prénom, en reconnaissance visuelle seulement. Jamais un contenu que l'aventure n'a pas
// encore présenté : les leurres de lettres sont tous des graphèmes déjà vus (sauf la lettre du prénom, visuelle).
import type { Rng } from '../../engine/types';
import { gamesForItem, GRAPHEMES } from '../reading/curriculum';
import { createQuestionMaker } from '../reading/session';
import { nameLetterPraise, nameLetterPrompt } from '../reading/speech';
import type {
  GraphemeId,
  ItemId,
  ReadingGameId,
  ReadingProgress,
  ReadingQuestion,
  ReadingSessionPlan,
  ReadingStage,
} from '../reading/types';

/** Jeux d'écoute (aucune lettre), avec l'item de compétence qu'ils interrogent. */
export const LISTENING_GAMES: readonly { game: ReadingGameId; item: ItemId }[] = [
  { game: 'syllable-drum', item: 'k:count' },
  { game: 'same-start', item: 'k:onset' },
  { game: 'same-end', item: 'k:rhyme' },
];

/** Nombre de questions « de fond » d'une pause (la lettre du prénom s'y ajoute en bonus : 2 ou 3 au total). */
export const BASE_QUESTIONS = 2;

export interface PausePlan extends ReadingSessionPlan {
  /** D'où vient le fond : graphèmes maîtrisés, ou jeux d'écoute (rien d'acquis). */
  source: 'acquired' | 'listening';
  /** La question de la lettre du prénom est au programme. */
  nameBonus: boolean;
  /** Question plus sûre pour le 2e échec : `failed` = item de la question ratée. Rend null si rien de mieux. */
  fallback: (failed: ItemId | null) => ReadingQuestion | null;
}

/**
 * Première lettre du prénom, en capitale sans accent (É → E, Ç → C), ou null si ce n'est pas une lettre A-Z
 * (chiffre, apostrophe, lettre hors alphabet latin de base) : la question est alors sautée.
 */
export function nameInitial(name: string): string | null {
  const first = [...name.trim()][0];
  if (!first) return null;
  const base = first.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return /^[A-Z]$/.test(base) ? base : null;
}

/** Graphèmes maîtrisés (lettre muette exclue), ordre du programme. */
export function acquiredGraphemes(progress: ReadingProgress): GraphemeId[] {
  return GRAPHEMES.filter((g) => g.id !== 'h' && progress.items[`g:${g.id}`]?.state === 'acquired').map((g) => g.id);
}

/** Graphèmes que l'aventure a déjà présentés (vus au moins une fois, ou tenus pour acquis). */
export function introducedGraphemes(progress: ReadingProgress): GraphemeId[] {
  return GRAPHEMES.filter((g) => {
    const state = progress.items[`g:${g.id}`]?.state;
    return state !== undefined && state !== 'new';
  }).map((g) => g.id);
}

/** Jeux possibles pour interroger un graphème maîtrisé, sans jamais montrer une lettre non présentée. */
export function gamesForAcquired(id: GraphemeId, introducedCount: number): ReadingGameId[] {
  const letterGames = gamesForItem(`g:${id}`);
  if (introducedCount >= 2) return [...letterGames, 'word-start'];
  // Une seule lettre connue : pas de leurre de lettre possible. « A ou pas A ? » pour A, sinon image seulement.
  return id === 'a' ? ['sound-gate', 'word-start'] : ['word-start'];
}

/** Taux de réussite du premier coup d'un item (0 si jamais vu). */
function rateOf(progress: ReadingProgress, item: ItemId): number {
  const p = progress.items[item];
  return p && p.seen > 0 ? p.correct / p.seen : 0;
}

/** Lettres qui se ressemblent : jamais ensemble dans la question du prénom. */
const LOOKALIKES: readonly (readonly string[])[] = [
  ['B', 'D', 'P', 'R'],
  ['M', 'N', 'W', 'H'],
  ['U', 'V', 'Y'],
  ['O', 'Q', 'C', 'G'],
  ['E', 'F'],
  ['I', 'L', 'J', 'T'],
  ['S', 'Z'],
  ['A', 'X', 'K'],
];

function lookalike(a: string, b: string): boolean {
  return LOOKALIKES.some((g) => g.includes(a) && g.includes(b));
}

/**
 * Question « touche la lettre de <prénom> » : la capitale parmi 2 ou 3 lettres, reconnaissance visuelle seulement.
 * Les leurres sont des lettres déjà présentées de préférence, jamais ressemblantes. Null si la 1re lettre n'est pas A-Z.
 */
export function buildNameLetterQuestion(name: string, progress: ReadingProgress, rng: Rng): ReadingQuestion | null {
  const initial = nameInitial(name);
  if (!initial) return null;
  const known = introducedGraphemes(progress)
    .filter((id) => id.length === 1)
    .map((id) => id.toUpperCase());
  const all = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const fit = (l: string): boolean => l !== initial && !lookalike(l, initial);
  const decoys: string[] = [];
  for (const l of [...rng.shuffle(known.filter(fit)), ...rng.shuffle(all.filter(fit))]) {
    if (decoys.length >= 2) break;
    if (!decoys.includes(l) && decoys.every((d) => !lookalike(d, l))) decoys.push(l);
  }
  if (decoys.length === 0) return null;
  const id = initial.toLowerCase();
  const prompt = nameLetterPrompt(name.trim());
  return {
    game: 'name-letter',
    itemId: `g:${id}`,
    target: id,
    // La lettre n'est pas « chantée » : le stimulus est l'avatar, jamais un son.
    stimulus: { kind: 'letter', grapheme: id },
    choices: rng.shuffle([initial, ...decoys]).map((l) => ({ id: l.toLowerCase(), kind: 'letter' as const, label: l })),
    answer: id,
    prompt,
    shortPrompt: prompt,
    speakChoices: false,
    praise: nameLetterPraise(),
    isNew: false,
  };
}

/** Jeux d'écoute dont l'aventure a déjà fait la démonstration d'abord ; à défaut, les trois. */
function listeningPool(progress: ReadingProgress): typeof LISTENING_GAMES {
  const seen = LISTENING_GAMES.filter((l) => progress.demosDone.includes(l.game));
  return seen.length > 0 ? seen : LISTENING_GAMES;
}

export interface PauseInput {
  progress: ReadingProgress;
  /** Prénom de l'enfant. */
  name: string;
  rng: Rng;
}

export function planPause({ progress, name, rng }: PauseInput): PausePlan {
  const make = createQuestionMaker(progress, rng, { onlyIntroduced: true });
  const introducedCount = introducedGraphemes(progress).length;
  const questions: ReadingQuestion[] = [];

  /** Première question qu'on sait fabriquer pour l'un de ces graphèmes, parmi `ids` dans l'ordre. */
  const acquiredQuestion = (ids: readonly GraphemeId[]): ReadingQuestion | null => {
    for (const id of ids) {
      for (const game of rng.shuffle(gamesForAcquired(id, introducedCount))) {
        const gate = game === 'sound-gate' ? rng.pick(['a', 'none'] as const) : undefined;
        const q = make(`g:${id}`, game, gate);
        if (q) return q;
      }
    }
    return null;
  };

  const acquired = rng.shuffle(acquiredGraphemes(progress));
  const first = acquiredQuestion(acquired);
  let source: PausePlan['source'] = 'listening';
  if (first) {
    source = 'acquired';
    first.retention = true; // la seule question qui compte pour la courbe d'oubli
    questions.push(first);
    const second = acquiredQuestion(acquired.filter((id) => `g:${id}` !== first.itemId));
    if (second) questions.push(second);
  }

  // Compléter avec de l'écoute : rien d'acquis (2 questions), ou un seul graphème maîtrisé (1 question).
  const pool = listeningPool(progress);
  const order = rng.shuffle(pool);
  for (let i = 0; questions.length < BASE_QUESTIONS && i < order.length * 2; i += 1) {
    const entry = order[i % order.length] as (typeof LISTENING_GAMES)[number];
    const q = make(entry.item, entry.game);
    if (q) questions.push(q);
  }

  const nameQuestion = buildNameLetterQuestion(name, progress, rng);
  if (nameQuestion) questions.push(nameQuestion);

  const demos: ReadingGameId[] = [];
  for (const q of questions) {
    if (!progress.demosDone.includes(q.game) && !demos.includes(q.game)) demos.push(q.game);
  }

  const fallback = (failed: ItemId | null): ReadingQuestion | null => {
    const failedRate = failed ? rateOf(progress, failed) : -1;
    const better = acquired
      .map((id): ItemId => `g:${id}`)
      .filter((item) => item !== failed && rateOf(progress, item) > failedRate)
      .sort((a, b) => rateOf(progress, b) - rateOf(progress, a) || (progress.items[b]?.streak ?? 0) - (progress.items[a]?.streak ?? 0));
    for (const item of better) {
      const q = make(item, 'letter-sound') ?? make(item, 'word-start');
      if (q) return q;
    }
    // Rien de mieux maîtrisé : un tambour (aucune lettre).
    return make('k:count', 'syllable-drum') ?? make('k:onset', 'same-start');
  };

  const stage: ReadingStage = progress.stage;
  return { stage, questions, newItemId: null, demos, source, nameBonus: nameQuestion !== null, fallback };
}
