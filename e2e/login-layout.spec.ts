import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { setupApiMock } from './testUtils';

const TOLERANCE_PX = 4;

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

test.describe('login page layout', () => {
  test('375x812: hero hidden and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    await expect(page.getByTestId('login-hero')).toBeHidden();
    await expect(page.getByTestId('login-form-card')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('900x812: hero hidden and form keeps mobile width rule', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 812 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    await expect(page.getByTestId('login-hero')).toBeHidden();
    const form = await getRect(page, 'login-form-card');
    expectNear(form.width, 528, 'form width');
  });

  test('1440x1024: hero is visible and stays to the right of form', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    const form = await getRect(page, 'login-form-card');
    const hero = await getRect(page, 'login-hero');

    expectNear(form.width, 528, 'form width');
    expectNear(hero.width, 571, 'hero width');
    expect(hero.x).toBeGreaterThan(form.x + form.width);
  });

  test('1920x1365: hero remains visible and page has no horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1365 });
    await setupApiMock(page, { refresh: { status: 401 } });
    await page.goto('/login');

    const form = await getRect(page, 'login-form-card');
    const hero = await getRect(page, 'login-hero');

    expectNear(form.width, 528, 'form width');
    expectNear(hero.width, 571, 'hero width');
    expect(hero.x).toBeGreaterThan(form.x + form.width);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
