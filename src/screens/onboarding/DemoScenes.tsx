// Les quatre scènes de la démo parent : de VRAIS composants de l'app (vues de lecture, pause, médaillons de la carte,
// classes des statistiques) posés dans des états scriptés qui tournent en boucle. Aucune voix, aucun stockage,
// aucune interaction : l'écran est une vitrine, pas un jeu.
import { useEffect, useState } from 'preact/hooks';
import { Emoji } from '../../socle/ui/Emoji';
import { Icon } from '../../socle/ui/icons/Icon';
import { LevelIcon, TRACK_COLORS } from '../../games/reading/LevelIcon';
import { LEVELS } from '../../games/reading/levels';
import { STAGE_COLORS, StageIcon } from '../../games/reading/StageIcon';
import type { ReadingQuestion, ReadingViewProps } from '../../games/reading/types';
import { READING_VIEWS } from '../../games/reading/views';
import { WorldBackdrop } from '../map/WorldBackdrop';
import '../../games/reading/reading.css';
import '../../games/reading/reading-parent.css';
import '../../games/pause/pause.css';
import '../adventure/adventure.css';

const AVATAR = '🦊';
const CONFETTI_COLORS = ['#ff6f83', '#ffc53d', '#4fbd63', '#3fa7ee', '#9a78e8', '#ffa62b'];

/** Mouvement réduit : la scène reste sur l'étape la plus parlante au lieu de tourner. */
function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Étape courante d'un scénario : chaque durée (ms) fait passer à l'étape suivante, puis on reboucle. */
function useScript(durations: readonly number[], stillStep: number): number {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? stillStep : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % durations.length), durations[step] ?? 1000);
    return () => window.clearTimeout(id);
  }, [step, durations]);
  return step;
}

function viewProps(question: ReadingQuestion, flags: Partial<ReadingViewProps>): ReadingViewProps {
  const noop = () => {};
  return {
    question,
    wrongChoices: [],
    solved: false,
    hintChoice: null,
    spokenChoice: null,
    guided: false,
    disabled: false,
    onChoose: noop,
    onReplayModel: noop,
    onReplayChoice: noop,
    ...flags,
  };
}

function letters(ids: readonly string[]): ReadingQuestion['choices'] {
  return ids.map((id) => ({ id, kind: 'letter' as const, label: id.toUpperCase() }));
}

const FIRST_SOUND: ReadingQuestion = {
  game: 'first-sound',
  itemId: 'g:l',
  target: 'l',
  stimulus: { kind: 'picture', picture: 'lapin' },
  choices: letters(['m', 'l', 'a']),
  answer: 'l',
  prompt: [],
  shortPrompt: [],
  speakChoices: false,
  praise: [],
  isNew: false,
};

const LETTER_SOUND: ReadingQuestion = {
  game: 'letter-sound',
  itemId: 'g:a',
  target: 'a',
  stimulus: { kind: 'sound', grapheme: 'a' },
  choices: letters(['o', 'a', 'i']),
  answer: 'a',
  prompt: [],
  shortPrompt: [],
  speakChoices: false,
  praise: [],
  praisePicture: 'abeille',
  isNew: false,
  retention: true,
};

function themeVars(stage: 1 | 5): string {
  const c = STAGE_COLORS[stage];
  return `--rd-main:${c.main};--rd-soft:${c.soft};--rd-dark:${c.dark}`;
}

function Dots({ total, done, current }: { total: number; done: number; current: boolean }) {
  return (
    <ol class="rd-dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} class="rd-dot" data-state={i < done ? 'done' : i === done && current ? 'current' : 'todo'} />
      ))}
    </ol>
  );
}

/** Une question de lecture, comme dans l'aventure ou dans une pause : en-tête (avatar, points, haut-parleur) + vue. */
function QuestionScreen(props: { question: ReadingQuestion; flags: Partial<ReadingViewProps>; done: number; total: number; hand?: boolean }) {
  const View = READING_VIEWS[props.question.game];
  const solved = props.flags.solved === true;
  return (
    <>
      <header class="rd-topbar">
        <span class="rp-avatar">
          <Emoji char={AVATAR} />
        </span>
        <Dots total={props.total} done={props.done} current={!solved} />
        <span class="rd-replay" aria-hidden="true">
          <Icon name="speaker" size={44} />
        </span>
      </header>
      <main class="rd-question" data-demo-question={props.question.game} data-solved={solved ? 'true' : undefined}>
        <View {...viewProps(props.question, props.flags)} />
        {props.hand && (
          <span class="od-hand" aria-hidden="true">
            <Emoji char="👆" />
          </span>
        )}
      </main>
    </>
  );
}

/** Scène 1 : une question de lecture à laquelle on répond. La voix guide (le haut-parleur), les choix sont des lettres. */
export function QuestionScene() {
  // 0 : la consigne est dite (choix en attente) ; 1 : le doigt vise la bonne réponse ; 2 : réussi.
  const step = useScript([1500, 1700, 2000], 2);
  const flags: Partial<ReadingViewProps> =
    step === 0 ? { disabled: true } : step === 1 ? { hintChoice: 'l' } : { solved: true };
  return (
    <div class="screen rd-session od-screen" style={themeVars(1)} data-demo-step={step}>
      <QuestionScreen question={FIRST_SOUND} flags={flags} done={step === 2 ? 3 : 2} total={5} hand={step === 1} />
    </div>
  );
}

const GAME_CARDS: ReadonlyArray<{ face: string; open: boolean }> = [
  { face: '🐶', open: true },
  { face: '🌳', open: false },
  { face: '🐱', open: false },
  { face: '🐶', open: true },
  { face: '🐱', open: false },
  { face: '🌳', open: false },
];

/** Scène « pauses » : un mini-jeu (cartes à retrouver) ; la pause de lecture passe par-dessus, puis le jeu reprend tel quel. */
export function PauseScene() {
  // 0 : jeu ; 1 : annonce de la pause ; 2 : question ; 3 : réussi ; 4 : fête ; retour au jeu, cartes inchangées.
  const step = useScript([1800, 1500, 1700, 1800, 1500], 2);
  const inPause = step >= 1;
  const quiz = step === 2 || step === 3;
  return (
    <div class="od-screen od-pausescene" data-demo-step={step}>
      <div class="od-game" aria-hidden="true">
        <div class="od-game__bar">
          <Emoji char="🎮" />
        </div>
        <div class="od-game__grid">
          {GAME_CARDS.map((card, i) => (
            <span key={i} class={`od-tile${card.open ? ' od-tile--open' : ''}`}>
              {card.open ? <Emoji char={card.face} /> : null}
            </span>
          ))}
        </div>
      </div>
      {inPause && (
        <div class="screen rd-session rp-pause" style={themeVars(5)} data-testid="demo-pause">
          {step === 1 && (
            <div class="rp-announce">
              <span class="rp-avatar rp-avatar--big">
                <Emoji char={AVATAR} />
              </span>
              <span class="rp-bubble" aria-hidden="true">
                <StageIcon stage={5} />
              </span>
            </div>
          )}
          {quiz && <QuestionScreen question={LETTER_SOUND} flags={step === 3 ? { solved: true } : {}} done={step === 3 ? 1 : 0} total={3} />}
          {step === 4 && (
            <div class="rp-end">
              <div class="rd-confetti" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <span
                    key={i}
                    class="rd-confetti__piece"
                    style={`--cx:${((i * 37) % 100) - 50}vw;--cd:${(i % 6) * 110}ms;--cc:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};--cr:${(i * 53) % 360}deg`}
                  />
                ))}
              </div>
              <span class="rp-avatar rp-avatar--big rp-avatar--happy">
                <Emoji char={AVATAR} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Positions des 5 premiers niveaux (en px, dans la scène 300 × 330), du bas vers le haut. */
const MAP_NODES: ReadonlyArray<{ x: number; y: number }> = [
  { x: 90, y: 276 },
  { x: 210, y: 220 },
  { x: 96, y: 160 },
  { x: 204, y: 100 },
  { x: 120, y: 58 },
];

/**
 * Scène « Un niveau à la fois » : la carte d'aventure. Niveau gagné, le suivant s'ouvre (cadenas → ouvert) et
 * l'avatar le rejoint. Deux temps par niveau : k pair = niveau k/2 en cours ; k impair = il vient d'être gagné,
 * le suivant est encore verrouillé (l'avatar s'y rend) ; le pas suivant le débloque.
 */
export function MapScene() {
  const step = useScript([1300, 1000, 1300, 1000, 1300, 1000, 1300, 1000, 1500], 2);
  const doneCount = Math.ceil(step / 2);
  const currentIndex = step % 2 === 0 ? step / 2 : -1;
  const justOpened = step % 2 === 0 && step > 0 ? step / 2 : -1;
  const points = MAP_NODES.map((p) => `${p.x},${p.y}`).join(' ');
  const here = MAP_NODES[Math.min(doneCount, MAP_NODES.length - 1)] ?? MAP_NODES[0]!;
  return (
    <div class="od-screen od-mapscene" data-demo-step={step}>
      <WorldBackdrop world="forest" veil="soft" />
      <svg class="od-map__path" viewBox="0 0 300 330" aria-hidden="true">
        <polyline points={points} fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
        <polyline points={points} fill="none" stroke="#e8c98f" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {MAP_NODES.map((p, i) => {
        const level = LEVELS[i];
        if (!level) return null;
        const state = i < doneCount ? 'done' : i === currentIndex ? 'current' : 'locked';
        const colors = TRACK_COLORS[level.track];
        return (
          <div key={level.id} class={`adv-node od-node${i === justOpened ? ' od-node--opened' : ''}`} style={{ left: `${p.x}px`, top: `${p.y}px`, '--medal': '60px' }} data-state={state}>
            <span
              class="rd-medal"
              data-state={state}
              style={`--m-main:${colors.main};--m-soft:${colors.soft};--m-dark:${colors.dark}`}
            >
              <span class="rd-medal__face">
                <LevelIcon level={level} />
              </span>
              {state === 'done' && (
                <span class="rd-medal__badge rd-medal__badge--done" aria-hidden="true">
                  <Icon name="check" size="62%" />
                </span>
              )}
              {state === 'locked' && (
                <span class="rd-medal__badge rd-medal__badge--lock" aria-hidden="true">
                  <Icon name="lock" size="68%" />
                </span>
              )}
            </span>
          </div>
        );
      })}
      <span class="od-avatar" style={{ left: `${here.x + 22}px`, top: `${here.y - 30}px` }} aria-hidden="true">
        <Emoji char={AVATAR} />
      </span>
    </div>
  );
}

const SAMPLE_PASSED = 6;
const SAMPLE_LETTERS: ReadonlyArray<{ label: string; state: 'new' | 'learning' | 'acquired'; rate: string }> = [
  { label: 'A', state: 'acquired', rate: '100 %' },
  { label: 'O', state: 'acquired', rate: '90 %' },
  { label: 'L', state: 'acquired', rate: '86 %' },
  { label: 'M', state: 'learning', rate: '60 %' },
];

/** Scène 4 : les statistiques d'un enfant (données d'exemple), avec les classes de la vraie page. Les blocs apparaissent un à un. */
export function StatsScene() {
  // 1 à 4 blocs visibles, puis tous un moment avant de reboucler.
  const step = useScript([1400, 1400, 1400, 1400, 1800], 4);
  const shown = Math.min(step + 1, 4);
  const percent = Math.round((SAMPLE_PASSED / LEVELS.length) * 100);
  return (
    <div class="pa-space od-screen od-statsscene" data-demo-step={step}>
      <section class="od-block" data-shown={shown >= 1 ? 'true' : 'false'}>
        <p class="rp-levels__count">
          <strong>
            {SAMPLE_PASSED} niveaux gagnés sur {LEVELS.length}
          </strong>
        </p>
        <div class="rp-bar" aria-hidden="true">
          <span class="rp-bar__fill" style={{ width: `${shown >= 1 ? percent : 0}%` }} />
        </div>
      </section>
      <section class="od-block" data-shown={shown >= 2 ? 'true' : 'false'}>
        <h3 class="rp-stage__title">Lettres</h3>
        <ul class="rp-items">
          {SAMPLE_LETTERS.map((l) => (
            <li key={l.label} class="rp-item" data-state={l.state}>
              <span class="rp-item__label">{l.label}</span>
              <span class="rp-item__rate">{l.rate}</span>
            </li>
          ))}
        </ul>
      </section>
      <section class="od-block" data-shown={shown >= 3 ? 'true' : 'false'}>
        <h3 class="rp-stage__title">Confusions les plus fréquentes</h3>
        <table class="rp-table">
          <thead>
            <tr>
              <th>Demandé</th>
              <th>Choisi</th>
              <th>Fois</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>M</td>
              <td>N</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="od-block" data-shown={shown >= 4 ? 'true' : 'false'}>
        <h3 class="rp-stage__title">Pauses de lecture</h3>
        <div class="pa-summary">
          <div class="pa-stat">
            <span class="pa-stat__value">4</span>
            <span class="pa-stat__label">Pauses cette semaine</span>
          </div>
          <div class="pa-stat">
            <span class="pa-stat__value">80 %</span>
            <span class="pa-stat__label">1re question réussie</span>
          </div>
        </div>
      </section>
    </div>
  );
}
