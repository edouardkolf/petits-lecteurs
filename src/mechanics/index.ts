// Registre des mécaniques des mini-jeux du hub (memory, ranger, labyrinthe, robot : src/games/puzzle).
import type { MechanicDefinition, MechanicId } from '../engine/types';
import { maze } from './maze';
import { memory } from './memory';
import { order } from './order';
import { robot } from './robot';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMechanic = MechanicDefinition<any, any>;

const registry: Partial<Record<MechanicId, AnyMechanic>> = {
  robot,
  memory,
  order,
  maze,
};

export function getMechanic(id: MechanicId): AnyMechanic | undefined {
  return registry[id];
}
