// Pause de révision (docs/specs/PAUSES-REVISION.md) : un écran posé PAR-DESSUS le mini-jeu, qui reste monté sous lui
// (état conservé). L'avatar annonce la pause, 2 à 3 questions de lecture, une petite fête, puis retour au jeu là où
// il en était. Les réponses sont enregistrées à part (`context: 'pause'`), le temps est imputé à la lecture.
import { useEffect, useRef, useState } from 'preact/hooks';
import { createRng } from '../../engine/rng';
import { useProfile } from '../../socle/app/context';
import { useSession } from '../../socle/app/SessionProvider';
import { listReadings, isPauseRecord } from '../../socle/storage/readings';
import { Emoji } from '../../socle/ui/Emoji';
import { Icon } from '../../socle/ui/icons/Icon';
import { playFanfare } from '../../socle/ui/sound';
import { cancelSpeech, speak, speakSequence } from '../../socle/ui/voice';
import { computeProgress } from '../reading/progress';
import { STAGE_COLORS, StageIcon } from '../reading/StageIcon';
import { useQuestionFlow, type FlowEnd } from '../reading/useQuestionFlow';
import { TutorialHand } from '../../socle/ui/TutorialHand';
import { READING_VIEWS } from '../reading/views';
import { planPause, type PausePlan } from './content';
import '../reading/reading.css';
import './pause.css';

/** La voix annonce la pause (phrase courte) ; la toute première fois, on explique en une phrase de plus. */
export const ANNOUNCE_TEXT = "C'est l'heure de lire !";
export const ANNOUNCE_FIRST_TEXT = 'Je te pose deux ou trois questions.';
const ANNOUNCE_MAX_MS = 5000;
const CELEBRATE_MS = 2200;
const GENTLE_MS = 1600;
const CONFETTI_COLORS = ['#ff6f83', '#ffc53d', '#4fbd63', '#3fa7ee', '#9a78e8', '#ffa62b'];
const PAUSE_COLORS = STAGE_COLORS[5];

type Phase = 'loading' | 'announce' | 'quiz' | 'end';

interface ReviewPauseProps {
  /** La pause est finie (ou close faute de temps) : retour au jeu. */
  onDone: () => void;
}

export function ReviewPause({ onDone }: ReviewPauseProps) {
  const { profile } = useProfile();
  const { timeUp, completePause, setPauseOpen } = useSession();
  const [phase, setPhase] = useState<Phase>('loading');
  const [plan, setPlan] = useState<PausePlan | null>(null);
  const [hard, setHard] = useState(false);
  const aliveRef = useRef(true);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const timersRef = useRef(new Set<number>());

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      if (aliveRef.current) fn();
    }, ms);
    timersRef.current.add(id);
  }

  /** `complete` : la pause est faite, le compteur repart de zéro ; sinon (temps écoulé), il reste dû. */
  function finish(complete: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    if (complete) completePause();
    onDoneRef.current();
  }

  useEffect(() => {
    aliveRef.current = true;
    setPauseOpen(true);
    const timers = timersRef.current;
    return () => {
      aliveRef.current = false;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      cancelSpeech();
      setPauseOpen(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le minuteur ou le quota tombe pendant la pause : on rend la main tout de suite à la fin douce du jeu.
  useEffect(() => {
    if (timeUp) finish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  // Choix du contenu à partir des séances de l'aventure, puis annonce de l'avatar.
  useEffect(() => {
    if (!profile) return;
    void (async () => {
      let next: PausePlan;
      let first = false;
      try {
        const records = await listReadings(profile.id);
        const progress = computeProgress(records, profile.gameSettings?.reading);
        first = !records.some(isPauseRecord);
        const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        next = planPause({ progress, name: profile.name, rng: createRng(seed) });
      } catch (err) {
        console.error('review pause plan failed', err);
        if (aliveRef.current) finish(false);
        return;
      }
      if (!aliveRef.current) return;
      if (next.questions.length === 0) {
        finish(false);
        return;
      }
      setPlan(next);
      setPhase('announce');
      const steps = first ? [{ text: ANNOUNCE_TEXT }, { pauseMs: 300 }, { text: ANNOUNCE_FIRST_TEXT }] : [{ text: ANNOUNCE_TEXT }];
      // La voix, jamais plus de ANNOUNCE_MAX_MS : l'enfant n'attend pas un énoncé qui ne finit pas.
      await Promise.race([
        speakSequence(steps),
        new Promise<void>((resolve) => later(resolve, ANNOUNCE_MAX_MS)),
      ]);
      if (aliveRef.current) setPhase('quiz');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  function onQuizFinish(end: FlowEnd) {
    setHard(end.hard);
    setPhase('end');
    if (end.hard) {
      void speak('On retourne jouer !', { rate: 0.9 });
      later(() => finish(true), GENTLE_MS);
      return;
    }
    playFanfare();
    later(() => void speak('Bravo !', { rate: 0.9 }), 500);
    later(() => finish(true), CELEBRATE_MS);
  }

  if (!profile) return null;

  return (
    <div
      class="screen rd-session rp-pause"
      data-testid="reading-pause"
      data-phase={phase}
      data-hard={hard ? 'true' : undefined}
      style={`--rd-main:${PAUSE_COLORS.main};--rd-soft:${PAUSE_COLORS.soft};--rd-dark:${PAUSE_COLORS.dark}`}
    >
      {(phase === 'loading' || phase === 'announce') && (
        <div class="rp-announce" data-testid="reading-pause-announce">
          <span class="rp-avatar rp-avatar--big">
            <Emoji char={profile.avatar} />
          </span>
          <span class="rp-bubble" aria-hidden="true">
            <StageIcon stage={5} />
          </span>
        </div>
      )}
      {phase === 'quiz' && plan && <PauseQuiz plan={plan} profileId={profile.id} avatar={profile.avatar} onFinish={onQuizFinish} />}
      {phase === 'end' && (
        <div class="rp-end" data-testid="reading-pause-end" data-hard={hard ? 'true' : undefined}>
          {!hard && (
            <div class="rd-confetti" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  key={i}
                  class="rd-confetti__piece"
                  style={`--cx:${((i * 37) % 100) - 50}vw;--cd:${(i % 6) * 110}ms;--cc:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};--cr:${(i * 53) % 360}deg`}
                />
              ))}
            </div>
          )}
          <span class="rp-avatar rp-avatar--big rp-avatar--happy">
            <Emoji char={profile.avatar} />
          </span>
        </div>
      )}
    </div>
  );
}

interface PauseQuizProps {
  plan: PausePlan;
  profileId: string;
  avatar: string;
  onFinish: (end: FlowEnd) => void;
}

/** Les questions de la pause : mêmes vues et même enchaînement que l'aventure (voix, relance, exemple guidé). */
function PauseQuiz({ plan, profileId, avatar, onFinish }: PauseQuizProps) {
  const flow = useQuestionFlow({
    plan,
    review: false,
    profileId,
    onFinish: (_answers, end) => onFinish(end),
    pause: { fallback: plan.fallback },
  });
  const { question, viewProps, dots } = flow;
  const View = question ? READING_VIEWS[question.game] : null;

  return (
    <>
      <header class="rd-topbar">
        <span class="rp-avatar">
          <Emoji char={avatar} />
        </span>
        <ol class="rd-dots" data-testid="reading-dots" aria-hidden="true">
          {Array.from({ length: dots.total }, (_, i) => (
            <li
              key={i}
              class="rd-dot"
              data-state={i < dots.done ? 'done' : i === dots.done && !flow.finishing ? 'current' : 'todo'}
            />
          ))}
        </ol>
        <button type="button" class="rd-replay" onClick={flow.replay} aria-label="Réécouter" data-testid="reading-replay">
          <Icon name="speaker" size={44} />
        </button>
      </header>
      {question && View && viewProps && (
        <main
          key={flow.turn}
          class="rd-question"
          data-testid="reading-question"
          data-game={question.game}
          data-answer={question.answer}
          data-item={question.itemId}
          data-guided={viewProps.guided ? 'true' : undefined}
          data-retry={flow.retry ? 'true' : undefined}
          data-solved={viewProps.solved ? 'true' : undefined}
          data-ready={viewProps.disabled ? undefined : 'true'}
          data-retention={question.retention ? 'true' : undefined}
        >
          <View question={question} {...viewProps} />
        </main>
      )}
      {flow.handTargets && <TutorialHand key={flow.turn} targets={flow.handTargets} />}
    </>
  );
}
