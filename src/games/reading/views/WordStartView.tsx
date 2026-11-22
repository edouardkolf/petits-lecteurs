// « Quel mot commence par… ? » : un grand haut-parleur (le son de la lettre), 2 images au choix.
import type { ReadingViewProps } from "../types";
import { ChoiceRow } from "./ChoiceRow";
import { Pic } from "./PictureCard";
import { Speaker } from "./Speaker";

export function WordStartView(props: ReadingViewProps) {
  return (
    <div class="rv rv-pictures rv-pictures--word" data-game="word-start">
      <button
        type="button"
        class="rv-speaker-btn"
        data-testid="reading-model"
        aria-label="réécouter le son"
        onClick={props.onReplayModel}
      >
        <Speaker />
      </button>
      <ChoiceRow view={props} render={(c) => <Pic id={c.picture} />} />
    </div>
  );
}
