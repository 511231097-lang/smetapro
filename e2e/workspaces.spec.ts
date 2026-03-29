import { expect, test } from '@playwright/test';
import { mockUser, setupApiMock } from './testUtils';

test('empty workspaces redirect to /workspaces/create', async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, workspaces: [] });
  await page.goto('/');
  await expect(page).toHaveURL(/\/workspaces\/create$/);
});

test('workspace creation redirects to workspace projects', async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, workspaces: [] });
  await page.goto('/workspaces/create');
  await page
    .getByPlaceholder('Например: РемГрупп или СтройСила')
    .fill('Новая команда');
  await page.getByRole('button', { name: 'Создать пространство' }).click();

  await expect(page).toHaveURL(
    /\/33333333-3333-4333-8333-333333333333\/projects$/,
  );
  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
});

test('root redirects to first available workspace projects', async ({
  page,
}) => {
  const workspaces = [
    {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      name: 'Первый воркспейс',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      name: 'Второй воркспейс',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces,
  });
  await page.goto('/');

  await expect(page).toHaveURL(
    /\/bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1\/projects$/,
  );
  await expect(page.getByText('Первый воркспейс')).toBeVisible();
});

test('workspace general tab pre-fills workspace name', async ({ page }) => {
  const workspace = {
    id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    name: 'Тестовый офис',
    created_by: mockUser.id,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [workspace],
  });

  await page.goto(`/${workspace.id}/workspace/general`);
  await expect(
    page.getByRole('heading', { name: 'Настройки пространства' }),
  ).toBeVisible();
  await expect(page.getByLabel('Название пространства')).toHaveValue(
    workspace.name,
  );
});

test('workspace roles tab renders role table', async ({ page }) => {
  const workspace = {
    id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    name: 'Роли офис',
    created_by: mockUser.id,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  await setupApiMock(page, {
    initialUser: mockUser,
    rolesByWorkspace: {
      [workspace.id]: [
        {
          code: 'owner',
          description: 'Полный доступ',
          id: 1,
          is_system: true,
          name: 'Владелец',
        },
      ],
    },
    workspaces: [workspace],
  });

  await page.goto(`/${workspace.id}/workspace/roles`);

  await expect(
    page.getByRole('heading', { name: 'Настройки пространства' }),
  ).toBeVisible();
  await expect(page.getByText('Владелец')).toBeVisible();
  await expect(page.getByText('Полный доступ')).toBeVisible();
});

test('workspace members tab shows empty state', async ({ page }) => {
  const workspace = {
    id: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    name: 'Пустой офис',
    created_by: mockUser.id,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  await setupApiMock(page, {
    initialUser: mockUser,
    membersByWorkspace: {
      [workspace.id]: [],
    },
    workspaces: [workspace],
  });

  await page.goto(`/${workspace.id}/workspace/members`);

  await expect(
    page.getByRole('heading', { name: 'Настройки пространства' }),
  ).toBeVisible();
  await expect(page.getByText('Сотрудников пока нет')).toBeVisible();
});
