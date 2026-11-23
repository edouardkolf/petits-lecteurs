// Échecs d'une pause : repli au 2e, fin douce au 3e (docs/specs/PAUSES-REVISION.md §2.4 à 2.6).
import { describe, expect, it } from 'vitest';
import { createRng } from '../../engine/rng';
import { initFlow } from '../reading/flow';
import { planPause } from './content';
import { EXIT_AT, FALLBACK_AT, onPauseFailure, replaceCurrent } from './flow';
import { progressWith } from './test-helpers';

describe('onPauseFailure', () => {
  it('1er échec : on continue ; 2e : repli ; 3e : fin', () => {
    expect(onPauseFailure(1, false)).toBe('continue');
    expect(onPauseFailure(FALLBACK_AT, false)).toBe('fallback');
    expect(onPauseFailure(EXIT_AT, true)).toBe('exit');
  });

  it('le repli n\'a lieu qu\'une fois', () => {
    expect(onPauseFailure(FALLBACK_AT, true)).toBe('continue');
  });

  it('la fin prime sur le repli', () => {
    expect(onPauseFailure(EXIT_AT, false)).toBe('exit');
  });
});

describe('replaceCurrent', () => {
  it('remplace la question en cours par le repli et saute sa démonstration', () => {
    const progress = progressWith({ acquired: ['a', 'i'], learning: ['o'] });
    const plan = planPause({ progress, name: 'Chloé', rng: createRng(7) });
    const state = initFlow(plan);
    const safer = plan.fallback('g:a');
    expect(safer).not.toBeNull();
    const next = replaceCurrent(state, safer!);
    expect(next.queue[0]).toBe(safer);
    expect(next.queue).toHaveLength(state.queue.length);
    expect(next.index).toBe(0);
    expect(next.pendingDemos).not.toContain(safer!.game);
  });
});
