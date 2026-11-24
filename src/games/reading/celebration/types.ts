// Types communs de la fête de fin de niveau.

/** Monde d'une scène, nommé comme dans les maquettes (et `data-world`). */
export type CelebrationWorld = 'foret' | 'mer' | 'montagne' | 'nuages';

/** Une scène : son dessin SVG (dans un repère 412 × 915), ses keyframes CSS et la boîte de l'objet. */
export interface SceneModule {
  title: string;
  /** Boîte [largeur, hauteur] dans laquelle l'objet est ajusté. */
  box: readonly [number, number];
  /** Marquage SVG ; les emplacements d'objet (`objSlot`) et les attributs `data-t` sont résolus au rendu. */
  svg: () => string;
  css: () => string;
}
