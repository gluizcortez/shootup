import { expect, test } from '@playwright/test';

test('carrega, inicia uma run, atira, pausa e reinicia sem erros', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  const frame = page.locator('.stage-frame');
  await expect(frame).toHaveAttribute('data-phase', 'MENU');
  await expect(page.locator('canvas')).toBeVisible();

  await page.getByTestId('play').click();
  await expect(frame).toHaveAttribute('data-phase', 'PLAYING');

  // Mira à direita, anda, pula e atira segurando o botão.
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas sem bounding box');
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.75);
  await page.keyboard.down('d');
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  await page.keyboard.up('d');
  await page.mouse.up();

  // A primeira onda começa e o HUD mostra o número dela.
  await expect(page.getByTestId('hud-wave')).toHaveText('1', { timeout: 30_000 });

  await page.keyboard.press('Escape');
  await expect(frame).toHaveAttribute('data-phase', 'PAUSED');
  await page.getByRole('button', { name: 'CONTINUAR' }).click();
  await expect(frame).toHaveAttribute('data-phase', 'PLAYING');

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'REINICIAR' }).click();
  await expect(frame).toHaveAttribute('data-phase', 'PLAYING');

  expect(errors).toEqual([]);
});

test('arte e HUD renderizam no canvas (screenshot para inspeção)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('play').click();
  await page.mouse.move(900, 300);
  await expect(page.getByTestId('hud-wave')).toHaveText('1', { timeout: 30_000 });
  await page.screenshot({ path: 'test-results/gameplay.png' });
});

test('menu: placar local abre e volta', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'shootup.scores.v1',
      JSON.stringify([{ name: 'DON', score: 4200, wave: 6, kills: 40, bestCombo: 12, timeSeconds: 300, date: '2026-10-01T00:00:00Z' }]),
    ),
  );
  await page.reload();
  await page.getByTestId('menu-scores').click();
  await expect(page.getByTestId('scores')).toContainText('DON');
  await page.getByRole('button', { name: 'VOLTAR' }).click();
  await expect(page.getByTestId('play')).toBeVisible();
});
