// Test de la voix (parent) : la voix de synthèse est le cœur de l'app, un téléphone muet ou sans voix française
// rend tout inutilisable pour l'enfant. On la fait entendre AVANT de lui passer le téléphone.
// Ne bloque jamais : « Continuer quand même » est toujours proposé.
import { useEffect, useRef, useState } from 'preact/hooks';
import { voiceNeedsGuide } from '../../socle/app/onboarding';
import { cancelSpeech, checkVoice, speak } from '../../socle/ui/voice';
import type { VoiceCheck } from '../../socle/ui/voice';
import { Icon } from '../../socle/ui/icons/Icon';

export const VOICE_TEST_TEXT = 'Bonjour ! Je suis la voix de Petits Lecteurs.';

/** `checking` : vérification en cours ; `test` : bouton d'écoute ; `heard` : « Vous avez entendu la voix ? » ; `guide` : aide. */
type View = 'checking' | 'test' | 'heard' | 'guide';

export function VoiceTest(props: { onDone: () => void }) {
  const [view, setView] = useState<View>('checking');
  const [check, setCheck] = useState<VoiceCheck | null>(null);
  const [playing, setPlaying] = useState(false);
  const aliveRef = useRef(true);

  async function run() {
    setView('checking');
    let result: VoiceCheck | null = null;
    try {
      result = await checkVoice();
    } catch {
      result = null;
    }
    if (!aliveRef.current) return;
    setCheck(result);
    setView(voiceNeedsGuide(result) ? 'guide' : 'test');
  }

  useEffect(() => {
    aliveRef.current = true;
    void run();
    return () => {
      aliveRef.current = false;
      cancelSpeech();
    };
  }, []);

  async function play() {
    setPlaying(true);
    const result = await speak(VOICE_TEST_TEXT, { rate: 0.9 });
    if (!aliveRef.current) return;
    setPlaying(false);
    // Le moteur a refusé de parler : inutile de demander si on a entendu, on passe directement au guide.
    setView(result === 'blocked' || result === 'failed' ? 'guide' : 'heard');
  }

  return (
    <div class="pa-space pa-space--center od-voice" data-testid="onboarding-voice" data-view={view}>
      <div class="pa-pin-card od-card">
        <h1>Test de la voix</h1>

        {view === 'checking' && <p class="pa-muted">Vérification de la voix…</p>}

        {(view === 'test' || view === 'heard') && (
          <>
            <p class="pa-muted">
              La voix guide votre enfant dans tous les jeux. Vérifions ensemble que vous l'entendez bien.
            </p>
            <button
              type="button"
              class="pa-button pa-button--primary"
              data-testid="onboarding-voice-play"
              disabled={playing}
              onClick={() => void play()}
            >
              <Icon name="speaker" size={26} />
              <span>{view === 'heard' ? 'Réécouter' : 'Écouter la voix'}</span>
            </button>
          </>
        )}

        {view === 'heard' && (
          <div class="od-voice__ask" data-testid="onboarding-voice-ask">
            <p class="od-voice__question">Vous avez entendu la voix ?</p>
            <div class="od-actions">
              <button type="button" class="pa-button pa-button--primary" data-testid="onboarding-voice-yes" onClick={props.onDone}>
                Oui
              </button>
              <button type="button" class="pa-button pa-button--secondary" data-testid="onboarding-voice-no" onClick={() => setView('guide')}>
                Non
              </button>
            </div>
          </div>
        )}

        {view === 'guide' && (
          <div class="od-voice__guide" data-testid="onboarding-voice-guide">
            <p class="od-voice__lead">
              {check?.status === 'muted'
                ? "Le son est coupé dans l'application."
                : "La voix n'est pas encore là : quelques réglages suffisent, le plus souvent."}
            </p>
            <ol class="od-voice__steps">
              <li>Montez le volume du téléphone et vérifiez qu'il n'est pas en mode silencieux.</li>
              <li>
                Sur Android : Paramètres › Accessibilité › Synthèse vocale › moteur Google, langue « Français (France) »,
                puis téléchargez les données hors connexion.
              </li>
              <li>Dans Petits Lecteurs, le son doit être activé (Espace parent › Réglages).</li>
            </ol>
            <div class="od-actions od-actions--stack">
              <button type="button" class="pa-button pa-button--primary" data-testid="onboarding-voice-retry" onClick={() => void run()}>
                Réessayer
              </button>
              <button type="button" class="pa-button pa-button--ghost" data-testid="onboarding-voice-continue" onClick={props.onDone}>
                Continuer quand même
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
