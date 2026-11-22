// Géométrie des aperçus de difficulté (écran de choix) : fonctions pures, déduites des vrais paramètres de
// `presets.ts`, donc toujours fidèles à ce que l'enfant va jouer. Aucune dépendance au DOM ni au hasard.
import { gridFor } from '../../mechanics/memory/logic';
import type { PuzzlePreset, PuzzleRecord } from '../../socle/storage/puzzles';
import { PUZZLE_PRESET_PARAMS, type HubPuzzleId } from './presets';

export interface Cell {
  col: number;
  row: number;
}

export interface MemoryPreview {
  cols: number;
  rows: number;
  /** Cartes face cachée : deux par paire. */
  count: number;
}

export interface OrderPreview {
  /** Hauteurs des barres (entre 0 et 1), strictement croissantes. */
  heights: number[];
}

export interface MazePreview {
  size: number;
  /** Chemin dessiné, de l'entrée vers la sortie, case par case (voisines). */
  path: Cell[];
}

export interface RobotPreview {
  size: number;
  robot: Cell;
  target: Cell;
  obstacles: Cell[];
}

export function memoryPreview(preset: PuzzlePreset): MemoryPreview {
  const count = PUZZLE_PRESET_PARAMS.memory[preset].pairs * 2;
  return { ...gridFor(count), count };
}

export function orderPreview(preset: PuzzlePreset): OrderPreview {
  const { items } = PUZZLE_PRESET_PARAMS.order[preset];
  return { heights: Array.from({ length: items }, (_, i) => (i + 1) / items) };
}

/** Serpentin (rangées paires entières, une case de liaison en alternance), coupé à `minPath` cases. */
export function mazePreview(preset: PuzzlePreset): MazePreview {
  const { size, minPath } = PUZZLE_PRESET_PARAMS.maze[preset];
  const path: Cell[] = [];
  for (let row = 0; row < size && path.length < minPath; row++) {
    if (row % 2 === 0) {
      const leftToRight = (row / 2) % 2 === 0;
      for (let i = 0; i < size; i++) path.push({ col: leftToRight ? i : size - 1 - i, row });
    } else {
      // La liaison est du côté où la rangée précédente s'est terminée.
      const last = path[path.length - 1] as Cell;
      path.push({ col: last.col, row });
    }
  }
  return { size, path: path.slice(0, minPath) };
}

/** Robot en bas à gauche, cible en haut à droite, rochers répartis par un pas fixe (sans hasard). */
export function robotPreview(preset: PuzzlePreset): RobotPreview {
  const { size, obstacles } = PUZZLE_PRESET_PARAMS.robot[preset];
  const robot = { col: 0, row: size - 1 };
  const target = { col: size - 1, row: 0 };
  const cells = size * size;
  const placed: Cell[] = [];
  const taken = new Set<number>([robot.row * size + robot.col, target.row * size + target.col]);
  // 7 est premier avec 16, 25 et 36 : le parcours visite chaque case une fois.
  for (let k = 0; k < cells && placed.length < obstacles; k++) {
    const idx = (k * 7 + 3) % cells;
    if (taken.has(idx)) continue;
    taken.add(idx);
    placed.push({ col: idx % size, row: Math.floor(idx / size) });
  }
  return { size, robot, target, obstacles: placed };
}

/** Dernière difficulté jouée par l'enfant à ce jeu (partie la plus récente), ou null s'il n'a jamais joué. */
export function lastPresetPlayed(records: readonly PuzzleRecord[], game: HubPuzzleId): PuzzlePreset | null {
  let best: PuzzleRecord | null = null;
  for (const r of records) {
    if (r.game !== game) continue;
    if (!best || r.startedAt >= best.startedAt) best = r;
  }
  return best ? best.preset : null;
}
