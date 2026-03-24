import { describe, expect, test } from '@rstest/core';
import { buildRoute, ROUTES } from '../src/shared/constants/routes';
import { getInitials } from '../src/shared/utils/getInitials';

describe('getInitials', () => {
  test('returns both initials when name and surname are provided', () => {
    expect(getInitials('иван', 'петров')).toBe('ИП');
  });

  test('returns the first letter of name when surname is missing', () => {
    expect(getInitials('Мария')).toBe('М');
  });

  test('returns the first letter of surname when name is missing', () => {
    expect(getInitials(undefined, 'Сидоров')).toBe('С');
  });

  test('returns U when both values are empty', () => {
    expect(getInitials('   ', '   ')).toBe('U');
    expect(getInitials()).toBe('U');
  });
});

describe('buildRoute', () => {
  test('replaces all params in a route', () => {
    expect(
      buildRoute(ROUTES.WORKSPACE_ROLES, {
        workspaceId: 'ws-1',
      }),
    ).toBe('/ws-1/workspace/roles');
  });

  test('supports routes with several dynamic params', () => {
    expect(
      buildRoute('/:workspaceId/projects/:projectId', {
        workspaceId: 'ws-1',
        projectId: 'proj-77',
      }),
    ).toBe('/ws-1/projects/proj-77');
  });

  test('keeps unknown placeholders untouched', () => {
    expect(
      buildRoute('/:workspaceId/:taskId', {
        workspaceId: 'ws-2',
      }),
    ).toBe('/ws-2/:taskId');
  });
});
