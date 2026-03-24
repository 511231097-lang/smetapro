import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

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
