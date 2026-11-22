// Tests de src/games/index.ts (docs/specs/HUB.md §4.2, §8.1).
import { describe, expect, it } from 'vitest';
import { GAMES, defaultGameIds, getGame, hubGameIds, isAdventureGame, resolveAvailability, visibleGameIds } from './index';
import type { GameDefinition } from './index';

const ALL_IDS = ['reading', 'coloring', 'memory', 'order', 'maze', 'robot'];

describe('GAMES', () => {
  it('la lecture d’abord, puis les mini-jeux de maternelle ; aucun jeu de CE1', () => {
    expect(GAMES.map((g) => g.id)).toEqual(ALL_IDS);
  });
});

describe('defaultGameIds', () => {
  it("tous les jeux de l'app par défaut, 'ms' comme un parcours inconnu (« ce1 » importé de Petits Malins)", () => {
    expect(defaultGameIds('ms')).toEqual(ALL_IDS);
    expect(defaultGameIds('ce1')).toEqual(ALL_IDS);
    expect(defaultGameIds('inconnu')).toEqual(ALL_IDS);
  });
});

describe('visibleGameIds', () => {
  it('profile.games absent : le défaut', () => {
    expect(visibleGameIds({ trackId: 'ms', games: undefined })).toEqual(ALL_IDS);
  });

  it('[] : seule la lecture (l’aventure), toujours visible', () => {
    expect(visibleGameIds({ trackId: 'ms', games: [] })).toEqual(['reading']);
  });

  it("l'ordre suit le registre, pas celui de `games` ; les jeux de Petits Malins sont ignorés", () => {
    expect(visibleGameIds({ trackId: 'ms', games: ['dictation', 'maze', 'coloring'] })).toEqual(['reading', 'coloring', 'maze']);
  });

  it('les ids inconnus et les doublons disparaissent', () => {
    expect(visibleGameIds({ trackId: 'ms', games: ['coloring', 'coloring', 'inconnu'] })).toEqual(['reading', 'coloring']);
  });
});

describe('hub et aventure', () => {
  it('la lecture est toujours visible mais n’est jamais une tuile du hub', () => {
    expect(hubGameIds({ trackId: 'ms', games: undefined })).toEqual(['coloring', 'memory', 'order', 'maze', 'robot']);
    expect(hubGameIds({ trackId: 'ms', games: [] })).toEqual([]);
    expect(isAdventureGame('reading')).toBe(true);
    expect(isAdventureGame('coloring')).toBe(false);
  });
});

describe('getGame', () => {
  it('renvoie la définition connue, undefined sinon', () => {
    expect(getGame('maze')?.id).toBe('maze');
    expect(getGame('dictation')).toBeUndefined();
    expect(getGame('n-importe-quoi')).toBeUndefined();
  });
});

describe('resolveAvailability', () => {
  const base: Omit<GameDefinition, 'checkAvailability'> = {
    id: 'coloring',
    route: { name: 'coloring' },
    parentLabel: 'Coloriage magique',
    tileLabel: 'Coloriage',
    defaultTracks: ['ms'],
    store: 'colorings',
  };

  it('sans checkAvailability : toujours disponible', async () => {
    await expect(resolveAvailability(base)).resolves.toEqual({ available: true });
  });

  it('{ available: false } explicite est respecté', async () => {
    const game: GameDefinition = {
      ...base,
      checkAvailability: async () => ({ available: false, parentHint: 'Le téléphone ne peut pas parler.' }),
    };
    await expect(resolveAvailability(game)).resolves.toEqual({
      available: false,
      parentHint: 'Le téléphone ne peut pas parler.',
    });
  });

  it('un rejet donne { available: true } : le jeu vérifie lui-même', async () => {
    const game: GameDefinition = {
      ...base,
      checkAvailability: async () => {
        throw new Error('boom');
      },
    };
    await expect(resolveAvailability(game)).resolves.toEqual({ available: true });
  });

  it('un délai dépassé donne { available: true }', async () => {
    const game: GameDefinition = {
      ...base,
      checkAvailability: () => new Promise(() => {}), // ne se résout jamais
    };
    await expect(resolveAvailability(game, 5)).resolves.toEqual({ available: true });
  });
});
