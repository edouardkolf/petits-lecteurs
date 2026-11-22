// « A ou pas A ? » : un grand haut-parleur (le son), deux grands choix : la lettre, ou le nuage barré (« pas A »).
// Pour la présentation de la lettre (consigne en cours) : la lettre seule en grand avec l'image du mot repère.
// Une fois « a » trouvé, l'image du mot dit dans la félicitation remplace le haut-parleur.
import { getGrapheme } from "../curriculum";
import type { ReadingViewProps } from "../types";
import { ChoiceRow } from "./ChoiceRow";
import { LetterTile } from "./LetterTile";
import { Pic } from "./PictureCard";
import { Speaker } from "./Speaker";

/** Nuage gris barré d'un trait rouge : « ce n'est pas la lettre ». Aucun texte. */
function NoneArt() {
  return (
    <svg viewBox="0 0 100 100" class="rv-none-art" aria-hidden="true">
      <g class="rv-none-cloud">
        <circle cx="32" cy="58" r="18" />
        <circle cx="52" cy="44" r="24" />
        <circle cx="72" cy="59" r="17" />
        <rect x="14" y="56" width="76" height="22" rx="11" />
      </g>
      <line class="rv-none-slash-halo" x1="18" y1="16" x2="86" y2="86" />
      <line class="rv-none-slash" x1="18" y1="16" x2="86" y2="86" />
    </svg>
  );
}

export function SoundGateView(props: ReadingViewProps) {
  const { question, disabled, solved } = props;
  const { stimulus } = question;
  const grapheme =
    stimulus.kind === "sound" ? getGrapheme(question.itemId.slice(2)) : undefined;
  const presenting =
    question.isNew && (disabled || solved) && grapheme !== undefined;

  return (
    <div class="rv rv-letters rv-gate" data-game="sound-gate">
      {presenting && grapheme ? (
        <div class="rv-present" data-testid="reading-new-letter">
          <div class="rv-present-letter">
            <LetterTile text={grapheme.upper} />
          </div>
          {grapheme.keyword && (
            <div class="rv-present-pic">
              <Pic id={grapheme.keyword} />
            </div>
          )}
        </div>
      ) : solved && question.praisePicture ? (
        <div class="rv-stim rv-stim--praise" data-testid="reading-praise-pic">
          <Pic id={question.praisePicture} />
        </div>
      ) : (
        <button
          type="button"
          class="rv-speaker-btn"
          data-testid="reading-model"
          aria-label="réécouter le son"
          onClick={props.onReplayModel}
        >
          <Speaker />
        </button>
      )}
      <ChoiceRow
        view={props}
        render={(c) =>
          c.kind === "none" ? <NoneArt /> : <LetterTile text={c.label} />
        }
      />
    </div>
  );
}
