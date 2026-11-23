// Dernier écran du parcours : le parent passe le téléphone à l'enfant, avec la phrase à lui dire.
import type { Profile } from '../../socle/storage/types';
import { Emoji } from '../../socle/ui/Emoji';
import { Icon } from '../../socle/ui/icons/Icon';

export const HANDOFF_SENTENCE = 'Écoute bien la voix, et touche la bonne réponse.';

export function Handoff(props: { child: Profile; onStart: () => void }) {
  const { child } = props;
  return (
    <div class="pa-space pa-space--center od-handoff" data-testid="onboarding-handoff">
      <div class="pa-pin-card od-card">
        <span class="od-handoff__avatar" aria-hidden="true">
          <Emoji char={child.avatar} />
        </span>
        <h1>Donnez le téléphone à {child.name}</h1>
        <p class="pa-muted">Dites à votre enfant :</p>
        <p class="od-handoff__say" data-testid="onboarding-handoff-say">
          {HANDOFF_SENTENCE}
        </p>
        <p class="od-handoff__tip">
          <Icon name="children" size={22} />
          <span>Conseil : la première séance se passe mieux à deux, installez-vous à côté de votre enfant.</span>
        </p>
        <button type="button" class="pa-button pa-button--primary" data-testid="onboarding-go" onClick={props.onStart}>
          C'est parti
        </button>
      </div>
    </div>
  );
}
