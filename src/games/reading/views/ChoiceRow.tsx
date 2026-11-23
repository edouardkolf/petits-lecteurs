// Rangée de choix : un ChoiceButton par choix de la question, contenu fourni par la vue. Avec `speakers`, chaque
// choix qui a un mot à dire (`choice.speech`) reçoit son petit haut-parleur sous la tuile : toucher le haut-parleur
// dit le mot, toucher la tuile répond.
import type { ComponentChildren } from "preact";
import type { ReadingChoice, ReadingViewProps } from "../types";
import { ChoiceButton } from "./ChoiceButton";
import { choiceFlags } from "./logic";
import { ChoiceSpeaker } from "./Speaker";

interface ChoiceRowProps {
  view: ReadingViewProps;
  /** Contenu d'un choix (image, lettre, syllabe…). */
  render: (choice: ReadingChoice) => ComponentChildren;
  class?: string;
  /** Un petit haut-parleur sous chaque choix qui a un mot à dire. */
  speakers?: boolean;
}

export function ChoiceRow({ view, render, class: extra, speakers = false }: ChoiceRowProps) {
  const n = view.question.choices.length;
  return (
    <div class={extra ? `rv-choices ${extra}` : "rv-choices"} data-n={n}>
      {view.question.choices.map((choice, i) => {
        const flags = choiceFlags(view, choice.id);
        const button = (
          <ChoiceButton
            key={choice.id}
            id={choice.id}
            index={i}
            flags={flags}
            onChoose={view.onChoose}
          >
            {render(choice)}
          </ChoiceButton>
        );
        if (!speakers || !choice.speech) return button;
        return (
          <div class="rv-cell" key={choice.id}>
            {button}
            <ChoiceSpeaker
              id={choice.id}
              inert={view.disabled || view.solved}
              onTap={view.onReplayChoice}
            />
          </div>
        );
      })}
    </div>
  );
}
