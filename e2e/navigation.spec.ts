import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

test('finances page renders placeholder content', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/finances`);

  await expect(page.getByRole('heading', { name: 'Финансы' })).toBeVisible();
  await expect(
    page.getByText('Финансовая информация появится здесь.'),
  ).toBeVisible();
});

test('references page renders counterparties directory', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/references`);

  await expect(
    page.getByRole('heading', { name: 'Справочники' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Контрагенты' })).toBeVisible();
  await expect(page.getByText('Контрагенты пока не добавлены.')).toBeVisible();
});
