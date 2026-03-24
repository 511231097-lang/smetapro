import { expect, test } from '@playwright/test';
import {
  mockAdminUser,
  mockUser,
  mockWorkspace,
  setupApiMock,
} from './testUtils';

test('non-admin cannot access admin and menu is hidden', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    workspaces: [mockWorkspace],
  });
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('link', { name: 'Админка' })).toHaveCount(0);
});

test('admin sees admin menu entry', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockAdminUser,
    workspaces: [mockWorkspace],
  });
  await page.goto('/projects');
  await expect(page.getByRole('link', { name: 'Админка' })).toBeVisible();
  await page.getByRole('link', { name: 'Админка' }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(
    page.getByRole('heading', { name: 'Пользователи' }),
  ).toBeVisible();
});

test('admin users list supports pagination and search', async ({ page }) => {
  const adminUsers = Array.from({ length: 21 }, (_, index) => ({
    id: `admin-user-${index + 1}`,
    phone: `790000000${index + 1}`,
    email: `user${index + 1}@example.com`,
    name: `User ${index + 1}`,
    surname: `Surname ${index + 1}`,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }));

  await setupApiMock(page, {
    initialUser: mockAdminUser,
    workspaces: [mockWorkspace],
    adminUsers,
  });

  await page.goto('/admin/users');
  await expect(
    page.getByRole('cell', { name: 'User 1', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'User 21', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '2' }).click();
  await expect(
    page.getByRole('cell', { name: 'User 21', exact: true }),
  ).toBeVisible();

  await page
    .getByPlaceholder('Поиск по телефону, имени или фамилии')
    .fill('User 3');
  await expect(
    page.getByRole('cell', { name: 'User 3', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'User 21', exact: true }),
  ).toHaveCount(0);
});

test('admin can edit and delete user', async ({ page }) => {
  const adminUsers = [
    {
      id: 'user-edit',
      phone: '79001230000',
      email: 'old@example.com',
      name: 'Старое имя',
      surname: 'Старое',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'user-keep',
      phone: '79005554433',
      email: 'keep@example.com',
      name: 'Оставшийся',
      surname: 'Пользователь',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  await setupApiMock(page, {
    initialUser: mockAdminUser,
    workspaces: [mockWorkspace],
    adminUsers,
  });

  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/admin/users/user-edit');
  await page.getByLabel('Имя').fill('Новое имя');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByLabel('Имя')).toHaveValue('Новое имя');
  await page.getByRole('button', { name: 'Удалить пользователя' }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(page.getByText('Новое имя')).toHaveCount(0);
  await expect(page.getByText('Оставшийся')).toBeVisible();
});

test('admin workspaces list supports pagination and search', async ({
  page,
}) => {
  const adminWorkspaces = Array.from({ length: 21 }, (_, index) => ({
    id: `admin-ws-${index + 1}`,
    name: `Пространство ${index + 1}`,
    created_by: mockAdminUser.id,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }));

  await setupApiMock(page, {
    initialUser: mockAdminUser,
    workspaces: [mockWorkspace],
    adminWorkspaces,
  });

  await page.goto('/admin/workspaces');
  await expect(
    page.getByRole('link', { name: 'Пространство 1', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Пространство 21', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '2' }).click();
  await expect(
    page.getByRole('link', { name: 'Пространство 21', exact: true }),
  ).toBeVisible();

  await page.getByPlaceholder('Поиск по названию').fill('Пространство 3');
  await expect(
    page.getByRole('link', { name: 'Пространство 3', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Пространство 21', exact: true }),
  ).toHaveCount(0);
});

test('admin can edit and delete workspace', async ({ page }) => {
  const adminWorkspaces = [
    {
      id: 'ws-edit',
      name: 'Старое пространство',
      created_by: mockAdminUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'ws-keep',
      name: 'Оставшееся пространство',
      created_by: mockAdminUser.id,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  await setupApiMock(page, {
    initialUser: mockAdminUser,
    workspaces: [mockWorkspace],
    adminWorkspaces,
  });

  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/admin/workspaces/ws-edit');
  await page.getByLabel('Название').fill('Новое пространство');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByLabel('Название')).toHaveValue('Новое пространство');
  await page.getByRole('button', { name: 'Удалить пространство' }).click();
  await expect(page).toHaveURL(/\/admin\/workspaces$/);
  await expect(page.getByText('Новое пространство')).toHaveCount(0);
  await expect(page.getByText('Оставшееся пространство')).toBeVisible();
});
