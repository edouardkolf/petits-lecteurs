// Parcours de premier lancement (parent) : démo → code parent → fiche enfant → test de la voix → passage du téléphone.
// Les écrans du code et de la fiche sont ceux de l'espace parent, inchangés : seul leur enchaînement est nouveau.
// Voir `onboardingStart` (socle/app/onboarding.ts) : le parcours se déduit des données, aucun drapeau n'est stocké.
import { useEffect, useState } from 'preact/hooks';
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
      return <DemoTour mode="onboarding" onDone={() => setStep('pin')} />;
    case 'pin':
      return (
        <PinGate
          settings={settings}
          onUnlocked={(next) => {
            setSettings(next);
            setStep('child');
          }}
        />
      );
    case 'child':
      return (
        <ChildForm
          mode="create"
          onCreated={(created) => {
            setChild(created);
            setStep('voice');
          }}
        />
      );
    case 'voice':
      return <VoiceTest onDone={() => setStep('handoff')} />;
    case 'handoff':
      return child ? (
        <Handoff
          child={child}
          onStart={() => {
            setProfile(child);
            navigate({ name: 'hub' });
          }}
        />
      ) : null;
  }
}
