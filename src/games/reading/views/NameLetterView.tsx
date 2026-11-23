// « La lettre de ton prénom » (pauses de révision) : l'avatar de l'enfant, 2 ou 3 lettres capitales ; on touche la
// première lettre de son prénom. Reconnaissance visuelle seulement : jamais un son (la vue ne parle pas).
import { useProfile } from "../../../socle/app/context";
import { Emoji } from "../../../socle/ui/Emoji";
import type { ReadingViewProps } from "../types";
import { ChoiceRow } from "./ChoiceRow";
import { LetterTile } from "./LetterTile";

export function NameLetterView(props: ReadingViewProps) {
  const { profile } = useProfile();
  return (
    <div class="rv rv-letters" data-game="name-letter">
      <button
        type="button"
        class="rv-stim rv-stim--tap"
        onClick={props.onReplayModel}
        aria-label="Réécouter"
        data-testid="reading-model"
      >
        {profile && <Emoji char={profile.avatar} />}
      </button>
      <ChoiceRow view={props} render={(c) => <LetterTile text={c.label} />} />
    </div>
  );
}
