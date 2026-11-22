// Parcours de l'app : un seul, « ms » affiché « Maternelle ». `Profile.trackId` reste stocké (export/import, fiches
// de Petits Malins) ; un parcours inconnu est toléré et résolu comme le parcours unique.
import type { Track } from './types';

const TRACKS: readonly Track[] = [{ id: 'ms', title: 'Maternelle' }];

export function getTracks(): Track[] {
  return TRACKS.slice();
}

export function getTrack(trackId: string): Track | undefined {
  return TRACKS.find((track) => track.id === trackId);
}

/** F11 : un parcours inconnu (sauvegarde importée de Petits Malins, ex. « ce1 ») n'est jamais rejeté : on se replie sur « ms ». */
export function getTrackOrDefault(trackId: string): Track {
  return getTrack(trackId) ?? (TRACKS[0] as Track);
}

/** Libellé du parcours pour le parent : « Maternelle » (un seul parcours). */
export function trackLabel(trackId: string): string {
  return getTrackOrDefault(trackId).title;
}
