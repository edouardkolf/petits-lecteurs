// Pauses de révision (docs/specs/PAUSES-REVISION.md) : pendant un mini-jeu, toutes les N minutes de temps actif, un écran
// de lecture se pose par-dessus le jeu (2 à 3 questions), puis le jeu reprend. Chromium headless n'a pas de voix :
// fausse voix de `reading-helpers.ts`. Le compteur est posé dans IndexedDB pour aller vite ; un seul test attend les
// 30 s réelles de l'option admin « Pauses toutes les 30 s (test) ».
import { test, expect, type Locator, type Page } from '@playwright/test';
import { chooseProfile, backToHub } from './nav';
import { PARENT_PIN, answerCurrent, enterPin, installFakeVoice, openParentDashboard, readReadings, spokenTexts, type VoiceMode, ensureFakeVoice, finishOnboarding, skipDemo } from './reading-helpers';

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

// ---------- Aides ----------

interface Onboard {
  /** Étape de départ : 3 tient pour acquises les lettres des étapes 1 et 2 (a, i, o, u, é). */
  startStage?: 1 | 2 | 3 | 4 | 5;
  /** Éteint l'interrupteur « Pauses de lecture » dès la création de la fiche. */
  pausesOff?: boolean;
}

/** Premier lancement : code parent, un enfant MS sans limite de temps, retour au choix des profils. */
async function onboard(page: Page, name: string, opts: Onboard = {}): Promise<void> {
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
  if (opts.startStage !== undefined) await page.getByTestId('reading-start-stage').selectOption(String(opts.startStage));
  if (opts.pausesOff) {
    const toggle = page.getByTestId('pause-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('pause-interval')).toHaveCount(0);
  }
  await page.getByTestId('save-child').click();
  await finishOnboarding(page);
}

/** Pose le temps de mini-jeu déjà joué : la pause est due au prochain point de contrôle d'un mini-jeu. */
async function seedPauseCounter(page: Page, ms: number): Promise<void> {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('petits-lecteurs');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['profiles', 'settings'], 'readwrite');
          const profiles = tx.objectStore('profiles').getAll();
          profiles.onsuccess = () => {
            const id = (profiles.result[0] as { id: string }).id;
            const store = tx.objectStore('settings');
            const get = store.get('app');
            get.onsuccess = () => {
              const app = (get.result ?? {}) as Record<string, unknown>;
              store.put({ ...app, pauseMs: { [id]: value } }, 'app');
            };
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    ms,
  );
}

interface StoredPause {
  context?: string;
  levelId?: string;
  hard?: boolean;
  status: string;
  planned: number;
  demos: string[];
  answers: { itemId: string; game: string; correct: boolean; retention?: boolean; retry: boolean }[];
}

async function readUsage(page: Page): Promise<{ activitySeconds?: Record<string, number> }[]> {
  return page.evaluate(
    () =>
      new Promise<{ activitySeconds?: Record<string, number> }[]>((resolve, reject) => {
        const open = indexedDB.open('petits-lecteurs');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const request = db.transaction('usage', 'readonly').objectStore('usage').getAll();
          request.onsuccess = () => {
            resolve(request.result);
            db.close();
          };
          request.onerror = () => reject(request.error);
        };
      }),
  );
}

const pauseRecords = async (page: Page): Promise<StoredPause[]> =>
  ((await readReadings(page)) as unknown as StoredPause[]).filter((r) => r.context === 'pause');

// ----- memory -----

const card = (page: Page, i: number): Locator => page.locator(`[data-choice="card-${i}"]`);

async function openMemory(page: Page): Promise<void> {
  await page.getByTestId('hub-tile-memory').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');
}

async function startMemory(page: Page): Promise<void> {
  await page.getByTestId('puzzle-preset-easy').click();
}

/** Retrouve toutes les paires de la manche affichée. */
async function solveMemoryRound(page: Page): Promise<void> {
  const cards = page.locator('.memory-card');
  await expect(cards.first()).toBeVisible();
  const objects = await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-object') ?? ''));
  await expect(page.locator('.memory-card--up')).toHaveCount(0, { timeout: 8000 });
  const byObject = new Map<string, number[]>();
  objects.forEach((o, i) => byObject.set(o, [...(byObject.get(o) ?? []), i]));
  for (const idx of byObject.values()) {
    const before = await page.locator('.memory-card--found').count();
    await card(page, idx[0] as number).click();
    await card(page, idx[1] as number).click();
    await expect(page.locator('.memory-card--found')).toHaveCount(before + 2);
  }
}

// ----- la pause -----

const pauseOverlay = (page: Page): Locator => page.getByTestId('reading-pause');

/** Joue la pause jusqu'au bout en répondant juste (exemples guidés compris). Rend les jeux rencontrés. */
async function answerPause(page: Page): Promise<string[]> {
  const games: string[] = [];
  const question = page.getByTestId('reading-question');
  for (let guard = 0; guard < 20; guard += 1) {
    if ((await pauseOverlay(page).count()) === 0 || (await page.getByTestId('reading-pause-end').count()) > 0) break;
    if ((await question.count()) === 0) {
      await page.waitForTimeout(100);
      continue;
    }
    const handle = await question.elementHandle();
    if (!handle) continue;
    if ((await question.getAttribute('data-solved')) === 'true') {
      await expect.poll(() => handle.evaluate((el) => el.isConnected).catch(() => false), { timeout: 15_000 }).toBe(false);
      continue;
    }
    const info = await answerCurrent(page);
    games.push(info.game);
    await expect.poll(() => handle.evaluate((el) => el.isConnected).catch(() => false), { timeout: 20_000 }).toBe(false);
  }
  return games;
}

/** Rate la pause : un mauvais choix (ou un mauvais nombre de frappes) après l'autre, jusqu'à ce qu'elle se termine. */
async function failPause(page: Page): Promise<void> {
  const question = page.getByTestId('reading-question');
  for (let guard = 0; guard < 30; guard += 1) {
    if ((await pauseOverlay(page).count()) === 0 || (await page.getByTestId('reading-pause-end').count()) > 0) return;
    if ((await question.count()) === 0) {
      await page.waitForTimeout(100);
      continue;
    }
    const handle = await question.elementHandle();
    if (!handle) continue;
    if ((await question.getAttribute('data-ready')) !== 'true' || (await question.getAttribute('data-solved')) === 'true') {
      await page.waitForTimeout(100);
      continue;
    }
    const game = await question.getAttribute('data-game');
    const answer = (await question.getAttribute('data-answer')) ?? '';
    if ((await question.getAttribute('data-guided')) === 'true') {
      // Exemple guidé : seule la bonne réponse réagit.
      await answerCurrent(page);
      await expect.poll(() => handle.evaluate((el) => el.isConnected).catch(() => false), { timeout: 20_000 }).toBe(false);
      continue;
    }
    if (game === 'syllable-drum') {
      const wrong = answer === '1' ? 2 : 1;
      const drum = question.locator('[data-choice="drum"]');
      for (let i = 0; i < wrong; i += 1) {
        await drum.click();
        await page.waitForTimeout(170);
      }
      await question.locator('[data-choice="drum-ok"]').click();
      await page.waitForTimeout(300);
      continue;
    }
    const wrong = question.locator(`[data-choice]:not([data-choice="${answer}"]):not([aria-disabled="true"])`).first();
    if ((await wrong.count()) === 0) {
      // Plus de choix faux sur cette question : on trouve la bonne réponse (la pause exige la réussite), puis la suivante.
      await question.locator(`[data-choice="${answer}"]`).click();
      await expect.poll(() => handle.evaluate((el) => el.isConnected).catch(() => false), { timeout: 20_000 }).toBe(false);
      continue;
    }
    await wrong.click();
    await page.waitForTimeout(300);
  }
}

// ==================== Les tests ====================

test.describe('pauses de révision', () => {
  test.slow();

  test("30 s admin : la pause se pose à la fin d'une manche, 2 à 3 questions, le jeu reprend, réponses marquées", async ({ page }) => {
    test.setTimeout(240_000);
    await installFakeVoice(page, 'fr');
    await onboard(page, 'Chloé', { startStage: 3 });

    // Option admin « Pauses toutes les 30 s (test) » : 7 tapes sur le nom de l'app, dans Réglages.
    await openParentFromProfiles(page);
    await page.getByTestId('tab-settings').click();
    const name = page.getByTestId('app-name');
    for (let i = 0; i < 7; i += 1) await name.click();
    await expect(page.getByTestId('admin-section')).toBeVisible();
    await expect(page.getByTestId('admin-pause-block')).toBeVisible();
    await page.getByTestId('toggle-admin-pause-test').click();
    await expect(page.getByTestId('toggle-admin-pause-test')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('back-to-game').click();

    await chooseProfile(page, 'Chloé');
    await openMemory(page);
    await startMemory(page);
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');

    // On joue des manches jusqu'à ce que 30 s de temps actif soient comptées : la pause arrive APRÈS une manche résolue.
    let solved = 0;
    const deadline = Date.now() + 120_000;
    while ((await pauseOverlay(page).count()) === 0 && Date.now() < deadline) {
      await solveMemoryRound(page);
      solved += 1;
      await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', String(solved));
      await page.waitForTimeout(1500);
    }
    await expect(pauseOverlay(page)).toBeVisible();
    // Le jeu reste monté dessous, avec son état : la manche résolue est comptée, on n'a rien perdu.
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', String(solved));

    const games = await answerPause(page);
    expect(games.length).toBeGreaterThanOrEqual(2);
    await expect(pauseOverlay(page)).toHaveCount(0, { timeout: 15_000 });

    // Retour au jeu exactement là où il en était : même partie, même compteur, une nouvelle manche démarre.
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', String(solved));
    await expect(page.locator('.puzzle-stage .play-round')).toBeVisible();
    expect(await spokenTexts(page)).toContain("C'est l'heure de lire !");

    // Enregistrement : une séance marquée « pause », sans niveau, une seule réponse « retention » (graphème maîtrisé).
    const pauses = await pauseRecords(page);
    expect(pauses).toHaveLength(1);
    const [record] = pauses;
    expect(record?.levelId).toBeUndefined();
    expect(record?.status).toBe('completed');
    expect(record?.hard).toBeUndefined();
    const retention = record?.answers.filter((a) => a.retention === true) ?? [];
    expect(retention).toHaveLength(1);
    expect(['g:a', 'g:i', 'g:o', 'g:u', 'g:é']).toContain(retention[0]?.itemId);
    expect(record?.answers.some((a) => a.retry)).toBe(false);
    // Le temps de la pause est imputé à la lecture, pas au mini-jeu.
    const usage = await readUsage(page);
    expect(usage.reduce((sum, u) => sum + (u.activitySeconds?.reading ?? 0), 0)).toBeGreaterThan(0);

    // Le compteur est reparti de zéro : pas de nouvelle pause avant 30 s de jeu.
    await solveMemoryRound(page);
    await page.waitForTimeout(1500);
    await expect(pauseOverlay(page)).toHaveCount(0);
    await backToHub(page);
  });

  test('3 échecs : la pause se termine en douceur, le jeu continue, signal « pause difficile » chez le parent', async ({ page }) => {
    await installFakeVoice(page, 'fr');
    await onboard(page, 'Chloé', { startStage: 3 });
    await chooseProfile(page, 'Chloé');
    await seedPauseCounter(page, 99 * 60_000);
    await openMemory(page);
    await startMemory(page);

    await expect(pauseOverlay(page)).toBeVisible();
    await failPause(page);
    await expect(pauseOverlay(page)).toHaveCount(0, { timeout: 15_000 });

    // Le jeu reprend (jamais coupé) et la session n'est pas punie.
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
    await expect(page.locator('.puzzle-stage .play-round')).toBeVisible();

    const [record] = await pauseRecords(page);
    expect(record?.hard).toBe(true);
    expect(record?.status).toBe('completed');
    expect(record?.answers.filter((a) => a.retention === true).length).toBeLessThanOrEqual(1);
    expect(record?.answers.some((a) => !a.correct)).toBe(true);

    // Parent : le signal apparaît dans les statistiques, avec l'heure.
    await backToHub(page);
    await page.getByTestId('hub-to-profiles').click();
    await openParentDashboard(page);
    await page.getByRole('button', { name: 'Statistiques' }).click();
    const block = page.getByTestId('reading-stats-pauses');
    await expect(block).toBeVisible();
    await expect(block.getByTestId('reading-stats-pause-hard')).toBeVisible();
    await expect(block.getByTestId('reading-stats-pause-hard-item')).toHaveCount(1);
    await expect(block.getByTestId('reading-stats-pauses-done')).toHaveText('1');
  });

  test('interrupteur éteint dans la fiche enfant : jamais de pause', async ({ page }) => {
    await installFakeVoice(page, 'fr');
    await onboard(page, 'Chloé', { startStage: 3, pausesOff: true });
    await chooseProfile(page, 'Chloé');
    await seedPauseCounter(page, 99 * 60_000);
    await openMemory(page);
    await startMemory(page);
    await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
    await solveMemoryRound(page);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
    await page.waitForTimeout(2500);
    await expect(pauseOverlay(page)).toHaveCount(0);
    await expect(page.locator('.puzzle-stage .play-round')).toBeVisible();
    expect(await pauseRecords(page)).toHaveLength(0);
  });

  for (const mode of ['absent', 'en'] as VoiceMode[]) {
    test(`voix ${mode === 'absent' ? 'absente' : 'non française'} : pas de pause, le mini-jeu n'est jamais bloqué`, async ({ page }) => {
      await installFakeVoice(page, mode);
      await onboard(page, 'Chloé', { startStage: 3 });
      await chooseProfile(page, 'Chloé');
      await seedPauseCounter(page, 99 * 60_000);
      await openMemory(page);
      await startMemory(page);
      await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
      await solveMemoryRound(page);
      await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
      await page.waitForTimeout(2500);
      await expect(pauseOverlay(page)).toHaveCount(0);
      await expect(page.locator('.puzzle-stage .play-round')).toBeVisible();
      expect(await pauseRecords(page)).toHaveLength(0);
    });
  }

  test("rien d'acquis : pause d'écoute, jamais d'aventure ; l'aventure ne la compte pas", async ({ page }) => {
    await installFakeVoice(page, 'fr');
    await onboard(page, 'Élodie');
    await chooseProfile(page, 'Élodie');
    await seedPauseCounter(page, 99 * 60_000);
    await openMemory(page);
    await startMemory(page);
    await expect(pauseOverlay(page)).toBeVisible();
    const games = await answerPause(page);
    expect(games.length).toBeGreaterThanOrEqual(2);
    await expect(pauseOverlay(page)).toHaveCount(0, { timeout: 15_000 });

    const [record] = await pauseRecords(page);
    expect(record?.answers.some((a) => a.retention === true)).toBe(false);
    // Pas de lettre non présentée : seulement des jeux d'écoute et la lettre du prénom (E, Élodie).
    for (const a of record?.answers ?? []) {
      expect(['syllable-drum', 'same-start', 'same-end', 'name-letter']).toContain(a.game);
    }
    // L'aventure n'a pas bougé : la carte ouvre toujours son premier niveau, aucun niveau gagné.
    await backToHub(page);
    await page.getByTestId('hub-tile-map').click();
    await expect(page.getByTestId('adventure-map')).toBeVisible();
    await expect(page.locator('[data-testid^="reading-level-"][data-state="done"]')).toHaveCount(0);
  });
});

/** Depuis le hub ou les profils : l'espace parent par appui long. */
async function openParentFromProfiles(page: Page): Promise<void> {
  if (await page.getByTestId('hub').isVisible().catch(() => false)) await page.getByTestId('hub-to-profiles').click();
  await openParentDashboard(page);
}
