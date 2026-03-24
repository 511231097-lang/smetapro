import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

test('projects page renders heading and placeholder text', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });

  await page.goto(`/${mockWorkspace.id}/projects`);

  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
  await expect(
    page.getByText('Информация о проектах появится здесь.'),
  ).toBeVisible();
});
