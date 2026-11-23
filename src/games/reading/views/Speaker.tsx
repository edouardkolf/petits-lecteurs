// Grand haut-parleur stylisé (stimulus « on écoute ») : aucune lettre, aucun texte.
export function Speaker() {
  return (
    <div class="rv-speaker" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <path
          class="rv-speaker-body"
          d="M16 46h20l28-24c3-2.6 7-.6 7 3v70c0 3.6-4 5.6-7 3L36 74H16a5 5 0 0 1-5-5V51a5 5 0 0 1 5-5z"
        />
        <path
          class="rv-speaker-wave rv-speaker-wave--1"
          d="M84 44a22 22 0 0 1 0 32"
        />
        <path
          class="rv-speaker-wave rv-speaker-wave--2"
          d="M96 32a40 40 0 0 1 0 56"
        />
        <path
          class="rv-speaker-wave rv-speaker-wave--3"
          d="M108 21a58 58 0 0 1 0 78"
        />
      </svg>
    </div>
  );
}

/**
 * Petit haut-parleur d'un choix image : dit le mot sans répondre. Un bouton à part (≥ 56 px), posé sous la tuile
 * et bien écarté d'elle, pour qu'un enfant ne réponde jamais par accident.
 */
export function ChoiceSpeaker({
  id,
  inert,
  onTap,
}: {
  id: string;
  inert: boolean;
  onTap: (choiceId: string) => void;
}) {
  return (
    <button
      type="button"
      class="rv-choice-speaker"
      data-testid={`reading-choice-speaker-${id}`}
      aria-label="écouter le mot"
      aria-disabled={inert ? "true" : "false"}
      onClick={() => {
        if (!inert) onTap(id);
      }}
    >
      <Speaker />
    </button>
  );
}
