// CONTRAT — registre des jeux hors parcours (docs/specs/HUB.md §4.2). Un jeu = une route du même nom =
// une activité du temps de jeu. Aucun accès au DOM au chargement du module (testable sous Vitest, node).
import type { GameRouteName, Route } from '../socle/app/routes';
import { getTrackOrDefault } from '../engine';
import type { GameRecordBase, GameStoreName, Profile } from '../socle/storage/types';
import { checkVoice, type VoiceProblem } from '../socle/ui/voice';

export type GameId = GameRouteName;

/** Jouable sur CE téléphone ? `parentHint` : cause et remède, affichés dans la fiche enfant. */
export type Availability = { available: true } | { available: false; parentHint: string };

export interface GameDefinition {
  id: GameId;
  /** Route d'entrée : la tuile du hub y mène ; pour la lecture (l'aventure), la carte. */
  route: Route;
  /** Fiche enfant, statistiques ; jamais montré à l'enfant. */
  parentLabel: string;
  /** aria-label de la tuile du hub (lecteurs d'écran, tests) ; jamais affiché. */
  tileLabel: string;
  /** Track.id où le jeu est visible si `Profile.games` est absent. */
  defaultTracks: readonly string[];
  /** Store IndexedDB de ses parties. */
  store: GameStoreName;
  /** Absent = toujours disponible. Ne rejette jamais (voir `resolveAvailability`). */
  checkAvailability?: () => Promise<Availability>;
}

const READING_HINT_BY_PROBLEM: Record<VoiceProblem, string> = {
  'no-api': "Ce navigateur ne sait pas faire parler le téléphone : ouvrez l'application avec Chrome.",
  'no-french-voice': 'Aucune voix française : Paramètres Android › Accessibilité › Synthèse vocale, Français (France).',
  'no-offline-voice': 'Voix française absente hors connexion : installez les données vocales Français (France).',
};

/** « J'apprends à lire » passe entièrement par la voix (LECTURE.md §8.1). */
async function checkReadingAvailability(): Promise<Availability> {
  const check = await checkVoice();
  if (check.status === 'muted') {
    return {
      available: false,
      parentHint: "Le son de l'application est coupé (onglet Réglages) : la lecture a besoin de la voix.",
    };
  }
  if (check.status === 'unavailable') {
    return { available: false, parentHint: READING_HINT_BY_PROBLEM[check.problem ?? 'no-api'] };
  }
  return { available: true };
}

/** Les jeux de l'app, dans l'ordre : la lecture (l'aventure), puis les mini-jeux de maternelle du hub. */
export const GAMES: readonly GameDefinition[] = [
  // « J'apprends à lire » : programme de lecture de zéro au CP (docs/specs/LECTURE.md). Premier jeu du hub MS après la carte.
  {
    id: 'reading',
    route: { name: 'map' },
    parentLabel: "J'apprends à lire",
    tileLabel: 'Lecture',
    defaultTracks: ['ms'],
    store: 'readings',
    checkAvailability: checkReadingAvailability,
  },
  {
    id: 'coloring',
    route: { name: 'coloring' },
    parentLabel: 'Coloriage magique',
    tileLabel: 'Coloriage',
    defaultTracks: ['ms'],
    store: 'colorings',
  },
  {
    id: 'memory',
    route: { name: 'memory' },
    parentLabel: 'Memory',
    tileLabel: 'Memory',
    defaultTracks: ['ms'],
    store: 'puzzles',
  },
  {
    id: 'order',
    route: { name: 'order' },
    parentLabel: 'Ranger du plus petit au plus grand',
    tileLabel: 'Ranger',
    defaultTracks: ['ms'],
    store: 'puzzles',
  },
  {
    id: 'maze',
    route: { name: 'maze' },
    parentLabel: 'Labyrinthe',
    tileLabel: 'Labyrinthe',
    defaultTracks: ['ms'],
    store: 'puzzles',
  },
  {
    id: 'robot',
    route: { name: 'robot' },
    parentLabel: 'Robot à programmer',
    tileLabel: 'Robot',
    defaultTracks: ['ms'],
    store: 'puzzles',
  },
];

/** Le jeu qui tient lieu d'aventure (la tuile « carte » du hub y mène) : toujours visible, jamais une tuile de jeu libre. */
export const ADVENTURE_GAME_ID: GameId = 'reading';

export function isAdventureGame(id: string): boolean {
  return id === ADVENTURE_GAME_ID;
}

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}

/** Jeux visibles par défaut pour un parcours (un parcours inconnu est résolu comme sur la carte, F11). */
export function defaultGameIds(trackId: string): GameId[] {
  const resolved = getTrackOrDefault(trackId)?.id ?? trackId;
  return GAMES.filter((game) => game.defaultTracks.includes(resolved)).map((game) => game.id);
}

/**
 * `profile.games` s'il existe (ids inconnus et doublons retirés), sinon le défaut du parcours ; ordre du registre.
 * Le jeu d'aventure (la lecture) est toujours visible : c'est l'app elle-même.
 */
export function visibleGameIds(profile: Pick<Profile, 'trackId' | 'games'>): GameId[] {
  const wanted = new Set<string>(profile.games ?? defaultGameIds(profile.trackId));
  return GAMES.filter((game) => wanted.has(game.id) || isAdventureGame(game.id)).map((game) => game.id);
}

/** Tuiles de jeu libre du hub : les jeux visibles, sans le jeu d'aventure (il a la tuile « carte »). */
export function hubGameIds(profile: Pick<Profile, 'trackId' | 'games'>): GameId[] {
  return visibleGameIds(profile).filter((id) => !isAdventureGame(id));
}

/**
 * Disponibilité d'un jeu, en `timeoutMs` au plus. Seul un `{ available: false }` explicite rend le jeu
 * indisponible : un rejet ou un délai dépassé donnent `{ available: true }`, et l'écran du jeu vérifie
 * alors lui-même (arbitrage A5).
 */
export async function resolveAvailability(game: GameDefinition, timeoutMs = 2000): Promise<Availability> {
  if (!game.checkAvailability) return { available: true };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Availability>((resolve) => {
    timer = setTimeout(() => resolve({ available: true }), timeoutMs);
  });
  try {
    const result = await Promise.race([game.checkAvailability(), timeout]);
    return result.available ? { available: true } : result;
  } catch {
    return { available: true };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Props du bloc de statistiques d'un jeu, monté par ChildStats (arbitrage A7). */
export interface GameStatsProps<R extends GameRecordBase> {
  profile: Profile;
  records: readonly R[];
}

/** Props du composant de réglages d'un jeu, monté par ChildForm sous la bascule du jeu. */
export interface GameSettingsProps<S> {
  value: S | undefined;
  onChange: (next: S | undefined) => void;
}
