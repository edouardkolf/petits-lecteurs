// Contenu des pauses de révision (docs/specs/PAUSES-REVISION.md §2.3) : cascade, lettre du prénom, jamais de contenu
// que l'aventure n'a pas présenté. Déterministe pour une graine.
import { describe, expect, it } from 'vitest';
import { createRng } from '../../engine/rng';
import { gamesForAcquired, acquiredGraphemes, buildNameLetterQuestion, nameInitial, planPause } from './content';
import { progressWith } from './test-helpers';
import type { ReadingQuestion } from '../reading/types';

const LISTENING = ['syllable-drum', 'same-start', 'same-end'];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

/** Lettres affichées comme choix (capitales) d'une question. */
function letters(q: ReadingQuestion): string[] {
  return q.choices.filter((c) => c.kind === 'letter').map((c) => c.id);
}

describe('nameInitial', () => {
  it('capitale sans accent', () => {
    expect(nameInitial('Chloé')).toBe('C');
    expect(nameInitial('Élodie')).toBe('E');
    expect(nameInitial('Ça')).toBe('C');
    expect(nameInitial('  zoé ')).toBe('Z');
    expect(nameInitial('Östen')).toBe('O');
  });

  it('saute ce qui n\'est pas une lettre A-Z', () => {
    expect(nameInitial('')).toBeNull();
    expect(nameInitial('   ')).toBeNull();
    expect(nameInitial('1er')).toBeNull();
    expect(nameInitial("'Lou")).toBeNull();
    expect(nameInitial('-Marie')).toBeNull();
    expect(nameInitial('Œdipe')).toBeNull();
    expect(nameInitial('ß')).toBeNull();
    expect(nameInitial('Ève')).toBe('E');
    expect(nameInitial('李')).toBeNull();
  });
});

describe('lettre du prénom', () => {
  it('la bonne lettre parmi 2 ou 3 capitales, sans ressemblance, visuelle seulement', () => {
    for (const seed of SEEDS) {
      const q = buildNameLetterQuestion('Chloé', progressWith({ acquired: ['a'] }), createRng(seed));
      expect(q).not.toBeNull();
      expect(q!.game).toBe('name-letter');
      expect(q!.answer).toBe('c');
      expect(q!.choices.map((c) => c.label)).toContain('C');
      expect(q!.choices.length).toBeGreaterThanOrEqual(2);
      expect(q!.choices.length).toBeLessThanOrEqual(3);
      expect(new Set(q!.choices.map((c) => c.id)).size).toBe(q!.choices.length);
      // jamais de lettre qui ressemble à C (O, Q, G) à côté d'elle
      expect(q!.choices.map((c) => c.label)).not.toEqual(expect.arrayContaining(['O']));
      // la voix ne dit jamais le son d'une lettre
      expect(q!.stimulus.kind).toBe('letter');
      expect(JSON.stringify(q!.prompt)).toContain('Chloé');
      expect(q!.retention).toBeUndefined();
    }
  });

  it('est sautée si la 1re lettre n\'est pas A-Z', () => {
    expect(buildNameLetterQuestion('1er', progressWith(), createRng(1))).toBeNull();
    expect(buildNameLetterQuestion('', progressWith(), createRng(1))).toBeNull();
  });
});

describe('cascade du contenu', () => {
  it('graphèmes acquis d\'abord : la 1re question en est une, marquée « retention »', () => {
    const progress = progressWith({ acquired: ['a', 'i', 'o'], learning: ['u'], demosDone: ['letter-sound'] });
    for (const seed of SEEDS) {
      const plan = planPause({ progress, name: 'Chloé', rng: createRng(seed) });
      expect(plan.source).toBe('acquired');
      const [first, second] = plan.questions;
      expect(first!.retention).toBe(true);
      expect(['g:a', 'g:i', 'g:o']).toContain(first!.itemId);
      expect(second!.retention).toBeUndefined();
      expect(plan.questions.filter((q) => q.retention)).toHaveLength(1);
      expect(plan.questions.length).toBeGreaterThanOrEqual(2);
      expect(plan.questions.length).toBeLessThanOrEqual(3);
    }
  });

  it('rien d\'acquis : jeux d\'écoute seulement, aucune lettre, pas de retention', () => {
    const progress = progressWith({ learning: ['a'] });
    for (const seed of SEEDS) {
      const plan = planPause({ progress, name: 'Chloé', rng: createRng(seed) });
      expect(plan.source).toBe('listening');
      const base = plan.questions.filter((q) => q.game !== 'name-letter');
      expect(base.length).toBe(2);
      for (const q of base) {
        expect(LISTENING).toContain(q.game);
        expect(q.retention).toBeUndefined();
      }
      expect(plan.questions.some((q) => q.retention)).toBe(false);
    }
  });

  it('la lettre du prénom est le bonus en dernier, et seulement si elle est une lettre A-Z', () => {
    const progress = progressWith({ acquired: ['a', 'i'] });
    const withName = planPause({ progress, name: 'Léa', rng: createRng(3) });
    expect(withName.nameBonus).toBe(true);
    expect(withName.questions.at(-1)!.game).toBe('name-letter');
    expect(withName.questions.at(-1)!.answer).toBe('l');
    const without = planPause({ progress, name: '7 nains', rng: createRng(3) });
    expect(without.nameBonus).toBe(false);
    expect(without.questions.some((q) => q.game === 'name-letter')).toBe(false);
  });

  it('jamais un contenu que l\'aventure n\'a pas présenté : les lettres proposées sont toutes déjà vues', () => {
    const progress = progressWith({ acquired: ['a', 'i', 'o'], learning: ['m'] });
    const seen = new Set(['a', 'i', 'o', 'm']);
    for (const seed of SEEDS) {
      const plan = planPause({ progress, name: '', rng: createRng(seed) });
      for (const q of plan.questions) {
        for (const l of letters(q)) expect(seen.has(l)).toBe(true);
        if (q.itemId.startsWith('g:')) expect(seen.has(q.itemId.slice(2))).toBe(true);
      }
    }
  });

  it('un seul graphème connu : pas de leurre de lettre, « A ou pas A ? » ou image seulement', () => {
    expect(gamesForAcquired('a', 1)).toEqual(['sound-gate', 'word-start']);
    expect(gamesForAcquired('m', 1)).toEqual(['word-start']);
    expect(gamesForAcquired('a', 3)).toContain('letter-sound');
    const progress = progressWith({ acquired: ['a'], demosDone: ['sound-gate'] });
    for (const seed of SEEDS) {
      const plan = planPause({ progress, name: '', rng: createRng(seed) });
      const first = plan.questions[0]!;
      expect(first.itemId).toBe('g:a');
      expect(['sound-gate', 'word-start']).toContain(first.game);
      expect(plan.questions.every((q) => q.game !== 'letter-sound' && q.game !== 'first-sound')).toBe(true);
    }
  });

  it('les démonstrations restent à faire pour les jeux jamais montrés', () => {
    const progress = progressWith({ acquired: ['a', 'i'], demosDone: ['letter-sound'] });
    const plan = planPause({ progress, name: 'Léa', rng: createRng(5) });
    for (const q of plan.questions) {
      expect(plan.demos.includes(q.game)).toBe(q.game !== 'letter-sound');
    }
  });

  it('est déterministe pour une graine', () => {
    const progress = progressWith({ acquired: ['a', 'i', 'o', 'u'] });
    const a = planPause({ progress, name: 'Chloé', rng: createRng(99) });
    const b = planPause({ progress, name: 'Chloé', rng: createRng(99) });
    expect(JSON.stringify(a.questions)).toBe(JSON.stringify(b.questions));
  });

  it('acquiredGraphemes ignore ce qui n\'est pas acquis et la lettre muette', () => {
    const progress = progressWith({ acquired: ['h', 'a'], learning: ['i'] });
    expect(acquiredGraphemes(progress)).toEqual(['a']);
  });
});

describe('question de repli', () => {
  it('un autre graphème mieux réussi du premier coup, jamais celui qui vient d\'échouer', () => {
    const progress = progressWith({ acquired: ['a', 'i', 'o'], rates: { a: 0.5, i: 0.9, o: 0.7 } });
    const plan = planPause({ progress, name: '', rng: createRng(11) });
    for (let k = 0; k < 10; k += 1) {
      const safer = plan.fallback('g:a');
      expect(safer).not.toBeNull();
      expect(safer!.itemId).toBe('g:i'); // le meilleur taux
      expect(safer!.retention).toBeUndefined();
    }
  });

  it('rien de mieux : un tambour', () => {
    const progress = progressWith({ acquired: ['a', 'i'], rates: { a: 1, i: 0.4 } });
    const plan = planPause({ progress, name: '', rng: createRng(2) });
    expect(plan.fallback('g:a')!.game).toBe('syllable-drum');
    const none = planPause({ progress: progressWith(), name: '', rng: createRng(2) });
    expect(none.fallback(null)!.game).toBe('syllable-drum');
  });
});
