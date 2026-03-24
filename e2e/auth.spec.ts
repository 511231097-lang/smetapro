import { expect, test } from '@playwright/test';
import { mockUser, mockWorkspace, setupApiMock } from './testUtils';

const projectsPath = `/${mockWorkspace.id}/projects`;
const logoutPath = `/${mockWorkspace.id}/logout`;

test('unauthorized user is redirected to /login from workspace projects', async ({
  page,
}) => {
  await setupApiMock(page, {
    refresh: { status: 401 },
    workspaces: [mockWorkspace],
  });
  await page.goto(projectsPath);
  await expect(
    page.getByRole('heading', { name: 'Вход в Сметчик ПРО' }),
  ).toBeVisible();
});

test('refresh restores session and opens projects', async ({ page }) => {
  await setupApiMock(page, {
    refresh: { status: 200, user: mockUser },
    workspaces: [mockWorkspace],
  });
  const refreshRequest = page.waitForRequest('**/api/v1/auth/refresh');

  await page.goto(projectsPath);
  await refreshRequest;

  await expect(page).toHaveURL(new RegExp(`${mockWorkspace.id}/projects$`));
  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
});

test('login succeeds and redirects to first workspace projects', async ({
  page,
}) => {
  await setupApiMock(page, {
    refresh: { status: 401 },
    workspaces: [mockWorkspace],
  });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ivan@example.com');
  await page.getByLabel('Пароль').fill('secret123');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL(new RegExp(`${mockWorkspace.id}/projects$`));
  await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
});

test('login shows error on invalid credentials', async ({ page }) => {
  await setupApiMock(page, {
    login: { status: 401, error: 'Неверный e-mail или пароль' },
    refresh: { status: 401 },
    workspaces: [mockWorkspace],
  });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ivan@example.com');
  await page.getByLabel('Пароль').fill('wrong-pass');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByText('Неверный e-mail или пароль')).toBeVisible();
});

test('register switches to e-mail verification step', async ({ page }) => {
  await setupApiMock(page, {
    refresh: { status: 401 },
    register: { status: 201, user: mockUser },
  });
  await page.goto('/register');
  await page.getByLabel('Телефон').fill('79001234567');
  await page.getByLabel('E-mail').fill('ivan@example.com');
  await page.getByLabel('Пароль').fill('secret123');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

  await expect(
    page.getByRole('heading', { name: 'Подтверждение e-mail' }),
  ).toBeVisible();
});

test('logout route redirects to /login', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    refresh: { status: 401 },
    workspaces: [mockWorkspace],
  });
  await page.goto(logoutPath);
  await expect(
    page.getByRole('heading', { name: 'Вход в Сметчик ПРО' }),
  ).toBeVisible();
});
