// Fin de séance (LECTURE.md §2 et §16). Niveau gagné : fanfare et scène de fête du monde du niveau (un animal manipule
// la lettre du niveau, ou une étoile), sans voix ; le niveau suivant s'ouvre (il se voit sur la carte, pas ici).
// Niveau pas encore gagné : pas de fête, la voix invite à réessayer. Un seul bouton (coche) ramène à l'accueil.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { IconButton } from '../../socle/ui/IconButton';
import { Icon } from '../../socle/ui/icons/Icon';
import { playFanfare } from '../../socle/ui/sound';
import { cancelSpeech, speak } from '../../socle/ui/voice';
import { Celebration } from './celebration/Celebration';
import { celebrationObject, celebrationWorld, pickScene } from './celebration/choose';
import { LevelIcon, TRACK_COLORS } from './LevelIcon';
import type { ReadingLevel } from './levels';

export interface EndInfo {
  level: ReadingLevel;
  review: boolean;
  /** La séance atteint la barre du niveau (4 sur 5). */
  passed: boolean;
  /** Le niveau vient d'être gagné pour la première fois par cette séance. */
  justValidated: boolean;
  /** Niveau débloqué par cette séance, ou null. */
  next: ReadingLevel | null;
  /** Tout le parcours est maintenant fait. */
  programFinished: boolean;
}

interface ReadingEndProps {
  info: EndInfo;
  /** Profil de l'enfant : le choix de l'animal de la fête est mémorisé par profil. */
  profileId: string;
  onContinue: () => void;
}

/** Le bouton « continuer » apparaît quand la scène a fini son geste principal (2,2 s, comme dans les maquettes). */
const CELEBRATION_BUTTON_MS = 2200;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export function ReadingEnd({ info, profileId, onContinue }: ReadingEndProps) {
  const won = info.passed;
  const [ready, setReady] = useState(() => won && prefersReducedMotion());
  const [skipped, setSkipped] = useState(false);
  const colors = TRACK_COLORS[info.level.track];
  // Un tirage par fin de niveau gagné (le sac de chaque monde est mémorisé par profil).
  const party = useMemo(() => {
    if (!won) return null;
    const world = celebrationWorld(info.level.index);
    return { world, scene: pickScene(world, profileId), object: celebrationObject(info.level) };
  }, [won, info.level, profileId]);

  useEffect(() => {
    if (won) {
      // Niveau gagné : la musique de réussite démarre avec l'action, aucune voix.
      playFanfare();
      const show = window.setTimeout(() => setReady(true), CELEBRATION_BUTTON_MS);
      return () => window.clearTimeout(show);
    }
    const talk = window.setTimeout(() => void speak('On réessaie !', { rate: 0.9 }), 600);
    const show = window.setTimeout(() => setReady(true), 1200);
    return () => {
      window.clearTimeout(talk);
      window.clearTimeout(show);
      cancelSpeech();
    };
  }, [won]);

  return (
    <div
      class={`screen rd-end${party ? ' rd-end--party' : ''}`}
      data-testid="reading-end"
      data-passed={info.passed ? 'true' : 'false'}
      data-validated={info.justValidated ? 'true' : undefined}
      style={`--rd-main:${colors.main};--rd-soft:${colors.soft};--rd-dark:${colors.dark};--m-dark:${colors.dark};--medal:110px`}
    >
      {party ? (
        <Celebration
          world={party.world}
          scene={party.scene}
          object={party.object}
          skipped={skipped}
          onTap={() => {
            setSkipped(true);
            setReady(true);
          }}
        />
      ) : (
        <div class="rd-end__stars" aria-hidden="true">
          <span class="rd-end__medal">
            <LevelIcon level={info.level} />
          </span>
        </div>
      )}

      <div class="rd-end__action">
        {ready && (
          <IconButton size={88} variant="primary" onClick={onContinue} aria-label="Continuer" data-testid="reading-end-continue">
            <Icon name="check" size={56} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
