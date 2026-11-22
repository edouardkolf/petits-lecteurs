// « Quel mot commence par… ? » : la lettre en grand en haut (elle se touche pour réentendre le son), puis 2 images
// au choix, chacune avec son petit haut-parleur (le mot) en dessous.
import { getGrapheme } from "../curriculum";
import type { ReadingViewProps } from "../types";
import { ChoiceRow } from "./ChoiceRow";
import { LetterTile } from "./LetterTile";
import { Pic } from "./PictureCard";

export function WordStartView(props: ReadingViewProps) {
  const { stimulus } = props.question;
  const upper =
    stimulus.kind === "sound"
      ? (getGrapheme(stimulus.grapheme)?.upper ?? stimulus.grapheme.toUpperCase())
      : "";
  return (
    <div class="rv rv-pictures rv-pictures--word" data-game="word-start">
      <button
        type="button"
        class="rv-stim rv-stim--letter rv-stim--tap rv-stim--model"
        data-testid="reading-model"
        aria-label="réécouter le son"
        onClick={props.onReplayModel}
      >
        <LetterTile text={upper} />
      </button>
      <ChoiceRow
        view={props}
        speakers
        render={(c) => <Pic id={c.picture} />}
      />
    </div>
  );
}
