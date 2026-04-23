import { describe, expect, test } from '@rstest/core';
import { getWorkspaceMeta } from '../src/layouts/components/protected-shell/WorkspaceMenu';
import type { WorkspacesWorkspaceResponse } from '../src/shared/api/generated/schemas';

describe('WorkspaceMenu', () => {
  test('builds workspace meta with role before members count', () => {
    const activeWorkspace: WorkspacesWorkspaceResponse = {
      id: 'ws-1',
      member_role: {
        code: 'owner',
        id: 1,
        is_system: true,
        name: 'Владелец',
      },
      members_count: 3,
      name: 'Главный офис',
    };

    const secondWorkspace: WorkspacesWorkspaceResponse = {
      id: 'ws-2',
      member_role: {
        code: 'manager',
        id: 2,
        is_system: false,
        name: 'Менеджер',
      },
      members_count: 12,
      name: 'Офис продаж',
    };

    expect(getWorkspaceMeta(activeWorkspace)).toBe('Владелец • 3 участника');
    expect(getWorkspaceMeta(secondWorkspace)).toBe('Менеджер • 12 участников');
  });

  test('omits separator when only one workspace meta part is available', () => {
    expect(
      getWorkspaceMeta({
        member_role: { code: 'owner', id: 1, is_system: true, name: 'Владелец' },
      }),
    ).toBe('Владелец');

    expect(
      getWorkspaceMeta({
        members_count: 1,
      }),
    ).toBe('1 участник');
  });
});
