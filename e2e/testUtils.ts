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
  avatar_url?: string;
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

type ProjectStatus = {
  code?: string;
  id?: number;
  name?: string;
  sort_order?: number;
};

type CounterpartyType = {
  code?: string;
  id?: number;
  name?: string;
  sort_order?: number;
};

type WorkspaceCounterparty = {
  created_at?: string;
  email?: string;
  id?: string;
  name?: string;
  phone?: string;
  type?: CounterpartyType;
  updated_at?: string;
  workspace_id?: string;
};

type WorkspaceProject = {
  address?: string;
  counterparty?: WorkspaceCounterparty;
  created_at?: string;
  description?: string;
  end_date?: string;
  id?: string;
  name?: string;
  start_date?: string;
  status?: ProjectStatus;
  updated_at?: string;
  workspace_id?: string;
};

const mockUser = {
  avatar_url: 'https://example.com/avatar.png',
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
  counterpartiesByWorkspace?: Record<string, WorkspaceCounterparty[]>;
  counterpartyTypes?: CounterpartyType[];
  forgotPassword?: { error?: string; status: number };
  initialUser?: typeof mockUser | null;
  inviteAcceptByToken?: Record<
    string,
    { error?: string; status: number; workspaceId?: string }
  >;
  invitePreviewByToken?: Record<string, InvitePreview | null>;
  login?: { error?: string; status: number; user?: typeof mockUser };
  membersByWorkspace?: Record<string, WorkspaceMember[]>;
  projectsByWorkspace?: Record<string, WorkspaceProject[]>;
  projectStatuses?: ProjectStatus[];
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
  const defaultCounterpartyType: CounterpartyType = {
    code: 'client',
    id: 1,
    name: 'Клиент',
    sort_order: 1,
  };
  const defaultProjectStatus: ProjectStatus = {
    code: 'draft',
    id: 1,
    name: 'Черновик',
    sort_order: 1,
  };

  const state = {
    counterpartiesByWorkspace: options.counterpartiesByWorkspace ?? {
      [defaultWorkspaceId]: [],
    },
    counterpartyTypes: options.counterpartyTypes ?? [defaultCounterpartyType],
    forgotPassword: options.forgotPassword ?? { status: 200 },
    inviteAcceptByToken: options.inviteAcceptByToken ?? {},
    invitePreviewByToken: options.invitePreviewByToken ?? {},
    login: options.login ?? { status: 200, user: mockUser },
    membersByWorkspace: options.membersByWorkspace ?? {
      [defaultWorkspaceId]: [],
    },
    projectsByWorkspace: options.projectsByWorkspace ?? {
      [defaultWorkspaceId]: [],
    },
    projectStatuses: options.projectStatuses ?? [defaultProjectStatus],
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
    if (!state.projectsByWorkspace[workspaceId]) {
      state.projectsByWorkspace[workspaceId] = [];
    }
    if (!state.counterpartiesByWorkspace[workspaceId]) {
      state.counterpartiesByWorkspace[workspaceId] = [];
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

    if (url.pathname === '/api/v1/project-statuses' && method === 'GET') {
      return json(200, { statuses: state.projectStatuses });
    }

    if (url.pathname === '/api/v1/counterparty-types' && method === 'GET') {
      return json(200, { types: state.counterpartyTypes });
    }

    if (url.pathname === '/api/v1/profile' && method === 'GET') {
      if (state.user) {
        return json(200, { user: state.user });
      }
      return json(401, { error: 'Not authenticated' });
    }
    if (url.pathname === '/api/v1/profile' && method === 'PATCH') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      const payload = parseRequestBody<{
        name?: string;
        phone?: string;
        surname?: string;
      }>();

      state.user = {
        ...state.user,
        name: payload?.name ?? state.user.name,
        phone: payload?.phone ?? state.user.phone,
        surname: payload?.surname ?? state.user.surname,
      };

      return json(200, { user: state.user });
    }

    if (url.pathname === '/api/v1/profile/avatar' && method === 'POST') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      const avatarUrl = `https://example.com/avatar-${Date.now()}.png`;
      state.user = {
        ...state.user,
        avatar_url: avatarUrl,
      };

      return json(200, { avatar_url: avatarUrl });
    }

    if (url.pathname === '/api/v1/profile/avatar' && method === 'DELETE') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      state.user = {
        ...state.user,
        avatar_url: '',
      };

      return json(200, { message: 'Avatar deleted' });
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
          delete state.projectsByWorkspace[workspaceId];
          delete state.counterpartiesByWorkspace[workspaceId];
          delete state.workspaceInvitesByWorkspace[workspaceId];
          return json(200, { message: 'Workspace deleted' });
        }
      }

      if (tail.length === 1 && tail[0] === 'projects') {
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'GET') {
          const sortBy = url.searchParams.get('sort_by');
          const sortDir =
            url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc';
          const search = url.searchParams.get('search')?.trim().toLowerCase();
          const projects = [...(state.projectsByWorkspace[workspaceId] ?? [])];

          const filteredProjects =
            search && search.length > 0
              ? projects.filter((project) =>
                  [project.name, project.counterparty?.name]
                    .filter((value): value is string => Boolean(value))
                    .some((value) => value.toLowerCase().includes(search)),
                )
              : projects;

          if (sortBy) {
            filteredProjects.sort((a, b) => {
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
            limit: 100,
            offset: 0,
            total: filteredProjects.length,
            projects: filteredProjects,
          });
        }

        if (method === 'POST') {
          const payload = parseRequestBody<{ name?: string }>();
          const created: WorkspaceProject = {
            created_at: nowIso(),
            id: `project-${Date.now()}`,
            name: payload?.name ?? 'Новый проект',
            status: state.projectStatuses[0],
            updated_at: nowIso(),
            workspace_id: workspaceId,
          };

          state.projectsByWorkspace[workspaceId] = [
            created,
            ...(state.projectsByWorkspace[workspaceId] ?? []),
          ];
          return json(201, { project: created });
        }
      }

      if (tail.length === 1 && tail[0] === 'counterparties') {
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'GET') {
          const sortBy = url.searchParams.get('sort_by');
          const sortDir =
            url.searchParams.get('sort_dir') === 'desc' ? 'desc' : 'asc';
          const counterparties = [
            ...(state.counterpartiesByWorkspace[workspaceId] ?? []),
          ];

          if (sortBy) {
            counterparties.sort((a, b) => {
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
            counterparties,
            limit: 200,
            offset: 0,
            total: counterparties.length,
          });
        }

        if (method === 'POST') {
          const payload = parseRequestBody<{
            email?: string;
            name?: string;
            phone?: string;
            type?: string;
          }>();
          const nextType =
            state.counterpartyTypes.find(
              (item) => item.code === payload?.type,
            ) ?? state.counterpartyTypes[0];

          const created: WorkspaceCounterparty = {
            created_at: nowIso(),
            email: payload?.email,
            id: `counterparty-${Date.now()}`,
            name: payload?.name ?? 'Новый контрагент',
            phone: payload?.phone,
            type: nextType,
            updated_at: nowIso(),
            workspace_id: workspaceId,
          };

          state.counterpartiesByWorkspace[workspaceId] = [
            created,
            ...(state.counterpartiesByWorkspace[workspaceId] ?? []),
          ];
          return json(201, { counterparty: created });
        }
      }

      if (tail.length === 2 && tail[0] === 'projects') {
        const projectId = tail[1];
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'GET') {
          const project = (state.projectsByWorkspace[workspaceId] ?? []).find(
            (item) => item.id === projectId,
          );

          if (!project) {
            return json(404, { error: 'Project not found' });
          }

          return json(200, { project });
        }

        if (method === 'DELETE') {
          state.projectsByWorkspace[workspaceId] = (
            state.projectsByWorkspace[workspaceId] ?? []
          ).filter((project) => project.id !== projectId);
          return json(200, { message: 'Project deleted' });
        }

        if (method === 'PATCH') {
          const payload = parseRequestBody<{
            address?: string;
            counterparty_id?: string;
            description?: string;
            end_date?: string;
            name?: string;
            start_date?: string;
            status_id?: number;
          }>();

          const status = state.projectStatuses.find(
            (item) => item.id === payload?.status_id,
          );
          const counterparty = (
            state.counterpartiesByWorkspace[workspaceId] ?? []
          ).find((item) => item.id === payload?.counterparty_id);

          state.projectsByWorkspace[workspaceId] = (
            state.projectsByWorkspace[workspaceId] ?? []
          ).map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  address: payload?.address ?? project.address,
                  counterparty: counterparty ?? project.counterparty,
                  description: payload?.description ?? project.description,
                  end_date: payload?.end_date ?? project.end_date,
                  name: payload?.name ?? project.name,
                  start_date: payload?.start_date ?? project.start_date,
                  status: status ?? project.status,
                  updated_at: nowIso(),
                }
              : project,
          );

          const updated = (state.projectsByWorkspace[workspaceId] ?? []).find(
            (project) => project.id === projectId,
          );
          return json(200, { project: updated });
        }
      }

      if (tail.length === 3 && tail[0] === 'projects' && tail[2] === 'copy') {
        const projectId = tail[1];
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'POST') {
          const source = (state.projectsByWorkspace[workspaceId] ?? []).find(
            (project) => project.id === projectId,
          );

          if (!source) {
            return json(404, { error: 'Project not found' });
          }

          const copied: WorkspaceProject = {
            ...source,
            created_at: nowIso(),
            id: `project-copy-${Date.now()}`,
            name: source.name ? `${source.name} (Копия)` : 'Копия проекта',
            updated_at: nowIso(),
          };

          state.projectsByWorkspace[workspaceId] = [
            copied,
            ...(state.projectsByWorkspace[workspaceId] ?? []),
          ];
          return json(201, { project: copied });
        }
      }

      if (tail.length === 2 && tail[0] === 'counterparties') {
        const counterpartyId = tail[1];
        ensureWorkspaceDefaults(workspaceId);

        if (method === 'DELETE') {
          state.counterpartiesByWorkspace[workspaceId] = (
            state.counterpartiesByWorkspace[workspaceId] ?? []
          ).filter((counterparty) => counterparty.id !== counterpartyId);
          return json(200, { message: 'Counterparty deleted' });
        }

        if (method === 'PATCH') {
          const payload = parseRequestBody<{
            email?: string;
            name?: string;
            phone?: string;
            type?: string;
          }>();
          const nextType = state.counterpartyTypes.find(
            (item) => item.code === payload?.type,
          );

          state.counterpartiesByWorkspace[workspaceId] = (
            state.counterpartiesByWorkspace[workspaceId] ?? []
          ).map((counterparty) =>
            counterparty.id === counterpartyId
              ? {
                  ...counterparty,
                  email: payload?.email ?? counterparty.email,
                  name: payload?.name ?? counterparty.name,
                  phone: payload?.phone ?? counterparty.phone,
                  type: nextType ?? counterparty.type,
                  updated_at: nowIso(),
                }
              : counterparty,
          );

          const updated = (
            state.counterpartiesByWorkspace[workspaceId] ?? []
          ).find((counterparty) => counterparty.id === counterpartyId);
          return json(200, { counterparty: updated });
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
