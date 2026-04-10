import type { Page } from '@playwright/test';

type WorkspaceRole = {
  code?: string;
  description?: string;
  id?: number;
  is_system?: boolean;
  members_count?: number;
  name?: string;
  permissions?: string[];
};

type MemberRole = {
  code?: string;
  description?: string;
  id?: number;
  is_system?: boolean;
  name?: string;
};

type WorkspaceMember = {
  created_at?: string;
  email?: string;
  id?: string;
  name?: string;
  phone?: string;
  position?: string;
  role?: MemberRole;
  surname?: string;
  telegram?: string;
  updated_at?: string;
  user_id?: string;
  workspace_id?: string;
};

type WorkspaceInvite = {
  created_at?: string;
  expires_at?: string;
  role?: MemberRole;
  token?: string;
  use_count?: number;
};

type InvitePreview = {
  expires_at?: string;
  member_count?: number;
  role?: MemberRole;
  workspace_description?: string;
  workspace_id?: string;
  workspace_name?: string;
};

const mockUser = {
  id: '11111111-1111-4111-8111-111111111111',
  phone: '79001234567',
  email: 'ivan@example.com',
  name: 'Иван',
  surname: 'Петров',
  roles: ['user'],
  permissions: ['client_access'],
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockWorkspace = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Моя компания',
  created_by: mockUser.id,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const defaultRole: WorkspaceRole = {
  id: 1,
  code: 'owner',
  name: 'Владелец',
  description: 'Полный доступ',
  is_system: true,
};

const defaultInviteExpiry = '2035-01-01T00:00:00.000Z';

type MockOptions = {
  forgotPassword?: { error?: string; status: number };
  initialUser?: typeof mockUser | null;
  inviteAcceptByToken?: Record<
    string,
    { error?: string; status: number; workspaceId?: string }
  >;
  invitePreviewByToken?: Record<string, InvitePreview | null>;
  login?: { error?: string; status: number; user?: typeof mockUser };
  membersByWorkspace?: Record<string, WorkspaceMember[]>;
  refresh?: { error?: string; status: number; user?: typeof mockUser };
  register?: { error?: string; status: number; user?: typeof mockUser };
  resetPassword?: { error?: string; status: number; user?: typeof mockUser };
  rolesByWorkspace?: Record<string, WorkspaceRole[]>;
  workspaceInvitesByWorkspace?: Record<string, WorkspaceInvite | null>;
  workspaces?: (typeof mockWorkspace)[];
  workspacesStatus?: number;
};

const setupApiMock = async (page: Page, options: MockOptions = {}) => {
  const nowIso = () => new Date().toISOString();
  const defaultWorkspaceId = options.workspaces?.[0]?.id ?? mockWorkspace.id;

  const state = {
    forgotPassword: options.forgotPassword ?? { status: 200 },
    inviteAcceptByToken: options.inviteAcceptByToken ?? {},
    invitePreviewByToken: options.invitePreviewByToken ?? {},
    login: options.login ?? { status: 200, user: mockUser },
    membersByWorkspace: options.membersByWorkspace ?? {
      [defaultWorkspaceId]: [],
    },
    refresh: options.refresh ?? { status: 401, error: 'Not authenticated' },
    register: options.register ?? { status: 201, user: mockUser },
    resetPassword: options.resetPassword ?? { status: 200, user: mockUser },
    rolesByWorkspace: options.rolesByWorkspace ?? {
      [defaultWorkspaceId]: [defaultRole],
    },
    user: options.initialUser ?? null,
    workspaceInvitesByWorkspace: options.workspaceInvitesByWorkspace ?? {},
    workspaces: options.workspaces ?? [mockWorkspace],
    workspacesStatus: options.workspacesStatus,
  };

  const ensureWorkspaceDefaults = (workspaceId: string) => {
    if (!state.rolesByWorkspace[workspaceId]) {
      state.rolesByWorkspace[workspaceId] = [defaultRole];
    }
    if (!state.membersByWorkspace[workspaceId]) {
      state.membersByWorkspace[workspaceId] = [];
    }
  };

  state.workspaces.forEach((workspace) => {
    if (workspace.id) {
      ensureWorkspaceDefaults(workspace.id);
    }
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const segments = url.pathname.split('/').filter(Boolean);

    const parseRequestBody = <T>() => {
      try {
        return request.postDataJSON() as T;
      } catch {
        return null;
      }
    };

    const json = (status: number, body?: unknown) =>
      route.fulfill({
        body: body === undefined ? undefined : JSON.stringify(body),
        headers:
          body === undefined
            ? undefined
            : { 'content-type': 'application/json' },
        status,
      });

    if (url.pathname === '/api/v1/auth/me' && method === 'GET') {
      if (state.user) {
        return json(200, { user: state.user });
      }
      return json(401, { error: 'Not authenticated' });
    }

    if (url.pathname === '/api/v1/auth/login' && method === 'POST') {
      if (state.login.status >= 400) {
        return json(state.login.status, {
          error: state.login.error ?? 'Неверный e-mail или пароль',
        });
      }
      state.user = state.login.user ?? mockUser;
      return json(200, { user: state.user });
    }

    if (url.pathname === '/api/v1/auth/register' && method === 'POST') {
      if (state.register.status >= 400) {
        return json(state.register.status, {
          error: state.register.error ?? 'Не удалось зарегистрироваться',
        });
      }
      state.user = state.register.user ?? mockUser;
      return json(201, { user: state.user });
    }

    if (url.pathname === '/api/v1/auth/register/verify' && method === 'POST') {
      state.user = state.user ?? mockUser;
      return json(200, { user: state.user });
    }

    if (url.pathname === '/api/v1/auth/forgot-password' && method === 'POST') {
      if (state.forgotPassword.status >= 400) {
        return json(state.forgotPassword.status, {
          error: state.forgotPassword.error ?? 'Не удалось отправить код',
        });
      }
      return json(200, { message: 'Если e-mail существует, код отправлен' });
    }

    if (url.pathname === '/api/v1/auth/reset-password' && method === 'POST') {
      if (state.resetPassword.status >= 400) {
        return json(state.resetPassword.status, {
          error: state.resetPassword.error ?? 'Не удалось сбросить пароль',
        });
      }
      state.user = state.resetPassword.user ?? mockUser;
      return json(200, { user: state.user });
    }

    if (url.pathname === '/api/v1/auth/refresh' && method === 'POST') {
      if (state.refresh.status >= 400) {
        state.user = null;
        return json(state.refresh.status, {
          error: state.refresh.error ?? 'Invalid or expired refresh token',
        });
      }
      state.user = state.refresh.user ?? state.user ?? mockUser;
      return json(200, { user: state.user });
    }

    if (url.pathname === '/api/v1/auth/logout' && method === 'POST') {
      state.user = null;
      return json(200, { message: 'Logged out' });
    }

    if (
      segments[0] === 'api' &&
      segments[1] === 'v1' &&
      segments[2] === 'invite'
    ) {
      const token = segments[3];
      if (!token) {
        return json(400, { error: 'Invite token is required' });
      }

      if (method === 'GET') {
        const configuredPreview = state.invitePreviewByToken[token];
        if (configuredPreview) {
          return json(200, { invite: configuredPreview });
        }

        const workspaceWithInvite = Object.entries(
          state.workspaceInvitesByWorkspace,
        ).find(([, invite]) => invite?.token === token);

        if (workspaceWithInvite) {
          const [workspaceId, invite] = workspaceWithInvite;
          const workspace = state.workspaces.find(
            (item) => item.id === workspaceId,
          );
          const members = state.membersByWorkspace[workspaceId] ?? [];
          return json(200, {
            invite: {
              expires_at: invite?.expires_at,
              member_count: members.length,
              role: invite?.role,
              workspace_description: workspace
                ? `Описание: ${workspace.name}`
                : '',
              workspace_name: workspace?.name ?? 'Пространство',
            },
          });
        }

        return json(404, { error: 'Invite not found' });
      }

      if (method === 'POST') {
        if (!state.user) {
          return json(401, { error: 'Not authenticated' });
        }

        const configuredAccept = state.inviteAcceptByToken[token];
        if (configuredAccept?.status && configuredAccept.status >= 400) {
          return json(configuredAccept.status, {
            error:
              configuredAccept.error ?? 'Не удалось вступить в пространство',
          });
        }

        const fromConfigured = configuredAccept?.workspaceId;
        const fromInvite = Object.entries(
          state.workspaceInvitesByWorkspace,
        ).find(([, invite]) => invite?.token === token)?.[0];

        const workspaceId = fromConfigured ?? fromInvite ?? defaultWorkspaceId;
        if (!workspaceId) {
          return json(404, { error: 'Workspace not found for invite' });
        }

        if (
          !state.workspaces.some((workspace) => workspace.id === workspaceId)
        ) {
          state.workspaces.unshift({
            id: workspaceId,
            name: 'Приглашенное пространство',
            created_at: nowIso(),
            updated_at: nowIso(),
            created_by: state.user.id,
          });
        }

        ensureWorkspaceDefaults(workspaceId);
        const role = state.rolesByWorkspace[workspaceId]?.[0]
          ? {
              code: state.rolesByWorkspace[workspaceId][0].code,
              description: state.rolesByWorkspace[workspaceId][0].description,
              id: state.rolesByWorkspace[workspaceId][0].id,
              is_system: state.rolesByWorkspace[workspaceId][0].is_system,
              name: state.rolesByWorkspace[workspaceId][0].name,
            }
          : undefined;

        const member: WorkspaceMember = {
          email: state.user.email,
          id: `member-${workspaceId}-${state.user.id}`,
          name: state.user.name,
          phone: state.user.phone,
          role,
          surname: state.user.surname,
          user_id: state.user.id,
          workspace_id: workspaceId,
        };

        const members = state.membersByWorkspace[workspaceId] ?? [];
        if (!members.some((item) => item.user_id === state.user?.id)) {
          state.membersByWorkspace[workspaceId] = [member, ...members];
        }

        return json(200, { member });
      }
    }

    if (url.pathname === '/api/v1/workspaces' && method === 'GET') {
      if (state.workspacesStatus && state.workspacesStatus >= 400) {
        return json(state.workspacesStatus, { error: 'Not authenticated' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      return json(200, {
        limit: 50,
        offset: 0,
        total: state.workspaces.length,
        workspaces: state.workspaces,
      });
    }

    if (url.pathname === '/api/v1/workspaces' && method === 'POST') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      const payload = parseRequestBody<{ name?: string }>();
      const created = {
        created_at: nowIso(),
        created_by: state.user.id,
        id: '33333333-3333-4333-8333-333333333333',
        name: payload?.name ?? 'Новое пространство',
        updated_at: nowIso(),
      };

      state.workspaces = [created, ...state.workspaces];
      ensureWorkspaceDefaults(created.id);
      return json(201, { workspace: created });
    }

    if (
      segments[0] === 'api' &&
      segments[1] === 'v1' &&
      segments[2] === 'workspaces'
    ) {
      const workspaceId = segments[3];
      const tail = segments.slice(4);

      if (!workspaceId) {
        return json(400, { error: 'Workspace id is required' });
      }

      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      if (tail.length === 0) {
        if (method === 'GET') {
          const workspace = state.workspaces.find(
            (item) => item.id === workspaceId,
          );
          if (!workspace) {
            return json(404, { error: 'Workspace not found' });
          }
          return json(200, { workspace });
        }

        if (method === 'PUT') {
          const workspaceIndex = state.workspaces.findIndex(
            (item) => item.id === workspaceId,
          );
          if (workspaceIndex === -1) {
            return json(404, { error: 'Workspace not found' });
          }

          const payload = parseRequestBody<{
            description?: string;
            name?: string;
          }>();
          const previous = state.workspaces[workspaceIndex];
          const updated = {
            ...previous,
            description:
              payload?.description === undefined
                ? (previous as { description?: string }).description
                : payload.description,
            name: payload?.name ?? previous.name,
            updated_at: nowIso(),
          };

          state.workspaces = state.workspaces.map((item) =>
            item.id === workspaceId ? updated : item,
          );
          return json(200, { workspace: updated });
        }

        if (method === 'DELETE') {
          const exists = state.workspaces.some(
            (item) => item.id === workspaceId,
          );
          if (!exists) {
            return json(404, { error: 'Workspace not found' });
          }

          state.workspaces = state.workspaces.filter(
            (item) => item.id !== workspaceId,
          );
          delete state.rolesByWorkspace[workspaceId];
          delete state.membersByWorkspace[workspaceId];
          delete state.workspaceInvitesByWorkspace[workspaceId];
          return json(200, { message: 'Workspace deleted' });
        }
      }

      if (tail.length === 1 && tail[0] === 'invite') {
        if (method === 'GET') {
          return json(200, {
            invite: state.workspaceInvitesByWorkspace[workspaceId] ?? undefined,
          });
        }

        if (method === 'POST') {
          const payload = parseRequestBody<{ role_code?: string }>();
          ensureWorkspaceDefaults(workspaceId);

          const selectedRole = state.rolesByWorkspace[workspaceId].find(
            (item) => item.code === payload?.role_code,
          );

          const role: MemberRole | undefined = selectedRole
            ? {
                code: selectedRole.code,
                description: selectedRole.description,
                id: selectedRole.id,
                is_system: selectedRole.is_system,
                name: selectedRole.name,
              }
            : undefined;

          const invite: WorkspaceInvite = {
            created_at: nowIso(),
            expires_at: defaultInviteExpiry,
            role,
            token: `invite-${workspaceId}`,
            use_count: 0,
          };

          state.workspaceInvitesByWorkspace[workspaceId] = invite;
          return json(201, { invite });
        }

        if (method === 'DELETE') {
          state.workspaceInvitesByWorkspace[workspaceId] = null;
          return json(200, { message: 'Invite deleted' });
        }
      }

      if (tail.length === 1 && tail[0] === 'roles' && method === 'GET') {
        ensureWorkspaceDefaults(workspaceId);
        return json(200, { roles: state.rolesByWorkspace[workspaceId] });
      }

      if (tail.length === 1 && tail[0] === 'members' && method === 'GET') {
        ensureWorkspaceDefaults(workspaceId);

        const members = [...(state.membersByWorkspace[workspaceId] ?? [])];
        const sortBy = url.searchParams.get('sort_by');
        const sortDir =
          url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc';

        if (sortBy) {
          members.sort((a, b) => {
            const av = String(
              (a as Record<string, unknown>)[sortBy] ?? '',
            ).toLowerCase();
            const bv = String(
              (b as Record<string, unknown>)[sortBy] ?? '',
            ).toLowerCase();
            if (av === bv) return 0;
            if (sortDir === 'asc') return av > bv ? 1 : -1;
            return av > bv ? -1 : 1;
          });
        }

        return json(200, {
          limit: 50,
          members,
          offset: 0,
          total: members.length,
        });
      }

      if (tail.length === 2 && tail[0] === 'members') {
        const memberId = tail[1];
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'DELETE') {
          state.membersByWorkspace[workspaceId] = (
            state.membersByWorkspace[workspaceId] ?? []
          ).filter((member) => member.id !== memberId);
          return json(200, { message: 'Member deleted' });
        }

        if (method === 'PATCH') {
          const payload = parseRequestBody<Partial<WorkspaceMember>>();
          state.membersByWorkspace[workspaceId] = (
            state.membersByWorkspace[workspaceId] ?? []
          ).map((member) =>
            member.id === memberId
              ? { ...member, ...payload, updated_at: nowIso() }
              : member,
          );

          const updated = (state.membersByWorkspace[workspaceId] ?? []).find(
            (member) => member.id === memberId,
          );
          return json(200, { member: updated });
        }
      }

      if (tail.length === 3 && tail[0] === 'members' && tail[2] === 'role') {
        const memberId = tail[1];
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'PATCH') {
          const payload = parseRequestBody<{ role_code?: string }>();
          const selectedRole = state.rolesByWorkspace[workspaceId].find(
            (role) => role.code === payload?.role_code,
          );

          const role: MemberRole | undefined = selectedRole
            ? {
                code: selectedRole.code,
                description: selectedRole.description,
                id: selectedRole.id,
                is_system: selectedRole.is_system,
                name: selectedRole.name,
              }
            : undefined;

          state.membersByWorkspace[workspaceId] = (
            state.membersByWorkspace[workspaceId] ?? []
          ).map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  role,
                  updated_at: nowIso(),
                }
              : member,
          );

          const updated = (state.membersByWorkspace[workspaceId] ?? []).find(
            (member) => member.id === memberId,
          );
          return json(200, { member: updated });
        }
      }
    }

    return json(500, { error: `Unhandled ${method} ${url.pathname}` });
  });
};

export { mockUser, mockWorkspace, setupApiMock };
export type { MockOptions };
