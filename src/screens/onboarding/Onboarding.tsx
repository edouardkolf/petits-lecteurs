// Parcours de premier lancement (parent) : démo → code parent → fiche enfant → test de la voix → passage du téléphone.
// Les écrans du code et de la fiche sont ceux de l'espace parent, inchangés : seul leur enchaînement est nouveau.
// Voir `onboardingStart` (socle/app/onboarding.ts) : le parcours se déduit des données, aucun drapeau n'est stocké.
import { useEffect, useRef, useState } from 'preact/hooks';
import { navigate } from '../../socle/app/routes';
import { useProfile } from '../../socle/app/context';
import { onboardingStart, type OnboardingStep } from '../../socle/app/onboarding';
import { getSettings } from '../../socle/storage';
import type { AppSettings, Profile } from '../../socle/storage';
import { ChildForm } from '../../socle/parent/ChildForm';
import { PinGate } from '../../socle/parent/PinGate';
import { describeError } from '../../socle/parent/util';
import '../../socle/parent/parent.css';
import { DemoTour } from './DemoTour';
import { Handoff } from './Handoff';
import { VoiceTest } from './VoiceTest';
import { currentStepKey, endSteps, pushStep, stepsEnding } from './stepHistory';

const STEP_KEYS: readonly OnboardingStep[] = ['pin', 'child', 'voice', 'handoff'];

export function Onboarding() {
  const { setProfile } = useProfile();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [child, setChild] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setStep(onboardingStart({ hasPin: Boolean(s.pinHash && s.pinSalt), profileCount: 0 }) ?? 'demo');
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Avance d'une étape en ajoutant une entrée d'historique : le retour Android revient à l'étape d'avant.
  function goTo(next: OnboardingStep) {
    pushStep(next);
    setStep(next);
  }

  // Retour Android : démo ← code ← fiche enfant. Une fois la fiche enfant créée (étapes voix et passage du téléphone),
  // on ne rouvre jamais le code ni la fiche (un second enfant serait créé) : le retour y est sans effet.
  const childRef = useRef<Profile | null>(null);
  childRef.current = child;
  const stepRef = useRef<OnboardingStep | null>(null);
  stepRef.current = step;
  useEffect(() => {
    const onPop = () => {
      if (stepsEnding()) return;
      const key = currentStepKey();
      const target = (STEP_KEYS as readonly string[]).includes(key ?? '') ? (key as OnboardingStep) : 'demo';
      const current = stepRef.current;
      if (!current || target === current) return;
      if (childRef.current && (target === 'demo' || target === 'pin' || target === 'child')) {
        if (current !== 'demo') pushStep(current);
        return;
      }
      setStep(target);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (error) {
    return (
      <div class="pa-space pa-space--center">
        <p class="pa-error">{error}</p>
      </div>
    );
  }
  if (!settings || !step) return <div class="screen screen--loading" />;

  switch (step) {
    case 'demo':
      return <DemoTour mode="onboarding" onDone={() => goTo('pin')} />;
    case 'pin':
      return (
        <PinGate
          settings={settings}
          onUnlocked={(next) => {
            setSettings(next);
            goTo('child');
          }}
        />
      );
    case 'child':
      return (
        <ChildForm
          mode="create"
          onCreated={(created) => {
            setChild(created);
            goTo('voice');
          }}
        />
      );
    case 'voice':
      return <VoiceTest onDone={() => goTo('handoff')} />;
    case 'handoff':
      return child ? (
        <Handoff
          child={child}
          onStart={() => {
            setProfile(child);
            // On referme d'abord les entrées d'étapes : le retour depuis l'accueil ne rouvre pas le parcours.
            endSteps(() => navigate({ name: 'hub' }));
          }}
        />
      ) : null;
  }
}
