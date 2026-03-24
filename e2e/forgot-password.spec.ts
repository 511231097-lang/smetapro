import { expect, test } from '@playwright/test';
import { setupApiMock } from './testUtils';

test('forgot password: submit e-mail switches to code step', async ({
  page,
}) => {
  await setupApiMock(page, {
    forgotPassword: { status: 200 },
    refresh: { status: 401 },
  });

  await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('user@example.com');
  await page.getByRole('button', { name: 'Отправить код' }).click();

  await expect(
    page.getByText(
      'На ваш e-mail был отправлен код. Введите его для восстановления пароля.',
    ),
  ).toBeVisible();
});

test('forgot password: API error is shown', async ({ page }) => {
  await setupApiMock(page, {
    forgotPassword: {
      error: 'Пользователь с таким e-mail не найден',
      status: 404,
    },
    refresh: { status: 401 },
  });

  await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('missing@example.com');
  await page.getByRole('button', { name: 'Отправить код' }).click();

  await expect(
    page.getByText('Пользователь с таким e-mail не найден'),
  ).toBeVisible();
});
