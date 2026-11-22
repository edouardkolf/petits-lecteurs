// Tranche verticale de bout en bout (voir docs/ARCHITECTURE.md §3, §5, §7) : rejoue le parcours
// réel d'un parent puis d'une enfant sur le viewport Pixel 7 (projet `mobile-chrome`).
// Chaque test démarre avec un contexte Playwright neuf, donc un stockage IndexedDB vierge.
// Chromium headless n'a pas de voix : fausse voix de `reading-helpers.ts`.
import { readFileSync } from 'node:fs';
import { test, expect, type Page, type Locator } from '@playwright/test';
import { EXPORT_FORMAT, type ExportBundle } from '../../src/storage/types';
import { backToProfiles, enterMap, profileCard } from './nav';
import {
  answerFirstRealQuestion,
  finishEnd,
  installFakeVoice,
  playFullSession,
  readReadings,
  startCurrentLevel,
} from './reading-helpers';

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
  await installFakeVoice(page, 'fr');
});

test.afterEach(() => {
  expect(jsErrors, `Erreur(s) JS non interceptée(s) sur la page :\n${jsErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `console.error émis par la page :\n${consoleErrors.join('\n')}`).toEqual([]);
});

// ---------- Aides ----------

async function enterPin(page: Page, pin: string): Promise<void> {
  for (const digit of pin) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
}

/** Premier lancement complet : code parent 1234 puis un enfant. Termine sur l'écran profils. */
async function onboardWithChild(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('Commencer : espace parent')).toBeVisible();
  await page.getByText('Commencer : espace parent').click();

  await expect(page.getByText('Créer le code parent')).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByText('Confirme le code')).toBeVisible();
  await enterPin(page, PARENT_PIN);

  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByTestId('add-child').click();
  await page.locator('input[name=name]').fill(name);
  await page.getByTestId('save-child').click();

  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByTestId('back-to-game').click();
  await expect(page.getByText('Commencer : espace parent')).toHaveCount(0);
}

async function longPress(page: Page, locator: Locator, ms: number): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Élément introuvable pour simuler un appui long.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

/** Appui long de 2 s sur le cadenas (durationMs configuré à 2000 dans ProfilePicker). */
async function openParentAccess(page: Page): Promise<void> {
  await longPress(page, page.getByTestId('parent-access'), 2100);
}

/** Depuis l'écran profils (avec l'enfant visible) : ouvre l'espace parent puis les statistiques. */
async function openChildStats(page: Page, childName: string): Promise<void> {
  await openParentAccess(page);
  await expect(page.getByText('Code parent', { exact: true })).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByRole('button', { name: 'Statistiques' }).click();
  await expect(page.getByRole('heading', { name: childName })).toBeVisible();
}

// ==================== 1. Premier lancement → configuration ====================

test('premier lancement : création du code parent et du premier enfant', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Commencer : espace parent')).toBeVisible();
  // Pas encore d'enfant : le cadenas d'accès parent n'existe pas sur l'écran de bienvenue.
  await expect(page.getByTestId('parent-access')).toHaveCount(0);

  await onboardWithChild(page, 'Lina');

  await expect(profileCard(page, 'Lina')).toBeVisible();
});

// ==================== 2. Tranche verticale complète ====================

test('tranche verticale complète : niveau de lecture, carte, stats et export', async ({ page }) => {
  test.slow(); // une séance jouée en entier + animations + appui long : plus que les 30 s par défaut.

  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');

  // ---- Carte : le niveau 1 est le niveau en cours, le 2 est verrouillé ----
  await expect(page.getByTestId('reading-level-1')).toHaveAttribute('data-state', 'current');
  await expect(page.getByTestId('reading-level-2')).toHaveAttribute('data-state', 'locked');

  // ---- Séance complète puis retour à la carte : niveau 1 fait, niveau 2 ouvert ----
  await startCurrentLevel(page);
  await playFullSession(page);
  await finishEnd(page);
  await expect(page.getByTestId('reading-level-1')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('reading-level-2')).toHaveAttribute('data-state', 'current');

  // ---- Statistiques parent : la séance est comptée ----
  await page.getByTestId('to-hub').click();
  await page.getByTestId('hub-to-profiles').click();
  await openChildStats(page, 'Lina');
  await expect(page.getByTestId('reading-stats-sessions')).toHaveText('1');

  // ---- Export : format, 1 profil, 1 séance de lecture, aucun champ pinHash ----
  await page.getByRole('button', { name: 'Retour aux enfants' }).click();
  await page.getByTestId('tab-data').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error('Export : le téléchargement n’a produit aucun fichier local.');
  const raw = readFileSync(filePath, 'utf-8');
  const bundle = JSON.parse(raw) as ExportBundle;

  expect(bundle.format).toBe(EXPORT_FORMAT);
  expect(bundle.profiles).toHaveLength(1);
  expect(bundle.readings).toHaveLength(1);
  expect(raw).not.toContain('pinHash');
});

// ==================== 3. Retour Android pendant une séance ====================

test('le bouton retour Android pendant une séance compte comme abandon', async ({ page }) => {
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await startCurrentLevel(page);
  await answerFirstRealQuestion(page); // la séance est enregistrée à la première vraie réponse
  await expect.poll(async () => (await readReadings(page)).length, { timeout: 10_000 }).toBe(1);

  await page.goBack();

  await expect(page.getByTestId('adventure-map')).toBeVisible();
  await expect.poll(async () => (await readReadings(page))[0]?.status).toBe('abandoned');
  await expect(page.getByTestId('reading-level-1')).toHaveAttribute('data-state', 'current');
});

// ==================== 4. Persistance ====================

test('le profil et la progression survivent à un rechargement', async ({ page }) => {
  test.slow();
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await startCurrentLevel(page);
  await playFullSession(page);
  await finishEnd(page);

  await page.reload();

  // Le profil actif n'est pas persisté (état en mémoire) : on revient à l'écran profils, où Lina
  // doit toujours apparaître — c'est la persistance qui compte, pas la route.
  await expect(profileCard(page, 'Lina')).toBeVisible();
  await enterMap(page, 'Lina');
  await expect(page.getByTestId('reading-level-1')).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('reading-level-2')).toHaveAttribute('data-state', 'current');
});

// Une app fermée pendant une séance : closeStaleGameRecords() (au montage de AppShell) clôt la séance orpheline.
test('une app fermée pendant une séance compte comme abandon au redémarrage', async ({ page }) => {
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await startCurrentLevel(page);
  await answerFirstRealQuestion(page);
  await expect.poll(async () => (await readReadings(page)).length, { timeout: 10_000 }).toBe(1);

  await page.reload(); // simule l'app tuée pendant la séance (in_progress laissée telle quelle)

  await expect(profileCard(page, 'Lina')).toBeVisible();
  await expect.poll(async () => (await readReadings(page))[0]?.status).toBe('abandoned');
});

// ==================== 5. PWA ====================

test('PWA : manifest valide, service worker actif, fonctionne hors ligne', async ({ page, context }) => {
  test.slow(); // deux rechargements complets + vérifications réseau du manifest et des icônes.

  await onboardWithChild(page, 'Lina');

  // ---- Manifest lié et valide ----
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  if (!manifestHref) throw new Error('Aucune balise <link rel="manifest"> dans la page.');
  const manifestUrl = new URL(manifestHref, page.url()).toString();
  const manifestResp = await page.request.get(manifestUrl);
  expect(manifestResp.status()).toBe(200);
  const manifest = (await manifestResp.json()) as {
    name: string;
    id: string;
    display: string;
    icons: Array<{ src: string; sizes: string; purpose?: string }>;
  };
  expect(manifest.name).toBe('Petits Lecteurs');
  expect(manifest.id).toBe('petits-lecteurs');
  expect(manifest.display).toBe('fullscreen');
  const sizes = new Set(manifest.icons.map((i) => i.sizes));
  expect(sizes.has('192x192')).toBe(true);
  expect(sizes.has('512x512')).toBe(true);
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);

  for (const icon of manifest.icons) {
    const iconUrl = new URL(icon.src, manifestUrl).toString();
    const resp = await page.request.get(iconUrl);
    expect(resp.status(), `icône ${icon.src} accessible en HTTP`).toBe(200);
  }

  // ---- Un service worker s'enregistre et contrôle la page après un rechargement ----
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  expect(controlled).toBe(true);
  await expect(profileCard(page, 'Lina')).toBeVisible();

  // ---- Hors ligne : l'app s'affiche toujours (écran profils avec Lina) ----
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(profileCard(page, 'Lina')).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
