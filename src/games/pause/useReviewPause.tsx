// Pause de révision côté mini-jeu (docs/specs/PAUSES-REVISION.md §2.1) : le jeu appelle `checkpoint(resume)` au début
// de chaque unité (manche suivante, dessin choisi) ou à la fin d'une case peinte, comme `useSoftEnd.checkpoint`.
// Si une pause est due, elle s'ouvre par-dessus le jeu (toujours monté) et `resume` est rappelée quand elle se
// termine. Jamais de pause sans voix (aucune consigne n'est écrite) ni pendant la fin douce.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useSession } from '../../socle/app/SessionProvider';
import { checkVoice } from '../../socle/ui/voice';
import { ReviewPause } from './ReviewPause';

export interface ReviewPauseControl {
  /** Une pause est ouverte : le jeu est en attente (le temps actif de la pause n'est pas le sien). */
  open: boolean;
  /**
   * À appeler quand une unité vient de finir (ou va commencer). `true` : la pause s'ouvre, ne rien commencer ;
   * `resume` sera rappelée à la fin de la pause. `false` : continuer normalement.
   */
  checkpoint: (resume: () => void) => boolean;
  /** L'écran de la pause, à rendre dans le jeu ; null tant qu'aucune n'est ouverte. */
  overlay: ComponentChildren;
}

export function useReviewPause(): ReviewPauseControl {
  const { pauseDueRef, timeUpRef } = useSession();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const voiceReadyRef = useRef(false);

  // Voix prête et son allumé ? Vérifié une fois à l'ouverture du jeu : sans voix, jamais de pause.
  useEffect(() => {
    let alive = true;
    void checkVoice()
      .then((check) => {
        if (alive) voiceReadyRef.current = check.status === 'ready';
      })
      .catch(() => {
        voiceReadyRef.current = false;
      });
    return () => {
      alive = false;
    };
  }, []);

  function checkpoint(resume: () => void): boolean {
    if (openRef.current || !pauseDueRef.current || !voiceReadyRef.current || timeUpRef.current) return false;
    openRef.current = true;
    resumeRef.current = resume;
    setOpen(true);
    return true;
  }

  function done() {
    openRef.current = false;
    setOpen(false);
    const resume = resumeRef.current;
    resumeRef.current = null;
    resume?.();
  }

  return { open, checkpoint, overlay: open ? <ReviewPause onDone={done} /> : null };
}
