import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { setupApiMock } from './testUtils';

const TOLERANCE_PX = 2;

const expectNear = (actual: number, expected: number, label: string) => {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}, got ${actual}`,
  ).toBeLessThanOrEqual(TOLERANCE_PX);
};

const getRect = async (page: Page, testId: string) => {
  const locator = page.getByTestId(testId);
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${testId} bounding box is unavailable`).not.toBeNull();
  if (!box) {
    throw new Error(`${testId} bounding box is unavailable`);
  }
  return box;
};

test.describe('login page layout geometry', () => {
  test('375x812: hero hidden, form matches mobile figma geometry', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    await expect(page.getByTestId('login-hero')).toBeHidden();
    const form = await getRect(page, 'login-form-card');

    expectNear(form.width, 351, 'form width');
    expectNear(form.height, 324, 'form height');
    expectNear(form.x, 12, 'form x');
    expectNear(form.y, 244, 'form y');
  });

  test('900x812: hero is hidden and horizontal overflow is absent', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 812 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    await expect(page.getByTestId('login-hero')).toBeHidden();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('1440x1024: form and hero match desktop figma geometry', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    const form = await getRect(page, 'login-form-card');
    const hero = await getRect(page, 'login-hero');

    expectNear(form.width, 400, 'form width');
    expectNear(form.height, 324, 'form height');
    expectNear(hero.width, 571, 'hero width');
    expectNear(hero.height, 1000, 'hero height');

    const gap = hero.x - (form.x + form.width);
    const rightInset = 1440 - (hero.x + hero.width);
    expectNear(gap, 228, 'gap between form and hero');
    expectNear(rightInset, 12, 'hero right inset');
  });

  test('1920x1365: form and hero match fullhd figma geometry', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1365 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    const form = await getRect(page, 'login-form-card');
    const hero = await getRect(page, 'login-hero');

    expectNear(form.width, 400, 'form width');
    expectNear(form.height, 324, 'form height');
    expectNear(hero.width, 756.575, 'hero width');
    expectNear(hero.height, 1325, 'hero height');

    const gap = hero.x - (form.x + form.width);
    const rightInset = 1920 - (hero.x + hero.width);
    expectNear(gap, 371.4, 'gap between form and hero');
    expectNear(rightInset, 20, 'hero right inset');
  });
});
