// Mode test (bac à sable admin) : base séparée, onboarding rejoué, vraies données intactes.
import { test, expect, type Page } from '@playwright/test';
import { chooseProfile, profileCard } from './nav';
import { createPin, onboardMs, openParentDashboard, passVoiceAndHandoff, skipDemo } from './reading-helpers';

async function longPressBadge(page: Page): Promise<void> {
  const box = await page.getByTestId('sandbox-badge').boundingBox();
  if (!box) throw new Error('Badge introuvable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1700);
  await page.mouse.up();
}

async function readProfiles(page: Page, dbName: string): Promise<{ name: string }[]> {
  return page.evaluate(
    (name) =>
      new Promise<{ name: string }[]>((resolve, reject) => {
        const open = indexedDB.open(name);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('profiles', 'readonly').objectStore('profiles').getAll();
          req.onsuccess = () => {
            resolve(req.result as { name: string }[]);
            db.close();
          };
          req.onerror = () => reject(req.error);
        };
      }),
    dbName,
  );
}

/** Premier lancement dans le bac à sable : démo passée, code 1234, un enfant, voix, passage du téléphone, profils. */
async function onboardSandbox(page: Page, name: string): Promise<void> {
  await skipDemo(page);
  await createPin(page);
  await page.locator('input[name=name]').fill(name);
  await page.getByTestId('save-child').click();
  await passVoiceAndHandoff(page);
  await page.getByTestId('hub-to-profiles').click();
}

test('mode test : base séparée, recommencer, quitter, vraies données intactes', async ({ page }) => {
  await onboardMs(page, 'Alice');
  await expect(page.getByTestId('sandbox-badge')).toHaveCount(0);

  await openParentDashboard(page);
  await page.getByTestId('tab-settings').click();
  const name = page.getByTestId('app-name');
  for (let i = 0; i < 7; i += 1) await name.click();
  await expect(page.getByTestId('sandbox-block')).toBeVisible();
  await page.getByTestId('sandbox-enter').click();

  // Bac à sable vide : premier lancement, badge visible.
  await expect(page.getByTestId('onboarding-demo')).toBeVisible();
  await expect(page.getByTestId('sandbox-badge')).toBeVisible();
  await onboardSandbox(page, 'Test');
  await expect(profileCard(page, 'Test')).toBeVisible();
  await expect(profileCard(page, 'Alice')).toHaveCount(0);

  // Le drapeau survit à un rechargement.
  await page.reload();
  await expect(profileCard(page, 'Test')).toBeVisible();
  await expect(page.getByTestId('sandbox-badge')).toBeVisible();

  // Appui long : Recommencer efface le bac à sable.
  await longPressBadge(page);
  await expect(page.getByTestId('sandbox-overlay')).toBeVisible();
  await page.getByTestId('sandbox-reset').click();
  await expect(page.getByTestId('onboarding-demo')).toBeVisible();
  await expect(page.getByTestId('sandbox-badge')).toBeVisible();
  await expect(page.getByText('Test', { exact: true })).toHaveCount(0);

  // Quitter : vraies données, plus de badge.
  await longPressBadge(page);
  await page.getByTestId('sandbox-leave').click();
  await expect(profileCard(page, 'Alice')).toBeVisible();
  await expect(page.getByTestId('sandbox-badge')).toHaveCount(0);
  await chooseProfile(page, 'Alice');

  const real = await readProfiles(page, 'petits-lecteurs');
  expect(real.map((p) => p.name)).toEqual(['Alice']);
});
