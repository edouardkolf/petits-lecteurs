import { describe, expect, it } from 'vitest';
import { createRng } from '../../engine/rng';
import type { ReadingRecord } from '../../socle/storage/readings';
import { gamesForItem, GRAPHEMES } from './curriculum';
import { getLevel, isLevelPass, isPlayable, LEVELS, levelProgress, levelState, passMark, type ReadingLevel } from './levels';
import { computeProgress } from './progress';
import { getPicture, picturesStartingWith } from './pictures';
import { GATE_MAX_RUN, planLevel, SOUND_GATE_EXCLUDED, SOUND_GATE_OTHERS, soundGateAnswers } from './session';
import { soundText } from './speech';
import type { ReadingAnswer } from './types';

function answer(correct: boolean, retry = false): ReadingAnswer {
  return {
    itemId: 'k:count',
    game: 'syllable-drum',
    target: 'chat',
    correct,
    chosen: correct ? null : '2',
    choiceCount: 3,
    replays: 0,
    hinted: false,
    retry,
    ms: 1000,
    at: 1000,
  };
}

let seq = 0;
/** Séance d'un niveau avec `right` bonnes réponses sur `planned`. */
function session(levelId: string | undefined, right: number, planned = 5, over: Partial<ReadingRecord> = {}): ReadingRecord {
  seq += 1;
  return {
    id: `r${seq}`,
    profileId: 'p1',
    status: 'completed',
    startedAt: seq * 1000,
    endedAt: seq * 1000 + 500,
    activeMs: 500,
    stage: 1,
    planned,
    newItemId: null,
    demos: [],
    answers: Array.from({ length: planned }, (_, i) => answer(i < right)),
    review: false,
    ...(levelId ? { levelId } : {}),
    ...over,
  } as ReadingRecord;
}

const level = (n: number): ReadingLevel => LEVELS[n - 1] as ReadingLevel;

describe('parcours de niveaux : structure', () => {
  it('commence par le tambour, la première lettre arrive au niveau 2, et les pistes alternent', () => {
    expect(LEVELS.slice(0, 10).map((l) => l.id)).toEqual([
      'drum-1',
      'sound-a',
      'drum-2',
      'first-a',
      'start-1',
      'sound-i',
      'start-2',
      'first-i',
      'end-1',
      'sound-o',
    ]);
    // Jusqu'à la dernière lettre du programme, un niveau sur deux est un niveau « lettres ».
    const lastLetter = LEVELS.findIndex((l) => l.id === 'sound-g');
    for (let i = 0; i <= lastLetter + 1; i += 1) {
      expect(LEVELS[i]?.track === 'letters', `niveau ${i + 1}`).toBe(i % 2 === 1);
    }
  });

  it('identifiants uniques, rangs continus, un jeu compatible avec l’item', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    LEVELS.forEach((l, i) => {
      expect(l.index).toBe(i + 1);
      // « word-start » et « sound-gate » ne sont que des variantes (niveaux first-a et sound-a) : pas des jeux libres d'item.
      const free = l.game === 'word-start' ? 'first-sound' : l.game === 'sound-gate' ? 'letter-sound' : l.game;
      expect(gamesForItem(l.item), l.id).toContain(free);
      expect(getLevel(l.id)).toBe(l);
    });
  });

  it('chaque lettre du programme a son niveau « son », et « son dans un mot » quand elle a des images', () => {
    for (const g of GRAPHEMES.filter((x) => x.gated)) {
      const sound = getLevel(`sound-${g.id}`);
      expect(sound, g.id).toBeDefined();
      expect(sound?.known).toContain(g.id);
      const first = getLevel(`first-${g.id}`);
      expect(Boolean(first), g.id).toBe(gamesForItem(`g:${g.id}`).includes('first-sound'));
      if (first) expect(first.index).toBeGreaterThan(sound!.index);
    }
    // Les lettres connues ne font que s'ajouter au fil du parcours.
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i]!.known.slice(0, LEVELS[i - 1]!.known.length)).toEqual(LEVELS[i - 1]!.known);
    }
  });

  it('la machine à syllabes n’arrive qu’après L et R, les mots à lire qu’après toutes les lettres', () => {
    for (const l of LEVELS) {
      if (l.game === 'syllable-machine') expect(l.known).toEqual(expect.arrayContaining(['l', 'r']));
      if (l.game === 'mystery-word') expect(l.known.length).toBeGreaterThanOrEqual(23);
      if (l.item === 'k:blend-stop') expect(l.known).toContain('p');
    }
    expect(LEVELS.some((l) => l.game === 'syllable-machine')).toBe(true);
    expect(LEVELS.some((l) => l.game === 'letter-twins')).toBe(true);
  });

  it('first-a joue « word-start » (une seule lettre connue) ; les autres first-* restent « first-sound »', () => {
    const a = getLevel('first-a')!;
    expect(a.game).toBe('word-start');
    expect(a.item).toBe('g:a');
    expect(a.known).toEqual(['a']);
    expect(a.index).toBe(4);
    expect(a.questions).toBe(5);
    const firsts = LEVELS.filter((l) => l.id.startsWith('first-'));
    expect(firsts.length).toBeGreaterThan(10);
    for (const l of firsts.filter((x) => x.id !== 'first-a')) {
      expect(l.game, l.id).toBe('first-sound');
      expect(l.known.length, l.id).toBeGreaterThan(1);
    }
    expect(LEVELS.filter((l) => l.game === 'word-start').map((l) => l.id)).toEqual(['first-a']);
    expect(LEVELS.length).toBe(104);
  });

  it('sound-a (niveau 2) joue « sound-gate » (une seule lettre connue) ; les autres sound-* restent « letter-sound »', () => {
    const a = getLevel('sound-a')!;
    expect(a.game).toBe('sound-gate');
    expect(a.item).toBe('g:a');
    expect(a.known).toEqual(['a']);
    expect(a.index).toBe(2);
    expect(a.questions).toBe(5);
    expect(LEVELS.filter((l) => l.game === 'sound-gate').map((l) => l.id)).toEqual(['sound-a']);
    for (const l of LEVELS.filter((x) => x.id.startsWith('sound-') && x.id !== 'sound-a')) {
      expect(l.game, l.id).toBe('letter-sound');
    }
    // Le parcours ne change ni de taille ni d'identifiants.
    expect(LEVELS.length).toBe(104);
    expect(LEVELS.slice(0, 10).map((l) => l.id)).toEqual([
      'drum-1', 'sound-a', 'drum-2', 'first-a', 'start-1', 'sound-i', 'start-2', 'first-i', 'end-1', 'sound-o',
    ]);
  });

  it('séances courtes aux étapes 1 et 2 (5 questions), 8 ensuite', () => {
    for (const l of LEVELS) expect(l.questions, l.id).toBe(l.stage <= 2 ? 5 : 8);
    expect(passMark(5)).toBe(4);
    expect(passMark(8)).toBe(6);
  });
});

describe('parcours de niveaux : déblocage', () => {
  it('sans séance : niveau 1 en cours, le reste verrouillé', () => {
    const p = levelProgress([]);
    expect(p.current?.id).toBe('drum-1');
    expect(levelState(p, level(1))).toBe('current');
    expect(levelState(p, level(2))).toBe('locked');
    expect(p.finished).toBe(false);
  });

  it('4 sur 5 gagne le niveau et ouvre le suivant ; 3 sur 5 le laisse à rejouer', () => {
    const lost = levelProgress([session('drum-1', 3)]);
    expect(lost.current?.id).toBe('drum-1');
    expect(lost.attempts['drum-1']).toBe(1);
    const won = levelProgress([session('drum-1', 3), session('drum-1', 4)]);
    expect(won.passed.has('drum-1')).toBe(true);
    expect(won.current?.id).toBe('sound-a');
    expect(levelState(won, level(1))).toBe('done');
    expect(levelState(won, level(3))).toBe('locked');
  });

  it('un niveau gagné le reste, même rejoué et raté ensuite', () => {
    const p = levelProgress([session('drum-1', 5), session('drum-1', 1, 5, { review: true })]);
    expect(p.passed.has('drum-1')).toBe(true);
  });

  it('ne comptent pas : séance abandonnée, séance incomplète, réponses reposées, séance sans niveau, niveau inconnu', () => {
    expect(isLevelPass(session('drum-1', 5, 5, { status: 'abandoned' }))).toBe(false);
    const short = session('drum-1', 4);
    short.answers = short.answers.slice(0, 4);
    expect(isLevelPass(short)).toBe(false);
    const retried = session('drum-1', 3);
    retried.answers.push(answer(true, true), answer(true, true));
    expect(isLevelPass(retried)).toBe(false);
    const p = levelProgress([session(undefined, 5), session('niveau-disparu', 5), session('drum-1', 5, 5, { status: 'abandoned' })]);
    expect(p.current?.id).toBe('drum-1');
  });

  it('6 sur 8 gagne un niveau long, 5 sur 8 non', () => {
    expect(isLevelPass(session('sound-l', 6, 8))).toBe(true);
    expect(isLevelPass(session('sound-l', 5, 8))).toBe(false);
  });

  it('étape de départ : les niveaux des étapes d’avant sont tenus pour gagnés', () => {
    const p2 = levelProgress([], { startStage: 2 });
    expect(p2.current?.id).toBe('sound-a');
    const p3 = levelProgress([], { startStage: 3 });
    expect(p3.current?.stage).toBe(3);
    expect(LEVELS.filter((l) => l.stage < 3).every((l) => p3.passed.has(l.id))).toBe(true);
  });

  it('tout gagné : parcours fini', () => {
    const p = levelProgress(LEVELS.map((l) => session(l.id, l.questions, l.questions)));
    expect(p.finished).toBe(true);
    expect(p.current).toBeNull();
  });
});

describe('planLevel : une séance = un niveau = un seul jeu', () => {
  const blank = computeProgress([]);

  it('pour chaque niveau et 20 graines : bon nombre de questions, un seul jeu, réponse parmi les choix', () => {
    for (const l of LEVELS) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const plan = planLevel(l, blank, createRng(seed * 7919 + l.index));
        const label = `${l.id} graine ${seed}`;
        expect(plan.levelId, label).toBe(l.id);
        expect(plan.stage, label).toBe(l.stage);
        expect(plan.questions.length, label).toBe(l.questions);
        for (const q of plan.questions) {
          expect(q.game, label).toBe(l.game);
          if (q.game === 'syllable-drum') {
            expect(['1', '2', '3'], label).toContain(q.answer);
          } else {
            const ids = q.choices.map((c) => c.id);
            expect(ids, label).toContain(q.answer);
            expect(new Set(ids).size, label).toBe(ids.length);
            expect(ids.length, label).toBeGreaterThanOrEqual(2);
          }
        }
        expect(plan.demos, label).toEqual([l.game]);
      }
    }
  });

  it('niveau « son » : la lettre du niveau est présentée en premier et domine la séance', () => {
    const plan = planLevel(getLevel('sound-o')!, blank, createRng(3));
    expect(plan.questions[0]?.isNew).toBe(true);
    expect(plan.questions[0]?.target).toBe('o');
    expect(plan.newItemId).toBe('g:o');
    expect(plan.questions.filter((q) => q.target === 'o').length).toBe(3);
    // Le reste révise des lettres déjà vues, jamais une lettre à venir.
    for (const q of plan.questions) expect(['a', 'i', 'o']).toContain(q.target);
  });

  it('première lettre : tout le niveau porte sur l’item A (réponses « a » ou « pas a »)', () => {
    const plan = planLevel(getLevel('sound-a')!, blank, createRng(5));
    expect(plan.questions.every((q) => q.itemId === 'g:a' && q.game === 'sound-gate')).toBe(true);
  });

  it('first-a (« word-start ») : 5 questions sur A, 2 images dont la bonne, cibles toutes différentes', () => {
    const l = getLevel('first-a')!;
    for (let seed = 1; seed <= 40; seed += 1) {
      const plan = planLevel(l, blank, createRng(seed));
      expect(plan.questions).toHaveLength(5);
      const targets = new Set<string>();
      for (const q of plan.questions) {
        expect(q.game).toBe('word-start');
        expect(q.target).toBe('a');
        expect(q.itemId).toBe('g:a');
        expect(q.stimulus).toEqual({ kind: 'sound', grapheme: 'a' });
        expect(q.choices).toHaveLength(2);
        expect(q.speakChoices).toBe(true);
        const ids = q.choices.map((c) => c.id);
        expect(new Set(ids).size).toBe(2);
        expect(ids).toContain(q.answer);
        expect(picturesStartingWith('a').map((p) => p.id)).toContain(q.answer);
        targets.add(q.answer);
        const decoy = getPicture(ids.find((i) => i !== q.answer) as string)!;
        const base = decoy.word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        expect(decoy.firstSound, decoy.word).not.toBe('a');
        expect(decoy.firstSound, decoy.word).not.toBe('é');
        // Jamais un mot dont la première voyelle sonne comme « a » (an, am, ai, au, eau, en…) ni une voyelle initiale.
        expect(base, decoy.word).not.toMatch(/^h?[aeiouy]/);
      }
      expect(targets.size, `graine ${seed}`).toBe(5);
    }
  });

  it('first-a : déterministe pour une graine, la bonne image change de côté', () => {
    const l = getLevel('first-a')!;
    const a = planLevel(l, blank, createRng(9));
    expect(planLevel(l, blank, createRng(9)).questions).toEqual(a.questions);
    let left = 0;
    let right = 0;
    for (let seed = 1; seed <= 60; seed += 1) {
      const qs = planLevel(l, blank, createRng(seed)).questions;
      qs.forEach((q) => (q.choices[0]?.id === q.answer ? (left += 1) : (right += 1)));
      // jamais plus de deux fois de suite du même côté
      for (let i = 2; i < qs.length; i += 1) {
        const sides = [i - 2, i - 1, i].map((k) => (qs[k]!.choices[0]?.id === qs[k]!.answer ? 0 : 1));
        expect(new Set(sides).size, `graine ${seed}`).toBe(2);
      }
    }
    expect(left).toBeGreaterThan(60);
    expect(right).toBeGreaterThan(60);
  });

  it('« la lettre qui chante » : mot de la félicitation varié, mot repère gardé pour la présentation', () => {
    const l = getLevel('sound-a')!;
    for (let seed = 1; seed <= 40; seed += 1) {
      const plan = planLevel(l, blank, createRng(seed));
      const [first, ...others] = plan.questions;
      const rest = others.filter((q) => q.answer === 'a');
      expect(first?.isNew).toBe(true);
      expect(first?.praisePicture).toBeUndefined();
      expect(first?.prompt.some((s) => 'text' in s && s.text === 'avion')).toBe(true);
      const words = rest.map((q) => q.praisePicture);
      expect(words.every((w) => w !== undefined && picturesStartingWith('a').some((p) => p.id === w))).toBe(true);
      // pas de répétition tant qu'il en reste, et pas le mot repère déjà dit à la présentation
      expect(new Set(words).size, `graine ${seed}`).toBe(words.length);
      expect(words).not.toContain('avion');
      for (const q of rest) {
        const w = getPicture(q.praisePicture as string)!.word;
        expect(q.praise.some((s) => 'text' in s && s.text === w)).toBe(true);
        expect(q.praise.some((s) => 'text' in s && s.text === 'comme')).toBe(true);
      }
    }
    expect(planLevel(l, blank, createRng(4)).questions).toEqual(planLevel(l, blank, createRng(4)).questions);
  });

  it('« la lettre qui chante » sans autre image : le mot repère sert de repli', () => {
    const plan = planLevel(getLevel('sound-u')!, blank, createRng(2));
    const pics = picturesStartingWith('u');
    for (const q of plan.questions.filter((x) => !x.isNew && x.target === 'u')) {
      expect(q.praisePicture).toBe(pics[0]?.id);
    }
  });

  it('niveau « son dans un mot » : images différentes, lettres déjà vues seulement', () => {
    const plan = planLevel(getLevel('first-i')!, blank, createRng(11));
    const pics = plan.questions.map((q) => (q.stimulus.kind === 'picture' ? q.stimulus.picture : ''));
    expect(new Set(pics).size).toBe(pics.length);
    for (const q of plan.questions) expect(['a', 'i']).toContain(q.target);
    expect(plan.questions.some((q) => q.target === 'i')).toBe(true);
  });

  it('machine à syllabes : seulement des lettres déjà présentées', () => {
    const l = LEVELS.find((x) => x.game === 'syllable-machine')!;
    for (let seed = 1; seed <= 20; seed += 1) {
      for (const q of planLevel(l, blank, createRng(seed)).questions) {
        if (q.stimulus.kind !== 'syllable') throw new Error('stimulus inattendu');
        for (const part of q.stimulus.parts) expect(l.known, `${q.target}`).toContain(part.toLowerCase());
      }
    }
  });

  it('la démonstration n’est demandée que pour un jeu jamais montré', () => {
    const seen = computeProgress([session('drum-1', 5, 5, { demos: ['syllable-drum'] })]);
    expect(planLevel(getLevel('drum-2')!, seen, createRng(1)).demos).toEqual([]);
    expect(planLevel(getLevel('sound-a')!, seen, createRng(1)).demos).toEqual(['sound-gate']);
  });
});

describe('« A ou pas A ? » (niveau sound-a)', () => {
  const l = getLevel('sound-a')!;
  const blank = computeProgress([]);

  it('suite des réponses : A d’abord, au moins 2 de chaque, jamais plus de 2 identiques d’affilée, déterministe', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed += 1) {
      const answers = soundGateAnswers(5, createRng(seed));
      expect(answers).toHaveLength(5);
      expect(answers[0]).toBe('a');
      expect(answers.filter((x) => x === 'a').length, `graine ${seed}`).toBeGreaterThanOrEqual(2);
      expect(answers.filter((x) => x === 'none').length, `graine ${seed}`).toBeGreaterThanOrEqual(2);
      for (let i = GATE_MAX_RUN; i < answers.length; i += 1) {
        expect(new Set(answers.slice(i - GATE_MAX_RUN, i + 1)).size, `graine ${seed} : ${answers.join()}`).toBe(2);
      }
      expect(soundGateAnswers(5, createRng(seed))).toEqual(answers);
      seen.add(answers.join());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('séance : 5 questions, présentation de A en premier, réponses « a » ou « none », sons « pas a » éloignés', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const plan = planLevel(l, blank, createRng(seed));
      const label = `graine ${seed}`;
      expect(plan.levelId).toBe('sound-a');
      expect(plan.newItemId).toBe('g:a');
      expect(plan.demos).toEqual(['sound-gate']);
      expect(plan.questions).toHaveLength(5);
      const [first] = plan.questions;
      expect(first?.isNew, label).toBe(true);
      expect(first?.answer, label).toBe('a');
      expect(first?.prompt.some((s) => 'text' in s && s.text === 'comme'), label).toBe(true);
      expect(first?.prompt.some((s) => 'text' in s && s.text === 'avion'), label).toBe(true);
      const heard = new Set<string>();
      for (const q of plan.questions) {
        expect(q.game).toBe('sound-gate');
        expect(q.itemId).toBe('g:a');
        expect(q.choices.map((c) => c.id), label).toEqual(['a', 'none']);
        expect(q.choices[0]?.kind).toBe('letter');
        expect(q.choices[1]?.kind).toBe('none');
        expect(q.choices[1]?.label).toBeUndefined();
        expect(q.stimulus).toEqual({ kind: 'sound', grapheme: q.target });
        expect(q.speakChoices).toBe(false);
        if (q.answer === 'a') {
          expect(q.target).toBe('a');
          expect(q.praisePicture === undefined, label).toBe(q === first);
          if (q !== first) expect(q.praise.some((s) => 'text' in s && s.text === 'comme'), label).toBe(true);
        } else {
          expect(q.answer).toBe('none');
          expect(SOUND_GATE_OTHERS, label).toContain(q.target);
          expect(SOUND_GATE_EXCLUDED, label).not.toContain(q.target);
          expect(soundText(q.target)).not.toBe(soundText('a'));
          expect(heard.has(q.target), `${label} : son répété`).toBe(false);
          heard.add(q.target);
          expect(q.praise).toEqual([{ text: 'Bravo !' }]);
          expect(q.praisePicture).toBeUndefined();
          expect(q.isNew).toBe(false);
        }
        // Rappel court : le son seul (avec la présentation pour la première question).
        const last = q.shortPrompt.at(-1);
        expect(last).toEqual({ text: soundText(q.target), rate: 0.8 });
        if (q !== first) expect(q.shortPrompt).toHaveLength(1);
        expect(q.prompt.some((s) => 'text' in s && /nuage/.test(s.text))).toBe(true);
      }
      const answers = plan.questions.map((q) => q.answer);
      expect(answers.filter((x) => x === 'a').length).toBeGreaterThanOrEqual(2);
      expect(answers.filter((x) => x === 'none').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('les sons « pas a » exclus ne sont jamais proposés, les autres niveaux restent inchangés', () => {
    expect(SOUND_GATE_OTHERS).toEqual(['i', 'o', 'ou', 'm', 'l']);
    for (const bad of ['é', 'an', 'ai', 'au']) expect(SOUND_GATE_OTHERS).not.toContain(bad);
    for (const lv of LEVELS.filter((x) => x.game === 'letter-sound').slice(0, 5)) {
      for (const q of planLevel(lv, blank, createRng(3)).questions) expect(q.game).toBe('letter-sound');
    }
  });

  it('déterministe pour une graine', () => {
    expect(planLevel(l, blank, createRng(8)).questions).toEqual(planLevel(l, blank, createRng(8)).questions);
  });
});

describe('parcours de niveaux : mode admin', () => {
  it('unlockAll ouvre les niveaux non atteints sans toucher aux gagnés ni au niveau en cours', () => {
    const p = levelProgress([session('drum-1', 5)]);
    expect(levelState(p, level(1), { unlockAll: true })).toBe('done');
    expect(levelState(p, level(2), { unlockAll: true })).toBe('current');
    expect(levelState(p, level(3), { unlockAll: true })).toBe('open');
    expect(isPlayable('open')).toBe(true);
    expect(isPlayable('locked')).toBe(false);
  });
});
