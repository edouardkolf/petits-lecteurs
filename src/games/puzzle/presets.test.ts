import { describe, expect, it } from 'vitest';
import { createRng } from '../../engine/rng';
import { getMechanic } from '../../mechanics';
import { validateMaze } from '../../mechanics/maze/validate';
import { validateMemory } from '../../mechanics/memory/validate';
import { validateOrder } from '../../mechanics/order/validate';
import { validateRobot } from '../../mechanics/robot/validate';
import { PUZZLE_PRESETS } from '../../socle/storage/puzzles';
import { PUZZLE_PRESET_PARAMS, type HubPuzzleId } from './presets';

const HUB_PUZZLES = Object.keys(PUZZLE_PRESET_PARAMS) as HubPuzzleId[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validators: Record<string, (params: any) => string[]> = {
  robot: validateRobot,
  memory: validateMemory,
  order: validateOrder,
  maze: validateMaze,
};

describe('PUZZLE_PRESET_PARAMS', () => {
  for (const game of HUB_PUZZLES) {
    for (const preset of PUZZLE_PRESETS) {
      describe(`${game} / ${preset}`, () => {
        const params = PUZZLE_PRESET_PARAMS[game][preset];

        it('passe le validateur de la mécanique', () => {
          expect(validators[game]!(params)).toEqual([]);
        });

        it('génère une manche pour 20 graines', () => {
          const mechanic = getMechanic(game)!;
          for (let seed = 1; seed <= 20; seed++) {
            const rounds = mechanic.generateRounds(params as never, 1, createRng(seed));
            expect(rounds).toHaveLength(1);
            expect(rounds[0]!.answer).toBeTruthy();
          }
        });
      });
    }
  }
});
