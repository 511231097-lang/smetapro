import { expect, test } from '@playwright/test';
import { mockUser, setupApiMock } from './testUtils';

const invitedWorkspaceId = 'invited-ws-1';
const inviteToken = 'invite-token-123';

test('invite preview page shows workspace info', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    invitePreviewByToken: {
      [inviteToken]: {
        expires_at: '2035-01-01T00:00:00.000Z',
        member_count: 4,
        role: {
          code: 'member',
          id: 2,
          name: 'Участник',
        },
        workspace_description: 'Команда тестирования',
        workspace_name: 'Команда QA',
      },
    },
    workspaces: [
      {
        id: invitedWorkspaceId,
        name: 'Команда QA',
        created_at: '2024-01-01T00:00:00.000Z',
        created_by: mockUser.id,
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
  });

  await page.goto(`/invite/${inviteToken}`);

  await expect(page.getByRole('heading', { name: 'Команда QA' })).toBeVisible();
  await expect(page.getByText('Команда тестирования')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Вступить в пространство' }),
  ).toBeVisible();
});

test('accept invite redirects to workspace settings', async ({ page }) => {
  await setupApiMock(page, {
    initialUser: mockUser,
    inviteAcceptByToken: {
      [inviteToken]: {
        status: 200,
        workspaceId: invitedWorkspaceId,
      },
    },
    invitePreviewByToken: {
      [inviteToken]: {
        expires_at: '2035-01-01T00:00:00.000Z',
        member_count: 1,
        workspace_name: 'Команда QA',
      },
    },
    workspaces: [
      {
        id: invitedWorkspaceId,
        name: 'Команда QA',
        created_at: '2024-01-01T00:00:00.000Z',
        created_by: mockUser.id,
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
  });

  await page.goto(`/invite/${inviteToken}`);
  await page.getByRole('button', { name: 'Вступить в пространство' }).click();

  await expect(page).toHaveURL(/\/invited-ws-1\/workspace\/general$/, {
    timeout: 7000,
  });
  await expect(
    page.getByRole('heading', { name: 'Настройки пространства' }),
  ).toBeVisible();
});
