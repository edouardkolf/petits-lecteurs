// Robot à programmer, jeu libre du hub (docs/specs/JEUX-LOGIQUE.md) : pas à pas (★) et programme (★★).
// Aides de navigation communes : tests/e2e/nav.ts.
//
// La vue expose la manche courante en DOM : `.robot-view[data-size|data-start|data-goal|data-rocks]` (le trajet est
// calculé par BFS ici).
import { test, expect, type Locator, type Page } from '@playwright/test';
import { backToHub, chooseProfile } from './nav';

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
  await page.goto('/');
  await page.getByText('Commencer : espace parent').click();
  await expect(page.getByText('Créer le code parent')).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByText('Confirme le code')).toBeVisible();
  await enterPin(page, PARENT_PIN);
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByTestId('add-child').click();
  await page.locator('input[name=name]').fill(name);
  await page.locator('select[name=sessionMinutes]').selectOption('');
  await page.locator('select[name=dailyMinutes]').selectOption('');
  await page.getByTestId('save-child').click();
  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByTestId('back-to-game').click();
  await expect(page.getByText('Commencer : espace parent')).toHaveCount(0);
}

// ---------- Aides : résolution d'une manche, par mécanique ----------

const round = (page: Page): Locator => page.locator('.play-round[data-answer]');

async function answerOf(page: Page): Promise<string> {
  const answer = await round(page).getAttribute('data-answer');
  if (!answer) throw new Error('Aucune manche affichée (data-answer introuvable).');
  return answer;
}

type Dir = 'up' | 'down' | 'left' | 'right';
interface Pos {
  x: number;
  y: number;
}
const DELTA: Record<Dir, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const parsePos = (s: string): Pos => {
  const [x, y] = s.split(',').map(Number);
  return { x: x as number, y: y as number };
};

interface RobotBoard {
  size: number;
  start: Pos;
  goal: Pos;
  rocks: Pos[];
  mode: string;
}

async function readRobot(page: Page): Promise<RobotBoard> {
  const view = page.locator('.robot-view');
  await expect(view).toBeVisible();
  const size = Number(await view.getAttribute('data-size'));
  const rocksAttr = (await view.getAttribute('data-rocks')) ?? '';
  return {
    size,
    start: parsePos((await view.getAttribute('data-start')) as string),
    goal: parsePos((await view.getAttribute('data-goal')) as string),
    rocks: rocksAttr === '' ? [] : rocksAttr.split(';').map(parsePos),
    mode: (await view.getAttribute('data-mode')) as string,
  };
}

/** Plus court chemin par BFS (flèches). Les rochers et les bords bloquent. */
function bfsPath(b: RobotBoard): Dir[] {
  const key = (p: Pos) => `${p.x},${p.y}`;
  const blocked = new Set(b.rocks.map(key));
  const prev = new Map<string, { from: Pos; dir: Dir }>();
  const seen = new Set([key(b.start)]);
  const queue: Pos[] = [b.start];
  for (let i = 0; i < queue.length; i += 1) {
    const cur = queue[i] as Pos;
    if (key(cur) === key(b.goal)) break;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const next = { x: cur.x + DELTA[dir].x, y: cur.y + DELTA[dir].y };
      if (next.x < 0 || next.y < 0 || next.x >= b.size || next.y >= b.size) continue;
      if (blocked.has(key(next)) || seen.has(key(next))) continue;
      seen.add(key(next));
      prev.set(key(next), { from: cur, dir });
      queue.push(next);
    }
  }
  if (!seen.has(key(b.goal))) throw new Error('Robot : trésor inatteignable (BFS).');
  const path: Dir[] = [];
  for (let cur = b.goal; key(cur) !== key(b.start); ) {
    const step = prev.get(key(cur)) as { from: Pos; dir: Dir };
    path.push(step.dir);
    cur = step.from;
  }
  return path.reverse();
}

/** Position du robot lue sur son style (translate(x*100px, y*100px)). */
async function robotPos(page: Page): Promise<Pos> {
  const transform = await page.locator('.robot-mover').evaluate((el) => (el as HTMLElement).style.transform);
  const m = /translate\((-?\d+)px,\s*(-?\d+)px\)/.exec(transform);
  if (!m) throw new Error(`Transform du robot illisible : ${transform}`);
  return { x: Number(m[1]) / 100, y: Number(m[2]) / 100 };
}

/** Joue la manche robot affichée : pas à pas (une flèche = un déplacement) ou programme (flèches puis ▶). */
async function solveRobotRound(page: Page): Promise<void> {
  const board = await readRobot(page);
  const path = bfsPath(board);
  for (const dir of path) {
    await page.locator(`[data-choice="arrow-${dir}"]`).click();
    if (board.mode === 'step') await page.waitForTimeout(60);
  }
  if (board.mode === 'program') {
    await expect(page.locator('.robot-slot.is-filled')).toHaveCount(path.length);
    await page.locator('[data-choice="run"]').click();
  }
}

/** Handle du nœud racine de la vue de mécanique : détaché quand la manche suivante arrive. */
async function viewHandle(page: Page) {
  const handle = await page.locator('.puzzle-stage .play-round > *').first().elementHandle();
  if (!handle) throw new Error('Vue de mécanique introuvable.');
  return handle;
}

async function expectNewRound(page: Page, handle: Awaited<ReturnType<typeof viewHandle>>): Promise<void> {
  await expect.poll(() => handle.evaluate((el) => el.isConnected), { timeout: 10_000 }).toBe(false);
  await expect(page.locator('.puzzle-stage .play-round > *').first()).toBeVisible();
}

// ---------- Aides : écran de jeu libre ----------

async function openFreeGame(page: Page, game: string): Promise<void> {
  await page.getByTestId(`hub-tile-${game}`).click();
  await expect(page).toHaveURL(new RegExp(`#/${game}$`));
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'choose');
  await expect(page.getByTestId('puzzle-preset-easy')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('puzzle-preset-medium')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('puzzle-preset-hard')).toHaveAttribute('aria-pressed', 'false');
}

async function startFreeGame(page: Page): Promise<void> {
  await page.getByTestId('puzzle-play').click();
  await expect(page.getByTestId('puzzle')).toHaveAttribute('data-phase', 'play');
  await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '0');
  await expect(round(page)).toBeVisible();
}

// ==================== Robot, jeu libre ====================

test.describe('jeu libre robot', () => {
  test.slow();

  test('robot ★ (pas à pas) : le robot rejoint le trésor, un choc ne le déplace pas, nouvelle manche', async ({ page }) => {
    await onboardWithChild(page, 'Noa');
    await chooseProfile(page, 'Noa');
    await openFreeGame(page, 'robot');
    await startFreeGame(page);

    const board = await readRobot(page);
    expect(board.mode).toBe('step');
    await expect(page.locator('.robot-slot')).toHaveCount(0); // pas de bande de programme en pas à pas
    await expect(page.locator('[data-choice="run"]')).toHaveCount(0);
    expect(await robotPos(page)).toEqual(board.start);

    // Un choc (bord ou rocher) : le robot reste sur place, la manche continue.
    const blockedDir = (Object.keys(DELTA) as Dir[]).find((dir) => {
      const n = { x: board.start.x + DELTA[dir].x, y: board.start.y + DELTA[dir].y };
      return (
        n.x < 0 ||
        n.y < 0 ||
        n.x >= board.size ||
        n.y >= board.size ||
        board.rocks.some((r) => r.x === n.x && r.y === n.y)
      );
    });
    if (blockedDir) {
      await page.locator(`[data-choice="arrow-${blockedDir}"]`).click();
      await page.waitForTimeout(500);
      expect(await robotPos(page)).toEqual(board.start);
      await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '0');
    }

    const handle = await viewHandle(page);
    const path = bfsPath(board);
    for (const dir of path) {
      await page.locator(`[data-choice="arrow-${dir}"]`).click();
      await page.waitForTimeout(60);
    }
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1');
    await expectNewRound(page, handle);
    await backToHub(page);
  });

  test('robot ★★ (programme) : un programme faux échoue sans compter, le bon trajet gagne, nouvelle manche', async ({
    page,
  }) => {
    await onboardWithChild(page, 'Noa');
    await chooseProfile(page, 'Noa');
    await openFreeGame(page, 'robot');
    await page.getByTestId('puzzle-preset-medium').click();
    await expect(page.getByTestId('puzzle-preset-medium')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('puzzle-preset-easy')).toHaveAttribute('aria-pressed', 'false');
    await startFreeGame(page);

    const board = await readRobot(page);
    expect(board.mode).toBe('program');
    const path = bfsPath(board);

    // Programme volontairement faux : une seule flèche (le trajet minimal en demande au moins 4).
    await page.locator(`[data-choice="arrow-${path[0]}"]`).click();
    await expect(page.locator('.robot-slot.is-filled')).toHaveCount(1);
    await page.locator('[data-choice="run"]').click();
    await expect(page.locator('.robot-slot.is-filled')).toHaveCount(1); // le programme reste affiché pour être corrigé
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '0');
    await expect.poll(() => robotPos(page), { timeout: 5000 }).toEqual(board.start); // retour au départ

    // Retirer la flèche (tap sur sa case) une fois le robot revenu et les touches de nouveau actives.
    await expect(page.locator('.robot-btn--run:not(.is-locked)')).toBeVisible();
    await page.locator('[data-choice="slot-0"]').click();
    await expect(page.locator('.robot-slot.is-filled')).toHaveCount(0);
    const handle = await viewHandle(page);
    await solveRobotRound(page);
    await expect(page.getByTestId('puzzle-solved')).toHaveAttribute('data-count', '1', { timeout: 10_000 });
    await expectNewRound(page, handle);
    await backToHub(page);
  });
});
