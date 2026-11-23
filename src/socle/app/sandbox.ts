// Mode test (bac à sable admin) : actions communes au badge, à son overlay et aux Réglages.
// Le drapeau et la base séparée vivent dans `storage/db.ts` ; ici, seulement « puis on recharge ».
import { deleteSandboxDB, setSandboxFlag } from '../storage';

function reloadAtRoot(): void {
  try {
    history.replaceState(history.state, '', `${location.pathname}${location.search}#/`);
  } catch {
    /* sans importance : on recharge quand même */
  }
  location.reload();
}

/** Entre en mode test : base vide et séparée, l'app repart sur le premier lancement. */
export function enterSandbox(): void {
  if (setSandboxFlag(true)) reloadAtRoot();
}

/** Quitte le mode test : retour aux vraies données (la base de test reste, « Recommencer » la vide). */
export function leaveSandbox(): void {
  setSandboxFlag(false);
  reloadAtRoot();
}

/** Efface la base de test puis recharge : premier lancement à nouveau. */
export async function resetSandbox(): Promise<void> {
  await deleteSandboxDB();
  reloadAtRoot();
}
