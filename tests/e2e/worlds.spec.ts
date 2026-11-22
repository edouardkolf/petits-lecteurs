// Mondes de la carte : arrivée dans un nouveau monde (trajet de l'avatar puis panneau), une seule fois.
// Le saut est obtenu par l'« étape de départ » de la fiche enfant (étape 4 : le niveau en cours est dans le monde
// des nuages) : rejouer 60 niveaux n'apporterait rien ici.
import { test, expect } from '@playwright/test';
import { chooseProfile } from './nav';
import { installFakeVoice, onboardMs, openParentDashboard, openReading } from './reading-helpers';

let jsErrors: string[] = [];
let consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  jsErrors = [];
  consoleErrors = [];
  page.on('pageerror', (err) => jsErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
});

test.afterEach(() => {
  expect(jsErrors, `Erreur(s) JS non interceptée(s) sur la page :\n${jsErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `console.error émis par la page :\n${consoleErrors.join('\n')}`).toEqual([]);
});

test('arrivée dans un nouveau monde : panneau, puis plus jamais', async ({ page }) => {
  await installFakeVoice(page, 'fr');
  await onboardMs(page, 'Lou');
  await chooseProfile(page, 'Lou');
  await openReading(page);
  // Première visite : calibrage silencieux sur la forêt, aucune fête.
  await expect(page.getByTestId('reading-level-1')).toHaveAttribute('data-state', 'current');
  await page.waitForTimeout(300);
  await expect(page.getByTestId('world-banner')).toHaveCount(0);

  // L'enfant saute loin dans le parcours (étape de départ 4).
  await page.getByTestId('to-hub').click();
  await page.getByTestId('hub-to-profiles').click();
  await openParentDashboard(page);
  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.getByTestId('reading-start-stage').selectOption('4');
  await page.getByTestId('save-child').click();
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByTestId('back-to-game').click();
  await chooseProfile(page, 'Lou');
  await openReading(page);

  // Panneau du nouveau monde.
  const banner = page.getByTestId('world-banner');
  await expect(banner).toBeVisible({ timeout: 5000 });
  await expect(banner).toHaveAttribute('data-world', 'clouds');
  await page.waitForTimeout(700);
  await banner.click();
  await expect(banner).toHaveCount(0);

  const node = page.locator('[data-testid^="reading-level-"][data-state="current"]');
  await expect(node).toBeVisible();
  await expect(node.locator('xpath=..')).toHaveAttribute('data-world', 'clouds');
  await expect(node.locator('xpath=..').locator('.map-node__avatar')).toBeVisible();

  // La tuile carte du hub montre elle aussi le monde déjà fêté (HUB.md §2.1, §3 règle 4).
  await page.getByTestId('to-hub').click();
  await expect(page.getByTestId('hub-tile-map')).toHaveAttribute('data-world', 'clouds');

  // Déjà vue : ne se rejoue pas.
  await page.reload();
  await chooseProfile(page, 'Lou');
  await openReading(page);
  await expect(node).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('world-banner')).toHaveCount(0);
});
