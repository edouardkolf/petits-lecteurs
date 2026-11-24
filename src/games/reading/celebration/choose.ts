// Choix de la fête de fin de niveau : l'objet (lettre du niveau ou étoile), le monde, et l'animal (sac mélangé).
// Pur, sauf la lecture/écriture facultative du sac dans localStorage (le perdre est sans conséquence).
import { worldIdAt, worldIndexForLevel, type WorldId } from '../../../screens/map/layout';
import { getGrapheme } from '../curriculum';
import type { ReadingGameId } from '../types';
import type { ReadingLevel } from '../levels';
import { SCENE_ANIMALS } from './scenes';
import type { CelebrationWorld } from './types';

/** Jeux de lettres : l'objet de la fête est la lettre du niveau (item `g:<id>`). Les autres niveaux reçoivent une étoile. */
const LETTER_GAMES: ReadonlySet<ReadingGameId> = new Set<ReadingGameId>([
  'letter-sound',
  'sound-gate',
  'first-sound',
  'word-start',
]);

/** Objet de la fête : capitales du graphème (« A », « CH », « OU »…) pour un niveau de lettre, sinon `'star'`. */
export function celebrationObject(level: Pick<ReadingLevel, 'game' | 'item'>): string {
  if (!LETTER_GAMES.has(level.game) || !level.item.startsWith('g:')) return 'star';
  const grapheme = getGrapheme(level.item.slice(2));
  return grapheme ? grapheme.upper : 'star';
}

const WORLD_KEY: Record<WorldId, CelebrationWorld> = {
  forest: 'foret',
  sea: 'mer',
  mountain: 'montagne',
  clouds: 'nuages',
};

/** Monde du niveau sur la carte d'aventure (un niveau d'index `level.index`, à partir de 1). */
export function celebrationWorld(levelIndex: number): CelebrationWorld {
  return WORLD_KEY[worldIdAt(worldIndexForLevel(levelIndex - 1))];
}

/** État du sac d'un monde : animaux pas encore montrés dans le tour en cours, et le dernier montré. */
export interface Bag {
  left: string[];
  last: string | null;
}

/** Tire un animal du sac (le remplit et le mélange quand il est vide, sans répéter le dernier tiré). Pur. */
export function drawFromBag(bag: Bag | undefined, animals: readonly string[], rng: () => number = Math.random): { animal: string; bag: Bag } {
  let left = (bag?.left ?? []).filter((a) => animals.includes(a));
  const last = bag?.last && animals.includes(bag.last) ? bag.last : null;
  if (left.length === 0) {
    left = [...animals];
    for (let i = left.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [left[i], left[j]] = [left[j] as string, left[i] as string];
    }
    // jamais le même animal deux fois de suite, même d'un tour à l'autre
    if (left.length > 1 && left[0] === last) left.push(left.shift() as string);
  }
  const animal = left[0] as string;
  return { animal, bag: { left: left.slice(1), last: animal } };
}

const bagKey = (profileId: string) => `pl.celebration.${profileId}`;

function loadBags(profileId: string): Partial<Record<CelebrationWorld, Bag>> {
  try {
    const raw = localStorage.getItem(bagKey(profileId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<CelebrationWorld, Bag>>) : {};
  } catch {
    return {};
  }
}

/** Scène de la fête pour ce monde et ce profil, ex. `'foret-lapin'` ; le sac est conservé d'une séance à l'autre. */
export function pickScene(world: CelebrationWorld, profileId: string, rng: () => number = Math.random): string {
  const bags = loadBags(profileId);
  const { animal, bag } = drawFromBag(bags[world], SCENE_ANIMALS[world], rng);
  try {
    localStorage.setItem(bagKey(profileId), JSON.stringify({ ...bags, [world]: bag }));
  } catch {
    // stockage indisponible : le sac repart de zéro la prochaine fois, sans conséquence
  }
  return `${world}-${animal}`;
}
