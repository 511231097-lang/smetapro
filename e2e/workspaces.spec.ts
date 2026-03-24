import { expect, test } from '@playwright/test';
import { mockUser, setupApiMock } from './testUtils';

test('empty workspaces redirect to /workspaces/create', async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, workspaces: [] });
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/workspaces\/create$/);
});

test('workspace creation redirects to projects', async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, workspaces: [] });
  await page.goto('/workspaces/create');
  await page.getByLabel('Название').fill('Новая команда');
  await page.getByRole('button', { name: 'Создать пространство' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
});

test('creating workspace makes it active and shows in header list', async ({
  page,
}) => {
  const existingWorkspaces = [
    {
      id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      name: 'Старый офис',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      name: 'Проект X',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: existingWorkspaces,
  });
  await page.goto('/workspaces/create');
  await page.getByLabel('Название').fill('Новый воркспейс');
  await page.getByRole('button', { name: 'Создать пространство' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('p', { hasText: 'Новый воркспейс' })).toBeVisible();
  await page.getByLabel('Settings').click();
  await expect(
    page.getByRole('menuitem', { name: 'Новый воркспейс' }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Старый офис' }),
  ).toBeVisible();
});

test('invalid stored workspace id selects first workspace', async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    ['active_workspace_id', 'invalid-workspace-id'],
  );
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [
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
    ],
  });
  await page.goto('/projects');
  await expect(page.getByText('Первый воркспейс')).toBeVisible();
});

test('register then create workspace redirects to projects', async ({
  page,
}) => {
  await setupApiMock(page, { workspaces: [], refresh: { status: 401 } });
  await page.goto('/register');
  await page.getByLabel('Телефон').fill('79001234567');
  await page.getByLabel('Имя').fill('Иван');
  await page.getByLabel('Пароль').fill('secret123');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(
    page.getByRole('heading', { name: 'Создание пространства' }),
  ).toBeVisible();
  await page.getByLabel('Название').fill('Команда');
  await page.getByRole('button', { name: 'Создать пространство' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
});

test('workspace editing updates header name', async ({ page }) => {
  const workspace = {
    id: 'ws-edit',
    name: 'Старое название',
    created_by: mockUser.id,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };
  await setupApiMock(page, { initialUser: mockUser, workspaces: [workspace] });
  await page.goto(`/workspace/${workspace.id}/profile`);
  await page.getByLabel('Название').fill('Новое название');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(
    page.getByRole('link', { name: 'Новое название' }),
  ).toBeVisible();
});

test('workspace deletion redirects to projects and switches active', async ({
  page,
}) => {
  const workspaces = [
    {
      id: 'ws-delete',
      name: 'Удаляемое пространство',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'ws-keep',
      name: 'Оставшееся пространство',
      created_by: mockUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];
  await setupApiMock(page, { initialUser: mockUser, workspaces });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/workspace/ws-delete/profile');
  await page.getByRole('button', { name: 'Удалить пространство' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole('link', { name: 'Оставшееся пространство' }),
  ).toBeVisible();
});

test('refresh fails for business request and redirects to /login', async ({
  page,
}) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspacesStatus: 401,
    refresh: { status: 401 },
  });
  const refreshRequest = page.waitForRequest('**/api/v1/auth/refresh');
  await page.goto('/projects');
  await refreshRequest;
  await expect(
    page.getByRole('heading', { name: 'Вход в Сметчик ПРО' }),
  ).toBeVisible();
});
