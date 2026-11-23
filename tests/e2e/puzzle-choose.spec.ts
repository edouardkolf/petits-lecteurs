// Écran de choix de difficulté des jeux libres du hub (« trois portes ») : un tap sur une carte lance la partie.
import { test, expect, type Page } from '@playwright/test';
import { chooseProfile } from './nav';
import { ensureFakeVoice, finishOnboarding, skipDemo } from './reading-helpers';

const PARENT_PIN = '1234';

// ---------- Garde-fou qualité : aucune erreur JS, aucun console.error pendant un test ----------

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
// ---------- Aides : espace parent ----------

async function enterPin(page: Page, pin: string): Promise<void> {
  for (const digit of pin) await page.getByTestId(`pin-key-${digit}`).click();
}

/** Premier lancement : code parent 1234, puis un enfant (sans limite de temps). Termine sur l'écran profils. */
async function onboardWithChild(page: Page, name: string): Promise<void> {
  await ensureFakeVoice(page);
  await page.goto('/');
  await skipDemo(page);
  await expect(page.getByText('Créer le code parent')).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByText('Confirme le code')).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await page.locator('input[name=name]').fill(name);
  await page.locator('select[name=sessionMinutes]').selectOption('');
  await page.locator('select[name=dailyMinutes]').selectOption('');
  await page.getByTestId('save-child').click();
  await finishOnboarding(page);
}


const GAMES = ['memory', 'order', 'maze', 'robot'];

test('trois cartes visibles sans défiler à 360×640, un tap lance la partie, la dernière difficulté est marquée', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await onboardWithChild(page, 'Noa');
  await chooseProfile(page, 'Noa');
  await page.getByTestId('hub-tile-memory').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');

  for (const p of ['easy', 'medium', 'hard']) {
    const card = page.getByTestId(`puzzle-preset-${p}`);
    await expect(card).toBeInViewport({ ratio: 1 });
    const box = await card.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(110);
    await expect(card).toHaveAttribute('data-last', 'false');
  }
  const noOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noOverflow).toBe(true);

  await page.getByTestId('puzzle-preset-medium').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-preset', 'medium');

  // La partie est créée au premier tap sur le plateau (A9) : c'est elle qui fait le « dernier joué ».
  await page.locator('.memory-card').first().click();
  await page.getByTestId('puzzle-level').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');
  await expect(page.getByTestId('puzzle-preset-medium')).toHaveAttribute('data-last', 'true');
  await expect(page.getByTestId('puzzle-preset-easy')).toHaveAttribute('data-last', 'false');
  await expect(page.getByTestId('puzzle-preset-hard')).toHaveAttribute('data-last', 'false');
});

test('chaque jeu du hub propose les trois cartes sans défilement à 412×915', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await onboardWithChild(page, 'Noa');
  await chooseProfile(page, 'Noa');
  for (const game of GAMES) {
    await page.getByTestId(`hub-tile-${game}`).click();
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');
    for (const p of ['easy', 'medium', 'hard']) await expect(page.getByTestId(`puzzle-preset-${p}`)).toBeInViewport({ ratio: 1 });
    await page.getByTestId('to-hub').click();
    await expect(page.getByTestId('hub')).toBeVisible();
  }
});
