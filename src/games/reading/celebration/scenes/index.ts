// Registre des 12 scènes de fête : trois animaux par monde, dans l'ordre des maquettes. Chaque scène est un module
// chargé à la demande (une seule est jouée par fin de niveau) pour ne pas alourdir le paquet principal.
import type { CelebrationWorld, SceneModule } from '../types';

export const SCENE_ANIMALS: Record<CelebrationWorld, readonly string[]> = {
  foret: ['ecureuil', 'herisson', 'lapin'],
  mer: ['dauphin', 'crabe', 'baleine'],
  montagne: ['marmotte', 'bouquetin', 'aigle'],
  nuages: ['montgolfiere', 'licorne', 'hirondelles'],
};

const LOADERS: Record<string, () => Promise<{ scene: SceneModule }>> = {
  'foret-ecureuil': () => import('./foret-ecureuil'),
  'foret-herisson': () => import('./foret-herisson'),
  'foret-lapin': () => import('./foret-lapin'),
  'mer-dauphin': () => import('./mer-dauphin'),
  'mer-crabe': () => import('./mer-crabe'),
  'mer-baleine': () => import('./mer-baleine'),
  'montagne-marmotte': () => import('./montagne-marmotte'),
  'montagne-bouquetin': () => import('./montagne-bouquetin'),
  'montagne-aigle': () => import('./montagne-aigle'),
  'nuages-montgolfiere': () => import('./nuages-montgolfiere'),
  'nuages-licorne': () => import('./nuages-licorne'),
  'nuages-hirondelles': () => import('./nuages-hirondelles'),
};

/** Charge la scène `foret-lapin`, etc. ; null si la clé est inconnue. */
export async function loadScene(key: string): Promise<SceneModule | null> {
  const load = LOADERS[key];
  return load ? (await load()).scene : null;
}
