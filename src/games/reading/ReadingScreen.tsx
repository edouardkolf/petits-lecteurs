// Séance d'un niveau de lecture (route `#/reading/<niveau>`, LECTURE.md §2 et §16, LECTURE-APP.md §3) : la séance
// démarre tout de suite, puis la fête de fin ; tout retour mène à la carte d'aventure (`#/reading` seul y redirige).
// La progression n'est jamais stockée : elle est recalculée à partir des séances.
import { useEffect, useRef, useState } from 'preact/hooks';
import { useProfile } from '../../socle/app/context';
import { returnTo } from '../../socle/app/routes';
import { getSettings } from '../../socle/storage/settings';
import { createRng } from '../../engine/rng';
import { IconButton } from '../../socle/ui/IconButton';
import { Icon } from '../../socle/ui/icons/Icon';
import { checkVoice } from '../../socle/ui/voice';
import { listReadings } from '../../socle/storage/readings';
import { computeProgress, type ReadingSettings } from './progress';
import { getLevel, isLevelPass, isPlayable, levelProgress, levelState, type LevelProgress, type ReadingLevel } from './levels';
import { planLevel } from './session';
import { ReadingEnd, type EndInfo } from './ReadingEnd';
import { ReadingSession } from './ReadingSession';
import type { ReadingAnswer, ReadingProgress, ReadingSessionPlan } from './types';
import './reading.css';

interface ActiveSession {
  plan: ReadingSessionPlan;
  level: ReadingLevel;
  review: boolean;
  /** Parcours avant la séance (pour savoir si le niveau vient d'être gagné). */
  before: LevelProgress;
}

interface Loaded {
  /** Maîtrise des items (leurres, statistiques). */
  progress: ReadingProgress;
  /** Position dans le parcours de niveaux. */
  levels: LevelProgress;
  /** Mode admin : tous les niveaux sont ouverts. */
  unlockAll: boolean;
}

type Phase = 'loading' | 'session' | 'end' | 'error';

interface ReadingScreenProps {
  /** Niveau à jouer tout de suite (séance lancée depuis la carte d'aventure). */
  levelId: string;
}

export function ReadingScreen({ levelId }: ReadingScreenProps) {
  const { profile } = useProfile();
  const [phase, setPhase] = useState<Phase>('loading');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [end, setEnd] = useState<EndInfo | null>(null);
  const aliveRef = useRef(true);
  const seedRef = useRef(Date.now() >>> 0);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /** Recharge les séances et recalcule la progression ; renvoie null en cas d'échec. */
  async function loadProgress(): Promise<Loaded | null> {
    if (!profile) return null;
    try {
      const [records, appSettings] = await Promise.all([listReadings(profile.id), getSettings()]);
      const settings = profile.gameSettings?.reading;
      return {
        progress: computeProgress(records, settings),
        levels: levelProgress(records, settings),
        unlockAll: appSettings.adminUnlockAll === true,
      };
    } catch (err) {
      console.error('reading progress failed', err);
      return null;
    }
  }

  async function reload() {
    const [next, voice] = await Promise.all([loadProgress(), checkVoice().catch(() => null)]);
    if (!aliveRef.current) return;
    if (next) {
      // Depuis la carte : niveau inconnu, verrouillé ou voix absente → retour à la carte (qui montre la cause).
      const level = getLevel(levelId);
      const state = level ? levelState(next.levels, level, { unlockAll: next.unlockAll }) : 'locked';
      setLoaded(next);
      if (!level || !isPlayable(state) || voice?.status !== 'ready') {
        returnTo('map');
        return;
      }
      start(level, state === 'done', next);
    } else {
      setPhase((p) => (p === 'loading' ? 'error' : p));
    }
  }

  useEffect(() => {
    if (profile) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, levelId]);

  function start(level: ReadingLevel, review: boolean, from: Loaded | null = loaded) {
    if (!from) return;
    try {
      seedRef.current = (seedRef.current + 0x9e3779b9) >>> 0;
      const rng = createRng((Date.now() ^ seedRef.current) >>> 0);
      const plan = planLevel(level, from.progress, rng);
      setSession({ plan, level, review, before: from.levels });
      setPhase('session');
    } catch (err) {
      console.error('reading planLevel failed', err);
    }
  }

  async function onFinish(answers: readonly ReadingAnswer[]) {
    const current = session;
    if (!current) return;
    const after = await loadProgress();
    if (!aliveRef.current) return;
    const { level, plan } = current;
    const passed = isLevelPass({ status: 'completed', planned: plan.questions.length, answers: [...answers] });
    const wasDone = current.before.passed.has(level.id);
    const nowDone = after ? after.levels.passed.has(level.id) : wasDone;
    const justValidated = !wasDone && nowDone;
    if (after) setLoaded(after);
    setEnd({
      level,
      review: current.review,
      passed,
      justValidated,
      next: justValidated ? (after?.levels.current ?? null) : null,
      programFinished: justValidated && Boolean(after?.levels.finished),
    });
    setSession(null);
    setPhase('end');
  }

  function backToMap() {
    returnTo('map');
  }

  if (!profile) return null;

  return (
    <div class="reading" data-testid="reading" data-phase={phase}>
      {phase === 'loading' && <div class="screen rd-loading" />}
      {phase === 'error' && (
        <div class="screen rd-loading">
          <IconButton
            size={72}
            onClick={() => returnTo('map')}
            aria-label="Retour à la carte"
            data-testid="to-map"
          >
            <Icon name="map" size={44} />
          </IconButton>
        </div>
      )}
      {phase === 'session' && session && (
        <ReadingSession
          plan={session.plan}
          review={session.review}
          profileId={profile.id}
          onFinish={onFinish}
          exitTo="map"
        />
      )}
      {phase === 'end' && end && <ReadingEnd info={end} profileId={profile.id} onContinue={backToMap} />}
    </div>
  );
}
