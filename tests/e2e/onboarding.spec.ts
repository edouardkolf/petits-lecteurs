// Parcours de premier lancement (parent) : démo en quatre écrans, code parent, fiche enfant, test de la voix, passage
// du téléphone. Fausse voix de `reading-helpers.ts` (Chromium headless n'a pas de voix).
import { test, expect, type Page } from '@playwright/test';
import { profileCard } from './nav';
import {
  createPin,
  ensureFakeVoice,
  installFakeVoice,
  onboardMs,
  openParentDashboard,
  skipDemo,
  spokenTexts,
} from './reading-helpers';

const HEADLINE =
  "Conçue selon les recommandations de l'Éducation nationale : les sons avant les lettres, du plus simple au plus difficile.";

async function fillChild(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Ajouter un enfant' })).toBeVisible();
  // Parcours de premier lancement : pas de retour vers l'espace parent derrière.
  await expect(page.getByRole('button', { name: 'Retour aux enfants' })).toHaveCount(0);
  await page.locator('input[name=name]').fill(name);
  await page.getByTestId('save-child').click();
}

test('parcours complet : démo, code, enfant, voix, passage du téléphone, accueil de l\'enfant', async ({ page }) => {
  await ensureFakeVoice(page);
  await page.goto('/');
  const demo = page.getByTestId('onboarding-demo');
  await expect(demo).toBeVisible();
  await expect(page.getByTestId('parent-access')).toHaveCount(0);

  // Écran 1 : la phrase d'accroche, mot pour mot, et le lien discret vers la méthode.
  await expect(demo).toHaveAttribute('data-step', '1');
  await expect(page.getByTestId('onboarding-title')).toHaveText(HEADLINE);
  await expect(page.getByTestId('onboarding-method-link')).toBeVisible();
  await expect(page.locator('[data-demo-question="first-sound"]')).toBeVisible();

  // Écran 2 : les pauses de lecture, expliquées comme voulues.
  await page.getByTestId('onboarding-next').click();
  await expect(demo).toHaveAttribute('data-step', '2');
  await expect(demo).toContainText('Toutes les 5 minutes de jeu, une courte pause de lecture ; le jeu reprend là où il en était.');
  await expect(page.getByTestId('onboarding-method-link')).toHaveCount(0);
  await expect(page.getByTestId('demo-pause')).toBeVisible({ timeout: 6000 });

  // Écran 3 : la carte, avatar sur le niveau en cours.
  await page.getByTestId('onboarding-next').click();
  await expect(demo).toHaveAttribute('data-step', '3');
  await expect(page.locator('.od-mapscene .rd-medal[data-state="current"]')).toHaveCount(1);

  // Écran 4 : les statistiques d'exemple.
  await page.getByTestId('onboarding-next').click();
  await expect(demo).toHaveAttribute('data-step', '4');
  await expect(demo).toContainText('niveaux gagnés sur');

  // Dernier « Suivant » : le code parent.
  await page.getByTestId('onboarding-next').click();
  await createPin(page);

  await fillChild(page, 'Léa');

  // Test de la voix : la voix dit la phrase, on répond Oui.
  const voice = page.getByTestId('onboarding-voice');
  await expect(voice).toBeVisible();
  await page.getByTestId('onboarding-voice-play').click();
  await expect(page.getByTestId('onboarding-voice-ask')).toContainText('Vous avez entendu la voix ?');
  expect(await spokenTexts(page)).toContain('Bonjour ! Je suis la voix de Petits Lecteurs.');
  await page.getByTestId('onboarding-voice-yes').click();

  // Passage du téléphone.
  const handoff = page.getByTestId('onboarding-handoff');
  await expect(handoff).toBeVisible();
  await expect(handoff).toContainText('Donnez le téléphone à Léa');
  await expect(handoff).toContainText('Écoute bien la voix, et touche la bonne réponse.');
  await expect(handoff).toContainText('première séance');
  await page.getByTestId('onboarding-go').click();

  // L'accueil de Léa directement (profil déjà choisi).
  await expect(page.getByTestId('hub')).toBeVisible();
  await expect(page.getByTestId('hub-tile-map')).toBeVisible();
  await page.getByTestId('hub-tile-map').click();
  await expect(page.getByTestId('adventure-map')).toBeVisible();

  // Fin du parcours : un rechargement ne le rejoue pas.
  await page.goto('/#/');
  await page.reload();
  await expect(profileCard(page, 'Léa')).toBeVisible();
  await expect(page.getByTestId('onboarding-demo')).toHaveCount(0);
});

test('« Passer » saute la démo et mène directement au code parent', async ({ page }) => {
  await ensureFakeVoice(page);
  await page.goto('/');
  await page.getByTestId('onboarding-next').click();
  await expect(page.getByTestId('onboarding-demo')).toHaveAttribute('data-step', '2');
  await page.getByTestId('onboarding-skip').click();
  await expect(page.getByText('Créer le code parent')).toBeVisible();
});

test('la démo tient sans défiler à 360×640, à chaque écran', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await ensureFakeVoice(page);
  await page.goto('/');
  for (let step = 1; step <= 4; step += 1) {
    await expect(page.getByTestId('onboarding-demo')).toHaveAttribute('data-step', String(step));
    const overflow = await page.evaluate(() => (() => { const app = document.getElementById('app')!; return app.scrollHeight - app.clientHeight; })());
    expect(overflow, `écran ${step}`).toBeLessThanOrEqual(0);
    await expect(page.getByTestId('onboarding-next')).toBeInViewport();
    if (step < 4) await page.getByTestId('onboarding-next').click();
  }
});

test('voix absente : le guide s\'affiche, « Continuer quand même » ne bloque pas', async ({ page }) => {
  await installFakeVoice(page, 'absent');
  await page.goto('/');
  await skipDemo(page);
  await createPin(page);
  await fillChild(page, 'Noé');

  const guide = page.getByTestId('onboarding-voice-guide');
  await expect(guide).toBeVisible();
  await expect(page.getByTestId('onboarding-voice-play')).toHaveCount(0);
  await expect(guide).toContainText('Synthèse vocale');
  await expect(guide).toContainText('Français (France)');
  await expect(page.getByTestId('onboarding-voice-retry')).toBeVisible();

  // Réessayer revérifie : toujours absente, le guide reste.
  await page.getByTestId('onboarding-voice-retry').click();
  await expect(guide).toBeVisible();

  await page.getByTestId('onboarding-voice-continue').click();
  await expect(page.getByTestId('onboarding-handoff')).toContainText('Donnez le téléphone à Noé');
  await page.getByTestId('onboarding-go').click();
  await expect(page.getByTestId('hub')).toBeVisible();
});

test('voix entendue « Non » : le guide s\'affiche, puis on peut réessayer', async ({ page }) => {
  await installFakeVoice(page, 'fr');
  await page.goto('/');
  await skipDemo(page);
  await createPin(page);
  await fillChild(page, 'Zoé');

  await page.getByTestId('onboarding-voice-play').click();
  await page.getByTestId('onboarding-voice-no').click();
  await expect(page.getByTestId('onboarding-voice-guide')).toBeVisible();

  await page.getByTestId('onboarding-voice-retry').click();
  await expect(page.getByTestId('onboarding-voice-play')).toBeVisible();
  await page.getByTestId('onboarding-voice-play').click();
  await page.getByTestId('onboarding-voice-yes').click();
  await expect(page.getByTestId('onboarding-handoff')).toBeVisible();
});

test('« Notre méthode » : page factuelle, sources citées, mention de non-validation', async ({ page }) => {
  await ensureFakeVoice(page);
  await page.goto('/');
  await page.getByTestId('onboarding-method-link').click();
  const method = page.getByTestId('onboarding-method');
  await expect(method).toBeVisible();
  await expect(method).toContainText('Les sons avant les lettres');
  await expect(method).toContainText('Éduscol');
  await expect(method).toContainText('Pour enseigner la lecture et l\'écriture au CP');
  await expect(page.getByTestId('onboarding-method-disclaimer')).toHaveText(
    "Petits Lecteurs n'est ni édité ni validé par l'Éducation nationale.",
  );
  await expect(method.locator('a')).toHaveCount(0);

  await page.getByTestId('onboarding-method-back').click();
  await expect(page.getByTestId('onboarding-demo')).toHaveAttribute('data-step', '1');
});

test('un utilisateur existant (code et profil déjà créés) ne voit pas le parcours', async ({ page }) => {
  await onboardMs(page, 'Alice');
  await page.goto('/');
  await expect(profileCard(page, 'Alice')).toBeVisible();
  await expect(page.getByTestId('onboarding-demo')).toHaveCount(0);
  await expect(page.getByTestId('parent-access')).toBeVisible();
});

test('« Comment ça marche » rouvre la démo depuis l\'espace parent', async ({ page }) => {
  await onboardMs(page, 'Alice');
  await openParentDashboard(page);
  await page.getByTestId('parent-how-it-works').click();
  const demo = page.getByTestId('onboarding-demo');
  await expect(demo).toBeVisible();
  await expect(demo).toHaveAttribute('data-step', '1');
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await expect(demo).toHaveAttribute('data-step', '4');
  await expect(page.getByTestId('onboarding-next')).toHaveText('Terminer');
  await page.getByTestId('onboarding-next').click();
  // Retour au tableau de bord, sans repasser par le code ni par le parcours.
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await expect(page.getByTestId('add-child')).toBeVisible();

  // « Passer » ferme aussi la démo rouverte.
  await page.getByTestId('parent-how-it-works').click();
  await page.getByTestId('onboarding-skip').click();
  await expect(page.getByTestId('add-child')).toBeVisible();
});

test('mode test : le parcours se joue depuis le début', async ({ page }) => {
  await onboardMs(page, 'Alice');
  await openParentDashboard(page);
  await page.getByTestId('tab-settings').click();
  const name = page.getByTestId('app-name');
  for (let i = 0; i < 7; i += 1) await name.click();
  await expect(page.getByTestId('sandbox-block')).toBeVisible();
  await page.getByTestId('sandbox-enter').click();

  await expect(page.getByTestId('sandbox-badge')).toBeVisible();
  await expect(page.getByTestId('onboarding-demo')).toBeVisible();
  await expect(page.getByTestId('onboarding-demo')).toHaveAttribute('data-step', '1');
});
