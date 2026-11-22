// Minuteur de session, quota quotidien et écran de fin (voir docs/ARCHITECTURE.md §8).
// Utilise `page.clock` (fake timers) pour avancer le temps sans attendre en vrai. L'horloge de
// session (SessionProvider) démarre un `setInterval` dès le premier chargement de l'app : la fausse
// horloge doit donc être installée AVANT `page.goto('/')`, sinon cet intervalle déjà natif ignore
// `page.clock.runFor(...)`. On utilise `runFor` pour tout, y compris les appuis longs (l'anneau de
// progression repose sur `requestAnimationFrame`, également piloté par l'horloge simulée une fois installée).
// Les parties se jouent sur le memory libre (hub) ; la carte de lecture porte le minuteur hors partie.
import { test, expect, type Page, type Locator } from '@playwright/test';
import { chooseProfile, enterMap, profileCard } from './nav';
import { readReadings } from './reading-helpers';

/**
 * Après `clock.runFor('15:05')`, l'appli a 15 minutes de tics d'horloge à enregistrer d'un coup (écritures IndexedDB
 * réelles, hors horloge simulée) : l'écran de fin arrive un peu après. Sur le téléphone, le temps passe vraiment et ce
 * retard n'existe pas. On laisse donc plus que les 5 s par défaut, sans rien changer à ce qui est vérifié.
 */
const LOCK_AFTER_FAST_FORWARD_MS = 15_000;

/** Verrou (écran de fin) enregistré par l'appli, lu directement dans IndexedDB. */
async function readLock(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const request = indexedDB.open('petits-lecteurs');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const settings = await new Promise<{ lock?: unknown } | undefined>((resolve) => {
      const request = db.transaction('settings').objectStore('settings').get('app');
      request.onsuccess = () => resolve(request.result as { lock?: unknown } | undefined);
    });
    db.close();
    return settings?.lock ?? null;
  });
}

const PARENT_PIN = '1234';

// ---------- Garde-fou qualité : aucune erreur JS, aucun console.error pendant un test ----------

let jsErrors: string[] = [];
let consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  jsErrors = [];
  consoleErrors = [];
  page.on('pageerror', (err) => {
    jsErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
});

test.afterEach(() => {
  expect(jsErrors, `Erreur(s) JS non interceptée(s) sur la page :\n${jsErrors.join('\n')}`).toEqual([]);
  expect(consoleErrors, `console.error émis par la page :\n${consoleErrors.join('\n')}`).toEqual([]);
});

// ---------- Aides reprises de vertical-slice.spec.ts ----------

async function enterPin(page: Page, pin: string): Promise<void> {
  for (const digit of pin) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
}

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

// ---------- Aides propres à ce fichier ----------

/** Appui long piloté par l'horloge simulée (`page.clock` doit déjà être installée). */
async function longPressClock(page: Page, locator: Locator, ms: number): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Élément introuvable pour simuler un appui long.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(ms);
  await page.mouse.up();
}

/** Déverrouille l'écran de fin (cadenas + code) puis clique un bouton du panneau parent (grant-5, grant-15, end-session). */
async function unlockAndTap(page: Page, testId: string): Promise<void> {
  await longPressClock(page, page.getByTestId('lock-parent'), 2100);
  await expect(page.getByText('Code parent', { exact: true })).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByTestId(testId)).toBeVisible();
  await page.getByTestId(testId).click();
}

// ==================== 1. Minuteur de session sur la carte ====================

test('minuteur de session sur la carte : écran de fin, persiste au rechargement, +5 minutes permet de rejouer', async ({
  page,
}) => {
  test.slow();
  await page.clock.install();
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await expect(page.getByTestId('reading-level-1')).toBeVisible();

  await page.clock.runFor('15:05'); // dépasse les 15 min de session par défaut (fixées à la création de l'enfant)

  // Sur la carte ("hors partie") : l'horloge de session navigue elle-même vers l'écran de fin.
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  await page.reload(); // l'horloge simulée (et le temps déjà avancé) survit au rechargement
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS }); // toujours bloqué : settings.lock persisté

  // Messages de l'écran de fin : enfant (demander à un adulte) + consigne adulte (appui long cadenas).
  await expect(page.getByTestId('lock-message')).toContainText('Tu as utilisé tout le temps disponible.');
  await expect(page.getByTestId('lock-message')).toContainText('Demande à un adulte pour ajouter du temps.');
  await expect(page.getByTestId('lock-hint')).toContainText('restez appuyé');

  await unlockAndTap(page, 'grant-5');

  await expect(page.getByTestId('hub')).toBeVisible(); // déverrouillé, retour au hub (et non plus la carte)
  await page.getByTestId('hub-tile-memory').click();
  await expect(page.getByTestId('puzzle')).toBeVisible(); // l'enfant peut effectivement rejouer
});

test("verrou de la veille : le lendemain, l'enfant n'est plus bloqué et repart avec un temps neuf", async ({ page }) => {
  test.slow();
  await page.clock.install();
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await page.clock.runFor('15:05'); // limite de session atteinte : écran de fin, personne ne déverrouille
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  await page.clock.fastForward('24:00:00'); // le lendemain
  await page.reload();

  // Plus d'écran de fin : retour aux profils, puis jeu normal (session et quota du jour neufs).
  await expect(page.getByTestId('lock-parent')).toHaveCount(0);
  await expect(profileCard(page, 'Lina')).toBeVisible();
  await chooseProfile(page, 'Lina');
  await page.getByTestId('hub-tile-memory').click();
  await expect(page.getByTestId('puzzle')).toBeVisible();
});

// ==================== 2. Minuteur pendant une partie ====================

/** Parties du store `puzzles` (memory, ranger, labyrinthe, robot), lues directement dans IndexedDB. */
async function readPuzzles(page: Page): Promise<Array<{ game: string; status: string; endReason: string | null }>> {
  return page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const request = indexedDB.open('petits-lecteurs');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<Array<{ game: string; status: string; endReason: string | null }>>((resolve) => {
      const request = db.transaction('puzzles').objectStore('puzzles').getAll();
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return records;
  });
}

test('minuteur pendant une partie : la manche se termine puis écran de fin', async ({ page }) => {
  test.slow();
  await page.clock.install();
  await onboardWithChild(page, 'Lina');
  await chooseProfile(page, 'Lina');
  await page.getByTestId('hub-tile-memory').click();
  await page.getByTestId('puzzle-preset-easy').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
  const cards = page.locator('.memory-card');
  await expect(cards.first()).toBeVisible();
  const objects = await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-object') ?? ''));
  await page.clock.runFor(3000); // aperçu des cartes terminé

  // Une paire fausse d'abord (réaliste : la partie est créée au premier tap).
  const a = 0;
  const b = objects.findIndex((o) => o !== objects[a]);
  await page.locator(`[data-choice="card-${a}"]`).click();
  await page.locator(`[data-choice="card-${b}"]`).click();
  await page.clock.runFor(2000); // elles se recachent

  await page.clock.runFor('15:05'); // épuise la session pendant que la manche est affichée
  // 15 minutes de tics arrivent d'un coup : on attend que l'appli ait enregistré le verrou avant de répondre.
  await expect.poll(() => readLock(page), { timeout: LOCK_AFTER_FAST_FORWARD_MS }).not.toBeNull();

  // Les paires restantes se retrouvent malgré le minuteur écoulé : la manche en cours se termine normalement...
  const byObject = new Map<string, number[]>();
  objects.forEach((o, i) => byObject.set(o, [...(byObject.get(o) ?? []), i]));
  for (const idx of byObject.values()) {
    await page.locator(`[data-choice="card-${idx[0]}"]`).click();
    await page.locator(`[data-choice="card-${idx[1]}"]`).click();
  }
  // ... mais au lieu de lancer la manche suivante, le jeu s'arrête : écran de fin.
  await page.clock.runFor(1500);
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  await unlockAndTap(page, 'end-session');
  await expect(profileCard(page, 'Lina')).toBeVisible();

  // La manche en cours est allée au bout, et aucune nouvelle partie n'a été lancée.
  const puzzles = await readPuzzles(page);
  expect(puzzles).toHaveLength(1);
  expect(puzzles[0]).toMatchObject({ game: 'memory', status: 'completed' });
});

// ==================== F1. Retour Android après l'écran de fin ne contourne jamais le verrou ====================

test('F1 : le bouton retour Android après l\'écran de fin reste bloqué, aucune nouvelle séance', async ({ page }) => {
  test.slow();
  await page.clock.install();
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await expect(page.getByTestId('reading-level-1')).toBeVisible();

  // Fin du temps sur la carte : l'écran de fin s'affiche directement.
  await page.clock.runFor('15:05');
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  // Retour Android : toujours l'écran de fin, jamais le hub ni une séance relancée.
  await page.goBack();
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  // Même après un délai (> 10 min, fenêtre de reprise de session) qui, avant le correctif, aurait
  // fait repartir une session neuve à 0 et n'aurait plus jamais réappliqué le verrou.
  await page.clock.runFor('11:00');
  await page.goBack();
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });
  await expect(page.getByTestId('reading-session')).toHaveCount(0);

  await unlockAndTap(page, 'end-session');
  await expect(profileCard(page, 'Lina')).toBeVisible();

  // Aucune séance de lecture n'a été lancée par les retours Android.
  expect(await readReadings(page)).toHaveLength(0);
});

// ==================== 3. Quota quotidien épuisé ====================

test('quota du jour épuisé : le profil apparaît estompé et non sélectionnable ; « Terminer » ramène aux profils', async ({
  page,
}) => {
  test.slow();
  // Heure de départ fixée en milieu de journée : les 30 min simulées ne doivent jamais passer minuit,
  // sinon le temps se répartit sur deux jours locaux et le quota du jour n'est jamais atteint.
  await page.clock.install({ time: new Date('2026-09-28T10:00:00') });
  await onboardWithChild(page, 'Lina');
  await enterMap(page, 'Lina');
  await expect(page.getByTestId('reading-level-1')).toBeVisible();

  // Une session de 15 min n'épuise que le minuteur de session : il en faut deux pour atteindre le
  // quota du jour (30 min par défaut). On repart via « Terminer » (pas « +X ») entre les deux : le
  // quota du jour ne dépend que du temps cumulé (`usage`), jamais de la session en cours.
  await page.clock.runFor('15:05');
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });
  await unlockAndTap(page, 'end-session');
  await expect(profileCard(page, 'Lina')).toBeVisible();
  await expect(profileCard(page, 'Lina')).not.toHaveAttribute('data-exhausted', 'true'); // quota pas encore épuisé

  await enterMap(page, 'Lina');
  await expect(page.getByTestId('reading-level-1')).toBeVisible();
  await page.clock.runFor('15:05');
  await expect(page.getByTestId('lock-parent')).toBeVisible({ timeout: LOCK_AFTER_FAST_FORWARD_MS });

  await unlockAndTap(page, 'end-session');
  await expect(profileCard(page, 'Lina')).toBeVisible();

  const card = profileCard(page, 'Lina');
  await expect(card).toHaveAttribute('data-exhausted', 'true');

  // Le taper déclenche un petit tremblement, rien d'autre (pas de retour sur la carte).
  await card.click();
  await expect(card).toHaveClass(/is-shaking/);
  await expect(page).not.toHaveURL(/#\/(map|hub)$/);
  await expect(profileCard(page, 'Lina')).toBeVisible();
});
