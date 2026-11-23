// Parcours de premier lancement (parent) : démo, code parent, fiche enfant, test de la voix, passage du téléphone.
// DÉCISION : aucun drapeau persisté. L'état se DÉDUIT des données : tant qu'aucun enfant n'existe, le parcours se joue ;
// dès qu'un profil existe (créé par le parcours, importé, ou présent avant la mise à jour de l'app), il n'apparaît plus.
// Une app mise à jour (code déjà créé, profils présents) ne voit donc jamais le parcours, et le mode test (base vide)
// le rejoue depuis le début. Pur : testé sans navigateur.
import type { VoiceCheck } from '../ui/voice';

export type OnboardingStep = 'demo' | 'pin' | 'child' | 'voice' | 'handoff';

/**
 * Première étape du parcours, ou `null` s'il ne doit pas s'afficher.
 * Code déjà créé mais aucun enfant (parcours interrompu, ou tous les enfants supprimés) : la démo est sautée,
 * on reprend au code parent (saisie), puis la fiche enfant.
 */
export function onboardingStart(input: { hasPin: boolean; profileCount: number }): OnboardingStep | null {
  if (input.profileCount > 0) return null;
  return input.hasPin ? 'pin' : 'demo';
}

/** Le test de voix doit-il montrer directement le guide ? Voix indisponible ou son coupé : oui. */
export function voiceNeedsGuide(check: Pick<VoiceCheck, 'status'> | null): boolean {
  return check === null || check.status !== 'ready';
}
