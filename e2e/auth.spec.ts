import { expect, test } from "@playwright/test";
import { mockUser, setupApiMock } from "./testUtils";

test("unauthorized user is redirected to /login from /projects", async ({
  page,
}) => {
  await setupApiMock(page, { refresh: { status: 401 } });
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "Вход в Сметчик ПРО" }),
  ).toBeVisible();
});

test("refresh restores session and opens projects", async ({ page }) => {
  await setupApiMock(page, { refresh: { status: 200, user: mockUser } });
  const refreshRequest = page.waitForRequest("**/api/v1/auth/refresh");
  await page.goto("/projects");
  await refreshRequest;
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
});

test("authorized user cannot open /login", async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
});

test("authorized user cannot open /register", async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser });
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
});

test("login succeeds and opens projects", async ({ page }) => {
  await setupApiMock(page, { refresh: { status: 401 } });
  await page.goto("/login");
  await page.getByLabel("Телефон").fill("79001234567");
  await page.getByLabel("Пароль").fill("secret123");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
});

test("login shows error on invalid credentials", async ({ page }) => {
  await setupApiMock(page, {
    login: { status: 401, error: "Неверный телефон или пароль" },
    refresh: { status: 401 },
  });
  await page.goto("/login");
  await page.getByLabel("Телефон").fill("79001234567");
  await page.getByLabel("Пароль").fill("wrong-pass");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Неверный телефон или пароль")).toBeVisible();
});

test("register succeeds and opens projects", async ({ page }) => {
  await setupApiMock(page, { refresh: { status: 401 } });
  await page.goto("/register");
  await page.getByLabel("Телефон").fill("79001234567");
  await page.getByLabel("Имя").fill("Иван");
  await page.getByLabel("Фамилия").fill("Петров");
  await page.getByLabel("Email").fill("ivan@example.com");
  await page.getByLabel("Пароль").fill("secret123");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
});

test("register shows error when user already exists", async ({ page }) => {
  await setupApiMock(page, {
    register: { status: 409, error: "Пользователь уже существует" },
    refresh: { status: 401 },
  });
  await page.goto("/register");
  await page.getByLabel("Телефон").fill("79001234567");
  await page.getByLabel("Имя").fill("Иван");
  await page.getByLabel("Пароль").fill("secret123");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page.getByText("Пользователь уже существует")).toBeVisible();
});

test("logout redirects to /login", async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, refresh: { status: 401 } });
  await page.goto("/logout");
  await expect(
    page.getByRole("heading", { name: "Вход в Сметчик ПРО" }),
  ).toBeVisible();
});

test("logout via UI redirects to /login", async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser, refresh: { status: 401 } });
  await page.goto("/projects");
  await page.getByLabel("Открыть профиль").click();
  await page.getByRole("menuitem", { name: "Выйти" }).click();
  await expect(
    page.getByRole("heading", { name: "Вход в Сметчик ПРО" }),
  ).toBeVisible();
});
