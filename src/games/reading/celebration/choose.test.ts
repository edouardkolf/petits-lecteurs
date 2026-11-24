import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels';
import { celebrationObject, celebrationWorld, drawFromBag, type Bag } from './choose';
import { loadScene, SCENE_ANIMALS } from './scenes';
import { renderScene, resolveDataT } from './render';
import { buildObject } from './object';

describe('objet de la fête', () => {
  it('lettre du niveau pour les jeux de lettres, étoile pour tous les autres', () => {
    for (const level of LEVELS) {
      const object = celebrationObject(level);
      if (['letter-sound', 'sound-gate', 'first-sound', 'word-start'].includes(level.game)) {
        expect(object, level.id).toMatch(/^[A-ZÉ]{1,2}$/);
      } else {
        expect(object, level.id).toBe('star');
      }
    }
  });

  it('capitales du graphème, sons à deux lettres compris', () => {
    const byId = (id: string) => LEVELS.find((l) => l.id === id)!;
    expect(celebrationObject(byId('sound-a'))).toBe('A');
    expect(celebrationObject(byId('sound-ch'))).toBe('CH');
    expect(celebrationObject(byId('sound-ou'))).toBe('OU');
    expect(celebrationObject(byId('first-é'))).toBe('É');
    expect(celebrationObject(LEVELS[0]!)).toBe('star'); // tambour
    expect(celebrationObject(LEVELS.find((l) => l.game === 'syllable-machine')!)).toBe('star');
    expect(celebrationObject(LEVELS.find((l) => l.game === 'mystery-word')!)).toBe('star');
    expect(celebrationObject(LEVELS.find((l) => l.game === 'letter-twins')!)).toBe('star');
  });
});

describe('monde du niveau', () => {
  it('suit les mondes de la carte (26 niveaux chacun)', () => {
    expect(celebrationWorld(1)).toBe('foret');
    expect(celebrationWorld(26)).toBe('foret');
    expect(celebrationWorld(27)).toBe('mer');
    expect(celebrationWorld(53)).toBe('montagne');
    expect(celebrationWorld(79)).toBe('nuages');
    expect(celebrationWorld(104)).toBe('nuages');
  });
});

describe('sac mélangé des animaux', () => {
  const animals = SCENE_ANIMALS.mer;

  it('montre les trois animaux avant d’en répéter un, sans jamais enchaîner deux fois le même', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      let s = seed;
      const rng = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      let bag: Bag | undefined;
      const seen: string[] = [];
      for (let i = 0; i < 12; i += 1) {
        const drawn = drawFromBag(bag, animals, rng);
        bag = drawn.bag;
        seen.push(drawn.animal);
      }
      for (let t = 0; t < 4; t += 1) expect(new Set(seen.slice(t * 3, t * 3 + 3)).size).toBe(3);
      for (let i = 1; i < seen.length; i += 1) expect(seen[i]).not.toBe(seen[i - 1]);
    }
  });

  it('ignore un sac abîmé ou périmé', () => {
    const { animal } = drawFromBag({ left: ['licorne'], last: 'zzz' }, animals);
    expect(animals).toContain(animal);
  });
});

describe('rendu des scènes', () => {
  const objects = ['M', 'OU', 'CH', 'É', 'W', 'I', 'star'];
  const keys = Object.entries(SCENE_ANIMALS).flatMap(([world, list]) => list.map((a) => `${world}-${a}`));

  it('les 12 scènes se rendent pour tous les types d’objet, sans attribut ni valeur non résolus', async () => {
    expect(keys).toHaveLength(12);
    expect(await loadScene('inconnu-xx')).toBeNull();
    for (const key of keys) {
      const scene = (await loadScene(key))!;
      expect(scene, key).not.toBeNull();
      for (const object of objects) {
        const r = renderScene(scene, object);
        expect(r.svg).not.toContain('data-t=');
        expect(r.svg).not.toMatch(/NaN|undefined|\{[^}]*(hw|hh)[^}]*\}/);
        expect(r.css).not.toContain('NaN');
        expect(r.css).toContain('forwards');
        expect(r.css).not.toContain('infinite');
        expect(r.vars).not.toContain('NaN');
      }
    }
  });

  it('la boîte plus large des sons à deux lettres garde la hauteur d’une lettre seule', () => {
    const one = buildObject('M', 170, 112);
    const two = buildObject('OU', 170, 112);
    expect(two.hw).toBeGreaterThan(one.hw);
    expect(Math.abs(two.hh - one.hh)).toBeLessThan(2);
  });

  it('résout data-t : remplace l’attribut existant ou l’ajoute', () => {
    const o = buildObject('M', 170, 112);
    const out = resolveDataT('<ellipse data-t="rx={hw+10}" rx="60" ry="9"/><g data-t="transform=translate({100-hw} 5)">', o);
    expect(out).toContain(`rx="${Math.round((o.hw + 10) * 100) / 100}"`);
    expect(out).not.toContain('rx="60"');
    expect(out).toContain('ry="9"');
    expect(out).toMatch(/<g transform="translate\([\d.]+ 5\)">/);
  });
});
