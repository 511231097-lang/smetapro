import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

test('profile index redirects to common tab', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/profile`);
  await expect(page).toHaveURL(
    new RegExp(`${mockWorkspace.id}/profile/common$`),
  );
});

test('profile common page pre-fills e-mail and phone', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/profile/common`);

  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
  await expect(page.getByLabel('Почта')).toHaveValue(mockUser.email);
  await expect(page.getByLabel('Телефон')).toHaveValue(mockUser.phone);
});

test('profile appearance page renders theme controls', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/profile/appearance`);

  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Оформление' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Светлая тема' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Темная тема' })).toBeVisible();
});
