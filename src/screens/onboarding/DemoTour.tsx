// Démo parent en quatre écrans (non jouable) : un titre, une phrase, une scène animée faite de vrais composants.
// Jouée au premier lancement, rejouable depuis l'espace parent (« Comment ça marche »).
// « Passer » saute la démo à tout moment ; la scène est mise à l'échelle pour tenir sur un petit écran sans défiler.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { MapScene, PauseScene, QuestionScene, StatsScene } from './DemoScenes';
import { currentStepKey, endSteps, pushStep, stepsEnding } from './stepHistory';
import { MethodPage } from './MethodPage';
import '../../socle/parent/parent.css';
import './onboarding.css';

export const HEADLINE =
  "Conçue selon les recommandations de l'Éducation nationale : les sons avant les lettres, du plus simple au plus difficile.";

interface Slide {
  title: string;
  text: string;
  Scene: () => ComponentChildren;
  /** Taille de conception de la scène (px) : mise à l'échelle ensuite. */
  size: { w: number; h: number };
}

const SLIDES: readonly Slide[] = [
  {
    title: HEADLINE,
    text: "Dans l'aventure, un niveau est un petit jeu. La voix guide votre enfant : aucune lecture n'est demandée.",
    Scene: QuestionScene,
    size: { w: 300, h: 330 },
  },
  {
    title: 'Un niveau à la fois',
    text: 'Chaque niveau se débloque quand le précédent est réussi : votre enfant avance à son rythme, sans brûler les étapes.',
    Scene: MapScene,
    size: { w: 300, h: 330 },
  },
  {
    title: "Un peu, souvent : c'est comme ça qu'on retient",
    text: "On ne remplit pas la tête d'un enfant d'un coup. Pendant ses jeux, de courtes pauses lui font revoir ce qu'il a déjà appris : c'est la régularité qui fait la maîtrise.",
    Scene: PauseScene,
    size: { w: 300, h: 330 },
  },
  {
    title: "Suivez les progrès dans l'espace parent",
    text: 'Niveaux gagnés, lettres acquises, confusions fréquentes et pauses de lecture : tout se voit dans les statistiques.',
    Scene: StatsScene,
    size: { w: 300, h: 410 },
  },
];

/** Écran de la démo (0 à 3) porté par l'entrée d'historique courante ; 0 sur l'entrée de départ. */
function stepIndexFromHistory(): number {
  const m = /^demo:(\d+)$/.exec(currentStepKey() ?? '');
  const n = m ? Number(m[1]) - 1 : 0;
  return Math.max(0, Math.min(SLIDES.length - 1, n));
}

/** Cadre de la scène : taille fixe de conception, réduite (ou agrandie un peu) pour remplir la place disponible. */
function Preview(props: { size: Slide['size']; children: ComponentChildren }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const update = () => {
      if (box.clientWidth === 0 || box.clientHeight === 0) return;
      setScale(Math.min(1.45, box.clientWidth / props.size.w, box.clientHeight / props.size.h));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [props.size.w, props.size.h]);
  return (
    <div class="od-preview" ref={boxRef} aria-hidden="true">
      <div
        class="od-stage"
        style={{ width: `${props.size.w}px`, height: `${props.size.h}px`, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {props.children}
      </div>
    </div>
  );
}

interface DemoTourProps {
  /** `onboarding` : suivi du code parent ; `replay` : rouverte depuis l'espace parent (dernier bouton « Terminer »). */
  mode: 'onboarding' | 'replay';
  /** Fin de la démo, qu'on l'ait vue en entier ou passée. */
  onDone: () => void;
}

export function DemoTour({ mode, onDone }: DemoTourProps) {
  const [index, setIndex] = useState(stepIndexFromHistory);
  const [method, setMethod] = useState(() => currentStepKey() === 'method');
  const slide = SLIDES[index] ?? SLIDES[0]!;
  const last = index === SLIDES.length - 1;

  // Retour Android (ou geste de retour) : un cran en arrière dans la démo, la méthode comprise.
  useEffect(() => {
    const onPop = () => {
      if (stepsEnding()) return;
      if (currentStepKey() === 'method') {
        setMethod(true);
        return;
      }
      setMethod(false);
      setIndex(stepIndexFromHistory());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Démo rouverte depuis l'espace parent : on revient d'abord à l'entrée de départ, sans entrées d'étapes derrière.
  const done = () => (mode === 'replay' ? endSteps(onDone) : onDone());
  const next = () => {
    if (last) {
      done();
      return;
    }
    pushStep(`demo:${index + 2}`);
    setIndex(index + 1);
  };
  const openMethod = () => {
    pushStep('method');
    setMethod(true);
  };

  if (method) return <MethodPage onBack={() => history.back()} />;

  return (
    <div class="pa-space od-demo" data-testid="onboarding-demo" data-step={index + 1}>
      <header class="od-demo__text">
        <h1 data-testid="onboarding-title" class={index === 0 ? 'od-demo__headline' : undefined}>
          {slide.title}
        </h1>
        <p>{slide.text}</p>
      </header>

      <Preview key={index} size={slide.size}>
        <slide.Scene />
      </Preview>

      <div class="od-demo__foot">
        {index === 0 && (
          <button type="button" class="pa-link od-demo__method" data-testid="onboarding-method-link" onClick={openMethod}>
            Notre méthode
          </button>
        )}
        <div class="od-dots" role="status" aria-label={`Écran ${index + 1} sur ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <span key={i} class={`od-dot${i === index ? ' od-dot--on' : ''}`} aria-hidden="true" />
          ))}
        </div>
        <div class="od-actions">
          <button type="button" class="pa-button pa-button--ghost" data-testid="onboarding-skip" onClick={done}>
            Passer
          </button>
          <button
            type="button"
            class="pa-button pa-button--primary"
            data-testid="onboarding-next"
            onClick={next}
          >
            {last && mode === 'replay' ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
