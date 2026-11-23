// Jeux de maternelle du hub (docs/specs/JEUX-MATERNELLE.md) : memory (jeu libre).
// Aides de navigation communes : tests/e2e/nav.ts.
//
// Les vues exposent leur manche en DOM : `.play-round[data-answer]` (memory : « cleared » ; ranger : rangs/valeurs
// dans l'ordre croissant, « 1-2-3 » ; labyrinthe : chemin), `.memory-card[data-object]` (objet de chaque carte),
// `.maze-view[data-size|data-start|data-goal|data-right|data-down]` (murs ; le chemin est calculé par BFS ici).
import { test, expect, type Locator, type Page } from '@playwright/test';
import { backToHub, backToProfiles, chooseProfile } from './nav';
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

/** Premier lancement : code parent 1234, puis un enfant MS (sans limite de temps). Termine sur l'écran profils. */
async function onboardMs(page: Page, name: string): Promise<void> {
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

async function longPress(page: Page, locator: Locator, ms: number): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Élément introuvable pour simuler un appui long.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Depuis l'écran profils : espace parent puis statistiques de l'enfant. */
async function openChildStats(page: Page, childName: string): Promise<void> {
  await longPress(page, page.getByTestId('parent-access'), 2100);
  await expect(page.getByText('Code parent', { exact: true })).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByRole('button', { name: 'Statistiques' }).click();
  await expect(page.getByRole('heading', { name: childName })).toBeVisible();
}

// ---------- Aides : memory ----------

/** Objet de chaque carte (index = numéro de carte), lu sur `data-object`. */
async function memoryObjects(page: Page): Promise<string[]> {
  const cards = page.locator('.memory-card');
  await expect(cards.first()).toBeVisible();
  return cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-object') ?? ''));
}

/** Attend la fin de l'aperçu (toutes les cartes sont alors recachées) : les taps y sont ignorés. */
async function waitPeekOver(page: Page): Promise<void> {
  await expect(page.locator('.memory-card--up')).toHaveCount(0, { timeout: 8000 });
}

const card = (page: Page, i: number): Locator => page.locator(`[data-choice="card-${i}"]`);

/** Retrouve toutes les paires de la manche affichée, en vérifiant que chaque paire reste visible. */
async function solveMemoryRound(page: Page, skipPairs: ReadonlySet<string> = new Set()): Promise<void> {
  const objects = await memoryObjects(page);
  await waitPeekOver(page);
  const byObject = new Map<string, number[]>();
  objects.forEach((o, i) => byObject.set(o, [...(byObject.get(o) ?? []), i]));
  for (const [obj, idx] of byObject) {
    if (skipPairs.has(obj)) continue;
    expect(idx, `chaque objet apparaît exactement deux fois (${obj})`).toHaveLength(2);
    const before = await page.locator('.memory-card--found').count();
    await card(page, idx[0] as number).click();
    await card(page, idx[1] as number).click();
    await expect(page.locator('.memory-card--found')).toHaveCount(before + 2);
  }
}

// ---------- Aides : écran de jeu libre ----------

const stage = (page: Page): Locator => page.locator('.puzzle-stage .play-round[data-answer]');

async function openFreeMemory(page: Page): Promise<void> {
  await page.getByTestId('hub-tile-memory').click();
  await expect(page).toHaveURL(/#\/memory$/);
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');
  for (const preset of ['easy', 'medium', 'hard']) await expect(page.getByTestId(`puzzle-preset-${preset}`)).toBeVisible();
}

/** Un seul tap sur la carte de difficulté lance la partie. */
async function startFreeGame(page: Page, preset: 'easy' | 'medium' | 'hard' = 'easy'): Promise<void> {
  await page.getByTestId(`puzzle-preset-${preset}`).click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-preset', preset);
  await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '0');
  await expect(stage(page)).toBeVisible();
}

async function viewHandle(page: Page) {
  const handle = await page.locator('.puzzle-stage .play-round > *').first().elementHandle();
  if (!handle) throw new Error('Vue de mécanique introuvable.');
  return handle;
}

async function expectNewRound(page: Page, handle: Awaited<ReturnType<typeof viewHandle>>): Promise<void> {
  await expect.poll(() => handle.evaluate((el) => el.isConnected), { timeout: 10_000 }).toBe(false);
  await expect(page.locator('.puzzle-stage .play-round > *').first()).toBeVisible();
}

// ==================== 1. Jeu libre memory ====================

test.describe('jeu libre memory', () => {
  test.slow();

  test('★ : 3 paires (aperçu), toutes retrouvées, une manche résolue, nouvelle manche', async ({ page }) => {
    await onboardMs(page, 'Mila');
    await chooseProfile(page, 'Mila');
    // Hub : 6 tuiles par défaut (la carte de l'aventure + coloriage, memory, ranger, labyrinthe, robot).
    await expect(page.getByTestId('hub').locator('[data-testid^="hub-tile-"]')).toHaveCount(6);
    for (const tile of ['map', 'coloring', 'memory', 'order', 'maze', 'robot']) {
      await expect(page.getByTestId(`hub-tile-${tile}`)).toBeVisible();
    }
    await openFreeMemory(page);
    await startFreeGame(page);

    // ★ : 3 paires = 6 cartes, aperçu de toutes les faces au début.
    const objects = await memoryObjects(page);
    expect(objects).toHaveLength(6);
    expect(new Set(objects).size).toBe(3);
    await expect(page.locator('.memory-card--up')).toHaveCount(6);
    await waitPeekOver(page);

    const handle = await viewHandle(page);
    await solveMemoryRound(page);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
    await expectNewRound(page, handle);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
    // La nouvelle manche est une table neuve (rien de retourné une fois l'aperçu passé).
    await waitPeekOver(page);
    await expect(page.locator('.memory-card--found')).toHaveCount(0);
    await backToHub(page);
  });

  test('★★ : une paire ratée se recache, taps ignorés pendant ce temps, le jeu continue', async ({ page }) => {
    await onboardMs(page, 'Mila');
    await chooseProfile(page, 'Mila');
    await openFreeMemory(page);
    await startFreeGame(page, 'medium');

    const objects = await memoryObjects(page);
    expect(objects).toHaveLength(12);
    await waitPeekOver(page);

    // Deux cartes d'objets différents.
    const a = 0;
    const b = objects.findIndex((o) => o !== objects[a]);
    const c = objects.findIndex((o, i) => i !== a && i !== b && o !== objects[a] && o !== objects[b]);
    await card(page, a).click();
    await card(page, b).click();
    await expect(page.locator('.memory-card--up')).toHaveCount(2);
    // Pendant que les deux cartes sont visibles, un 3e tap est ignoré.
    await card(page, c).click();
    await expect(page.locator('.memory-card--up')).toHaveCount(2);
    await expect(card(page, c)).not.toHaveClass(/memory-card--up/);
    // Elles se recachent (~900 ms) ; rien n'est « trouvé », la manche n'est pas comptée.
    await expect(page.locator('.memory-card--up')).toHaveCount(0, { timeout: 4000 });
    await expect(page.locator('.memory-card--found')).toHaveCount(0);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '0');

    // Le jeu continue : on retrouve toutes les paires.
    const handle = await viewHandle(page);
    await solveMemoryRound(page);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
    await expectNewRound(page, handle);
    await backToHub(page);
  });
});
