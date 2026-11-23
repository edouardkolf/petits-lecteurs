import { describe, expect, it } from 'vitest';
import { onboardingStart, voiceNeedsGuide } from './onboarding';

describe('onboardingStart', () => {
  it('premier lancement : la démo', () => {
    expect(onboardingStart({ hasPin: false, profileCount: 0 })).toBe('demo');
  });

  it('app mise à jour (code et profils présents) : aucun parcours', () => {
    expect(onboardingStart({ hasPin: true, profileCount: 2 })).toBeNull();
  });

  it('un profil sans code (import) : aucun parcours', () => {
    expect(onboardingStart({ hasPin: false, profileCount: 1 })).toBeNull();
  });

  it('code créé mais aucun enfant : reprise au code parent, sans la démo', () => {
    expect(onboardingStart({ hasPin: true, profileCount: 0 })).toBe('pin');
  });
});

describe('voiceNeedsGuide', () => {
  it('voix prête : pas de guide', () => {
    expect(voiceNeedsGuide({ status: 'ready' })).toBe(false);
  });

  it('voix indisponible, son coupé ou vérification impossible : guide', () => {
    expect(voiceNeedsGuide({ status: 'unavailable' })).toBe(true);
    expect(voiceNeedsGuide({ status: 'muted' })).toBe(true);
    expect(voiceNeedsGuide(null)).toBe(true);
  });
});
