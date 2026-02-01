import { expect, test } from "@playwright/test";
import { mockUser, setupApiMock } from "./testUtils";

test("profile editing updates user info", async ({ page }) => {
  await setupApiMock(page, { initialUser: mockUser });
  const updateRequest = page.waitForRequest((request) => {
    return (
      request.url().includes(`/api/v1/admin/users/${mockUser.id}`) &&
      request.method() === "PUT"
    );
  });
  await page.goto("/profile/common");
  await page.getByLabel("Имя").fill("Пётр");
  await page.getByLabel("Фамилия").fill("Иванов");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await updateRequest;
  await expect(page.getByLabel("Имя")).toHaveValue("Пётр");
  await expect(page.getByLabel("Фамилия")).toHaveValue("Иванов");
});
