import { describe, expect, it } from 'vitest';
import type { PuzzlePreset, PuzzleRecord } from '../../socle/storage/puzzles';
import { PUZZLE_PRESET_PARAMS } from './presets';
import { lastPresetPlayed, mazePreview, memoryPreview, orderPreview, robotPreview } from './previewGeometry';

const PRESETS: PuzzlePreset[] = ['easy', 'medium', 'hard'];

describe('aperçus de difficulté', () => {
  it('memory : deux cartes par paire, grille identique à celle du jeu', () => {
    expect(memoryPreview('easy')).toEqual({ cols: 2, rows: 3, count: 6 });
    expect(memoryPreview('medium')).toEqual({ cols: 3, rows: 4, count: 12 });
    expect(memoryPreview('hard')).toEqual({ cols: 4, rows: 4, count: 16 });
  });

  it('order : autant de barres que d’éléments, strictement croissantes', () => {
    for (const p of PRESETS) {
      const { heights } = orderPreview(p);
      expect(heights).toHaveLength(PUZZLE_PRESET_PARAMS.order[p].items);
      for (let i = 1; i < heights.length; i++) expect(heights[i]!).toBeGreaterThan(heights[i - 1]!);
      expect(heights.every((h) => h > 0 && h <= 1)).toBe(true);
    }
  });

  it('maze : taille réelle, chemin de cases voisines dans la grille', () => {
    for (const p of PRESETS) {
      const { size, path } = mazePreview(p);
      expect(size).toBe(PUZZLE_PRESET_PARAMS.maze[p].size);
      expect(path).toHaveLength(PUZZLE_PRESET_PARAMS.maze[p].minPath);
      for (const c of path) {
        expect(c.col).toBeGreaterThanOrEqual(0);
        expect(c.col).toBeLessThan(size);
        expect(c.row).toBeGreaterThanOrEqual(0);
        expect(c.row).toBeLessThan(size);
      }
      for (let i = 1; i < path.length; i++) {
        const d = Math.abs(path[i]!.col - path[i - 1]!.col) + Math.abs(path[i]!.row - path[i - 1]!.row);
        expect(d).toBe(1);
      }
    }
  });

  it('robot : taille et nombre de rochers réels, rochers distincts et hors départ et cible', () => {
    for (const p of PRESETS) {
      const { size, robot, target, obstacles } = robotPreview(p);
      expect(size).toBe(PUZZLE_PRESET_PARAMS.robot[p].size);
      expect(obstacles).toHaveLength(PUZZLE_PRESET_PARAMS.robot[p].obstacles);
      const keys = new Set([robot, target, ...obstacles].map((c) => `${c.col},${c.row}`));
      expect(keys.size).toBe(obstacles.length + 2);
      for (const c of obstacles) {
        expect(c.col).toBeLessThan(size);
        expect(c.row).toBeLessThan(size);
      }
    }
  });

  it('déterministe : deux appels donnent le même résultat', () => {
    for (const p of PRESETS) {
      expect(mazePreview(p)).toEqual(mazePreview(p));
      expect(robotPreview(p)).toEqual(robotPreview(p));
      expect(memoryPreview(p)).toEqual(memoryPreview(p));
      expect(orderPreview(p)).toEqual(orderPreview(p));
    }
  });
});

describe('lastPresetPlayed', () => {
  const rec = (game: PuzzleRecord['game'], preset: PuzzlePreset, startedAt: number) => ({ game, preset, startedAt }) as PuzzleRecord;

  it('null sans partie à ce jeu', () => {
    expect(lastPresetPlayed([], 'memory')).toBeNull();
    expect(lastPresetPlayed([rec('maze', 'hard', 5)], 'memory')).toBeNull();
  });

  it('prend la partie la plus récente du jeu, quel que soit l’ordre', () => {
    const records = [rec('memory', 'hard', 30), rec('memory', 'easy', 10), rec('maze', 'easy', 99), rec('memory', 'medium', 20)];
    expect(lastPresetPlayed(records, 'memory')).toBe('hard');
    expect(lastPresetPlayed(records, 'maze')).toBe('easy');
  });
});
