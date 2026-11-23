// « Le tambour » : l'enfant tape une fois par syllabe (la vue compte), puis touche la coche pour valider.
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "../../../socle/ui/icons/Icon";
import { playTap } from "../../../socle/ui/sound";
import type { ReadingViewProps } from "../types";
import { PictureCard } from "./PictureCard";
import {
  acceptTap,
  addTap,
  DRUM_MAX_TAPS,
  drumPulseTimes,
  removeTap,
} from "./logic";

/** Flèche qui revient en arrière : « effacer la dernière frappe » (aucun texte). */
function UndoArt() {
  return (
    <svg viewBox="0 0 48 48" class="rv-undo-art" aria-hidden="true">
      <path
        d="M17 14L8 23l9 9"
        fill="none"
        stroke="currentColor"
        stroke-width="5.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M9 23h19a10 10 0 0 1 0 20h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="5.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function DrumArt() {
  return (
    <svg viewBox="0 0 220 190" class="rv-drum-art" aria-hidden="true">
      <line class="rv-stick" x1="52" y1="14" x2="92" y2="60" />
      <line class="rv-stick" x1="168" y1="14" x2="128" y2="60" />
      <circle class="rv-stick-tip" cx="52" cy="14" r="9" />
      <circle class="rv-stick-tip" cx="168" cy="14" r="9" />
      <path
        class="rv-drum-body"
        d="M20 84v72c0 14 40 26 90 26s90-12 90-26V84z"
      />
      <path
        class="rv-drum-zig"
        d="M30 98l20 66 20-66 20 66 20-66 20 66 20-66 20 66 20-66"
      />
      <ellipse class="rv-drum-rim" cx="110" cy="84" rx="90" ry="26" />
      <ellipse class="rv-drum-skin" cx="110" cy="84" rx="80" ry="20" />
    </svg>
  );
}

export function SyllableDrumView(props: ReadingViewProps) {
  const { question, wrongChoices, solved, hintChoice, disabled, guided } = props;
  const [taps, setTaps] = useState(0);
  const [bounce, setBounce] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [ring, setRing] = useState(false);
  // Instant de la dernière frappe acceptée (anti double tap).
  const lastHitRef = useRef<number | null>(null);

  // Nouvelle question ou erreur : les points s'effacent, on recommence.
  useEffect(() => {
    setTaps(0);
    lastHitRef.current = null;
  }, [question, wrongChoices.length]);

  // Relance : le tambour pulse `answer` fois en rythme.
  useEffect(() => {
    if (hintChoice === null || solved) {
      setRing(false);
      return;
    }
    const timers: number[] = [];
    drumPulseTimes(question.answer).forEach((at) => {
      timers.push(
        window.setTimeout(() => {
          setPulseKey((k) => k + 1);
          setRing(true);
          timers.push(window.setTimeout(() => setRing(false), 380));
        }, at),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [hintChoice, solved, question]);

  const inert = solved || disabled;
  const shown = solved
    ? Math.min(DRUM_MAX_TAPS, Number(question.answer) || taps)
    : taps;
  // La coche n'apparaît qu'après la première frappe ; sa place est réservée pour que rien ne bouge.
  const canValidate = !inert && taps > 0;

  const hit = () => {
    if (inert) return;
    const now = Date.now();
    if (!acceptTap(now, lastHitRef.current)) return;
    lastHitRef.current = now;
    playTap();
    setTaps((n) => addTap(n));
    setBounce((b) => b + 1);
  };

  // « Effacer » : visible dès la première frappe ; retire la dernière, sans compter comme une réponse.
  const canUndo = !inert && taps > 0;
  const undo = () => {
    if (!canUndo) return;
    lastHitRef.current = null;
    setTaps((n) => removeTap(n));
  };

  const validate = () => {
    if (!canValidate) return;
    // Exemple guidé : seule la coche après le bon nombre de frappes réagit.
    if (guided && String(taps) !== question.answer) return;
    props.onChoose(String(taps));
  };

  const classes = ["rv-drum"];
  if (solved) classes.push("rv-drum--correct");
  if (disabled && !solved) classes.push("rv-drum--waiting");
  if (ring) classes.push("rv-drum--ring");

  return (
    <div class="rv rv-drum-view" data-game="syllable-drum" data-taps={shown}>
      {question.stimulus.kind === "picture" && (
        <PictureCard
          id={question.stimulus.picture}
          onTap={props.onReplayModel}
        />
      )}
      <button
        type="button"
        class={classes.join(" ")}
        data-choice="drum"
        aria-disabled={inert ? "true" : "false"}
        aria-label="tambour"
        onClick={hit}
      >
        <span
          key={`${bounce}-${pulseKey}`}
          class={
            bounce > 0 || pulseKey > 0
              ? "rv-drum-skin-wrap rv-drum-skin-wrap--hit"
              : "rv-drum-skin-wrap"
          }
        >
          <DrumArt />
        </span>
      </button>
      <div class="rv-drum-foot">
        <button
          type="button"
          class={canUndo ? "rv-drum-undo" : "rv-drum-undo rv-drum-undo--hidden"}
          data-testid="drum-undo"
          aria-disabled={canUndo ? "false" : "true"}
          aria-label="effacer"
          onClick={undo}
        >
          <UndoArt />
        </button>
        <div class="rv-dots" aria-hidden="true">
          {Array.from({ length: DRUM_MAX_TAPS }, (_, i) => (
            <span
              key={i}
              class={i < shown ? `rv-dot rv-dot--on rv-dot--${i % 2}` : "rv-dot"}
            />
          ))}
        </div>
        <button
          type="button"
          class={canValidate ? "rv-drum-ok" : "rv-drum-ok rv-drum-ok--hidden"}
          data-choice="drum-ok"
          aria-disabled={canValidate ? "false" : "true"}
          aria-label="j'ai fini"
          onClick={validate}
        >
          <Icon name="check" size="62%" />
        </button>
      </div>
    </div>
  );
}
