import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

const PAGE_SIZE = 8;

test('projects list renders cards', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
    projectsByWorkspace: {
      [mockWorkspace.id]: [
        {
          id: 'project-1',
          workspace_id: mockWorkspace.id,
          status_id: 2,
          name: 'Проект Alpha',
          address: 'Улица 1',
          comment: 'Комментарий',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'project-2',
          workspace_id: mockWorkspace.id,
          status_id: 2,
          name: 'Проект Beta',
          address: null,
          comment: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  });

  await page.goto('/projects');
  await expect(page.getByText('Проект Alpha')).toBeVisible();
  await expect(page.getByText('Проект Beta')).toBeVisible();
});

test('projects pagination works', async ({ page }) => {
  const projects = Array.from({ length: PAGE_SIZE + 1 }, (_, index) => ({
    id: `project-${index + 1}`,
    workspace_id: mockWorkspace.id,
    status_id: 2,
    name: `Проект ${index + 1}`,
    address: null,
    comment: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }));

  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
    projectsByWorkspace: {
      [mockWorkspace.id]: projects,
    },
  });

  await page.goto('/projects');
  await expect(page.getByText('Проект 1')).toBeVisible();
  await expect(page.getByText(`Проект ${PAGE_SIZE + 1}`)).toHaveCount(0);
  await page.getByRole('button', { name: '2' }).click();
  await expect(page.getByText(`Проект ${PAGE_SIZE + 1}`)).toBeVisible();
});

test('project creation redirects and shows in list', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
    projectsByWorkspace: {
      [mockWorkspace.id]: [],
    },
  });

  await page.goto('/projects/new');
  await page.getByLabel('Название').fill('Новый проект');
  await page.getByLabel('Адрес').fill('Улица 2');
  await page.getByLabel('Комментарий').fill('Заметка');
  await page.getByRole('button', { name: 'Создать проект' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('p', { hasText: 'Новый проект' })).toBeVisible();
});

test('project editing updates list', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
    projectsByWorkspace: {
      [mockWorkspace.id]: [
        {
          id: 'project-edit',
          workspace_id: mockWorkspace.id,
          status_id: 2,
          name: 'Старое название',
          address: 'Адрес',
          comment: 'Комментарий',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  });

  await page.goto('/projects/project-edit');
  await page.getByLabel('Название').fill('Новое название');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText('Новое название')).toBeVisible();
});

test('project deletion removes item from list', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
    projectsByWorkspace: {
      [mockWorkspace.id]: [
        {
          id: 'project-delete',
          workspace_id: mockWorkspace.id,
          status_id: 2,
          name: 'Удаляемый проект',
          address: null,
          comment: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  });

  page.on('dialog', (dialog) => dialog.accept());
  const projectListResponse = page.waitForResponse((response) => {
    return (
      response
        .url()
        .includes(`/api/v1/workspaces/${mockWorkspace.id}/projects`) &&
      response.request().method() === 'GET'
    );
  });
  await page.goto('/projects/project-delete');
  await page.getByRole('button', { name: 'Удалить проект' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await projectListResponse;
  await expect(page.getByText('Удаляемый проект')).toHaveCount(0);
});
