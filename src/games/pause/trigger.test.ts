// Déclenchement des pauses de révision (docs/specs/PAUSES-REVISION.md §2.1) : cumul, remise à zéro, intervalles.
import { describe, expect, it } from 'vitest';
import {
  ADMIN_TEST_INTERVAL_MS,
  DEFAULT_PAUSE_INTERVAL_MIN,
  accumulatePause,
  isPauseActivity,
  isPauseDue,
  pauseIntervalMs,
} from './trigger';

describe('activités qui comptent', () => {
  it('les cinq mini-jeux comptent, jamais l\'aventure, la carte ni l\'accueil', () => {
    for (const a of ['coloring', 'memory', 'order', 'maze', 'robot'] as const) expect(isPauseActivity(a)).toBe(true);
    for (const a of ['reading', 'map', 'hub', null] as const) expect(isPauseActivity(a)).toBe(false);
  });
});

describe('intervalle', () => {
  it('5 minutes par défaut, 3 ou 10 au choix du parent', () => {
    expect(DEFAULT_PAUSE_INTERVAL_MIN).toBe(5);
    expect(pauseIntervalMs(undefined, false)).toBe(5 * 60_000);
    expect(pauseIntervalMs({ intervalMin: 3 }, false)).toBe(3 * 60_000);
    expect(pauseIntervalMs({ intervalMin: 10 }, false)).toBe(10 * 60_000);
  });

  it('l\'option admin ramène l\'intervalle à 30 s', () => {
    expect(ADMIN_TEST_INTERVAL_MS).toBe(30_000);
    expect(pauseIntervalMs(undefined, true)).toBe(30_000);
    expect(pauseIntervalMs({ intervalMin: 10 }, true)).toBe(30_000);
  });

  it('réglage désactivé : jamais de pause, même avec l\'option admin', () => {
    expect(pauseIntervalMs({ enabled: false }, false)).toBeNull();
    expect(pauseIntervalMs({ enabled: false }, true)).toBeNull();
    expect(isPauseDue(10 * 60_000, null)).toBe(false);
  });
});

describe('compteur', () => {
  it('cumule le temps de mini-jeux, de jeu en jeu', () => {
    let ms = 0;
    ms = accumulatePause(ms, 'memory', 100_000);
    ms = accumulatePause(ms, 'coloring', 100_000); // changer de jeu ne remet pas à zéro
    expect(ms).toBe(200_000);
    expect(isPauseDue(ms, 300_000)).toBe(false);
    ms = accumulatePause(ms, 'robot', 100_000);
    expect(ms).toBe(300_000);
    expect(isPauseDue(ms, 300_000)).toBe(true);
  });

  it('ne compte ni l\'aventure, ni l\'accueil, ni la pause elle-même (imputée à la lecture)', () => {
    expect(accumulatePause(5_000, 'map', 60_000)).toBe(5_000);
    expect(accumulatePause(5_000, 'hub', 60_000)).toBe(5_000);
    expect(accumulatePause(5_000, 'reading', 60_000)).toBe(5_000);
    expect(accumulatePause(5_000, null, 60_000)).toBe(5_000);
  });

  it('se remet à zéro après une pause : il faut de nouveau tout l\'intervalle', () => {
    let ms = accumulatePause(0, 'maze', 300_000);
    expect(isPauseDue(ms, 300_000)).toBe(true);
    ms = 0; // fin de la pause (SessionProvider.completePause)
    expect(isPauseDue(ms, 300_000)).toBe(false);
    ms = accumulatePause(ms, 'maze', 299_000);
    expect(isPauseDue(ms, 300_000)).toBe(false);
  });

  it('avec l\'option admin, 30 s suffisent', () => {
    const interval = pauseIntervalMs(undefined, true);
    expect(isPauseDue(accumulatePause(0, 'order', 29_000), interval)).toBe(false);
    expect(isPauseDue(accumulatePause(0, 'order', 30_000), interval)).toBe(true);
  });
});
