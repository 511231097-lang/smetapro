import type { Page } from '@playwright/test';

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

const mockAdminUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  phone: '79998887766',
  email: 'admin@example.com',
  name: 'Админ',
  surname: 'Системный',
  roles: ['admin'],
  permissions: ['admin_access'],
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockWorkspace = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Моя компания',
  created_by: mockUser.id,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

type Project = {
  id: string;
  workspace_id: string;
  status_id: number;
  name: string;
  address: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type AdminUser = {
  id: string;
  phone: string;
  email?: string | null;
  name?: string;
  surname?: string | null;
  created_at?: string;
  updated_at?: string;
};

const mockProject = {
  id: '99999999-9999-4999-8999-999999999999',
  workspace_id: mockWorkspace.id,
  status_id: 2,
  name: 'Тестовый проект',
  address: 'ул. Примерная, д. 1',
  comment: 'Заметка о проекте',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

type MockOptions = {
  initialUser?: typeof mockUser | null;
  workspaces?: (typeof mockWorkspace)[];
  adminUsers?: AdminUser[];
  adminWorkspaces?: (typeof mockWorkspace)[];
  projectsByWorkspace?: Record<string, Project[]>;
  login?: { status: number; error?: string; user?: typeof mockUser };
  register?: { status: number; error?: string; user?: typeof mockUser };
  refresh?: { status: number; error?: string; user?: typeof mockUser };
  workspacesStatus?: number;
};

const setupApiMock = async (page: Page, options: MockOptions = {}) => {
  const defaultWorkspaceId = options.workspaces?.[0]?.id ?? mockWorkspace.id;
  const state = {
    user: options.initialUser ?? null,
    workspaces: options.workspaces ?? [mockWorkspace],
    adminUsers: options.adminUsers ?? [
      {
        id: mockUser.id,
        phone: mockUser.phone,
        email: mockUser.email,
        name: mockUser.name,
        surname: mockUser.surname,
        created_at: mockUser.created_at,
        updated_at: mockUser.created_at,
      },
    ],
    adminWorkspaces: options.adminWorkspaces ??
      options.workspaces ?? [mockWorkspace],
    projectsByWorkspace: options.projectsByWorkspace ?? {
      [defaultWorkspaceId]: [mockProject],
    },
    login: options.login ?? { status: 200, user: mockUser },
    register: options.register ?? { status: 201, user: mockUser },
    refresh: options.refresh ?? { status: 401, error: 'Not authenticated' },
    workspacesStatus: options.workspacesStatus,
  };
  let projectCounter = 1;

  const findProject = (projectId: string) => {
    for (const projects of Object.values(state.projectsByWorkspace)) {
      const match = projects.find((project) => project.id === projectId);
      if (match) {
        return match;
      }
    }
    return null;
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    const json = (status: number, body?: unknown) =>
      route.fulfill({
        status,
        headers:
          body === undefined
            ? undefined
            : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    const isAdmin = state.user?.roles?.includes('admin') ?? false;

    if (url.pathname === '/api/v1/auth/me' && method === 'GET') {
      if (state.user) {
        return json(200, state.user);
      }
      return json(401, { error: 'Not authenticated' });
    }

    if (url.pathname === '/api/v1/auth/login' && method === 'POST') {
      if (state.login.status >= 400) {
        return json(state.login.status, {
          error: state.login.error ?? 'Неверный телефон или пароль',
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
      return json(200);
    }

    if (url.pathname === '/api/v1/workspaces' && method === 'GET') {
      if (state.workspacesStatus && state.workspacesStatus >= 400) {
        return json(state.workspacesStatus, { error: 'Not authenticated' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      return json(200, {
        workspaces: state.workspaces,
        total: state.workspaces.length,
        limit: 50,
        offset: 0,
      });
    }

    if (url.pathname === '/api/v1/workspaces' && method === 'POST') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      const payload = request.postDataJSON?.() as { name?: string } | null;
      const created = {
        id: '33333333-3333-4333-8333-333333333333',
        name: payload?.name ?? 'Новое пространство',
        created_by: state.user.id,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };
      state.workspaces = [created, ...state.workspaces];
      state.adminWorkspaces = [created, ...state.adminWorkspaces];
      if (!state.projectsByWorkspace[created.id]) {
        state.projectsByWorkspace[created.id] = [];
      }
      return json(201, { workspace: created });
    }

    if (
      url.pathname.startsWith('/api/v1/workspaces/') &&
      !url.pathname.endsWith('/projects')
    ) {
      const parts = url.pathname.split('/');
      const workspaceId = parts[4];
      if (!workspaceId) {
        return json(400, { error: 'Workspace id is required' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      if (method === 'GET') {
        const workspace = state.workspaces.find(
          (entry) => entry.id === workspaceId,
        );
        if (!workspace) {
          return json(404, { error: 'Workspace not found' });
        }
        return json(200, { workspace });
      }

      if (method === 'PUT') {
        const workspaceIndex = state.workspaces.findIndex(
          (entry) => entry.id === workspaceId,
        );
        if (workspaceIndex === -1) {
          return json(404, { error: 'Workspace not found' });
        }
        const payload = request.postDataJSON?.() as { name?: string } | null;
        const updated = {
          ...state.workspaces[workspaceIndex],
          name: payload?.name ?? state.workspaces[workspaceIndex].name,
          updated_at: new Date().toISOString(),
        };
        state.workspaces = state.workspaces.map((entry) =>
          entry.id === workspaceId ? updated : entry,
        );
        state.adminWorkspaces = state.adminWorkspaces.map((entry) =>
          entry.id === workspaceId ? updated : entry,
        );
        return json(200, { workspace: updated });
      }

      if (method === 'DELETE') {
        const exists = state.workspaces.some(
          (entry) => entry.id === workspaceId,
        );
        if (!exists) {
          return json(404, { error: 'Workspace not found' });
        }
        state.workspaces = state.workspaces.filter(
          (entry) => entry.id !== workspaceId,
        );
        state.adminWorkspaces = state.adminWorkspaces.filter(
          (entry) => entry.id !== workspaceId,
        );
        delete state.projectsByWorkspace[workspaceId];
        return json(200);
      }
    }

    if (url.pathname === '/api/v1/admin/users' && method === 'GET') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      if (!isAdmin) {
        return json(403, { error: 'Forbidden' });
      }
      const limit = Number(url.searchParams.get('limit') ?? '20');
      const offset = Number(url.searchParams.get('offset') ?? '0');
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const filtered = search
        ? state.adminUsers.filter((user) => {
            const phone = user.phone?.toLowerCase() ?? '';
            const name = user.name?.toLowerCase() ?? '';
            const surname = user.surname?.toLowerCase() ?? '';
            return (
              phone.includes(search) ||
              name.includes(search) ||
              surname.includes(search)
            );
          })
        : state.adminUsers;
      const paged = filtered.slice(offset, offset + limit);
      return json(200, {
        users: paged,
        total: filtered.length,
        limit,
        offset,
      });
    }

    if (url.pathname.startsWith('/api/v1/admin/users/')) {
      const parts = url.pathname.split('/');
      const userId = parts[5];
      if (!userId) {
        return json(400, { error: 'User id is required' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      const isSelf = state.user.id === userId;

      if (method === 'GET') {
        if (!isAdmin) {
          return json(403, { error: 'Forbidden' });
        }
        const user = state.adminUsers.find((entry) => entry.id === userId);
        if (!user) {
          return json(404, { error: 'User not found' });
        }
        return json(200, { user });
      }

      if (method === 'PUT') {
        if (!isAdmin && !isSelf) {
          return json(403, { error: 'Forbidden' });
        }
        const payload = request.postDataJSON?.() as {
          phone?: string;
          email?: string;
          name?: string;
          surname?: string;
        } | null;
        const existing = state.adminUsers.find((entry) => entry.id === userId);
        if (!existing && !isSelf) {
          return json(404, { error: 'User not found' });
        }
        const base: AdminUser = existing ?? {
          id: state.user.id,
          phone: state.user.phone ?? '',
          email: state.user.email ?? null,
          name: state.user.name,
          surname: state.user.surname ?? null,
          created_at: state.user.created_at,
          updated_at: state.user.created_at,
        };
        const updated: AdminUser = {
          ...base,
          phone: payload?.phone ?? base.phone,
          email: payload?.email === undefined ? base.email : payload.email,
          name: payload?.name ?? base.name,
          surname:
            payload?.surname === undefined ? base.surname : payload.surname,
          updated_at: new Date().toISOString(),
        };
        if (isSelf) {
          state.user = {
            ...state.user,
            phone: updated.phone,
            email: updated.email ?? null,
            name: updated.name,
            surname: updated.surname ?? null,
          };
        }
        const existingIndex = state.adminUsers.findIndex(
          (entry) => entry.id === userId,
        );
        if (existingIndex >= 0) {
          state.adminUsers = state.adminUsers.map((entry) =>
            entry.id === userId ? { ...entry, ...updated } : entry,
          );
        } else {
          state.adminUsers = [updated, ...state.adminUsers];
        }
        return json(200, { user: updated });
      }

      if (method === 'DELETE') {
        if (!isAdmin) {
          return json(403, { error: 'Forbidden' });
        }
        const exists = state.adminUsers.some((entry) => entry.id === userId);
        if (!exists) {
          return json(404, { error: 'User not found' });
        }
        state.adminUsers = state.adminUsers.filter(
          (entry) => entry.id !== userId,
        );
        return json(200);
      }
    }

    if (url.pathname === '/api/v1/admin/workspaces' && method === 'GET') {
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      if (!isAdmin) {
        return json(403, { error: 'Forbidden' });
      }
      const limit = Number(url.searchParams.get('limit') ?? '20');
      const offset = Number(url.searchParams.get('offset') ?? '0');
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const filtered = search
        ? state.adminWorkspaces.filter((workspace) =>
            (workspace.name ?? '').toLowerCase().includes(search),
          )
        : state.adminWorkspaces;
      const paged = filtered.slice(offset, offset + limit);
      return json(200, {
        workspaces: paged,
        total: filtered.length,
        limit,
        offset,
      });
    }

    if (url.pathname.startsWith('/api/v1/admin/workspaces/')) {
      const parts = url.pathname.split('/');
      const workspaceId = parts[5];
      if (!workspaceId) {
        return json(400, { error: 'Workspace id is required' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }
      if (!isAdmin) {
        return json(403, { error: 'Forbidden' });
      }

      if (method === 'GET') {
        const workspace = state.adminWorkspaces.find(
          (entry) => entry.id === workspaceId,
        );
        if (!workspace) {
          return json(404, { error: 'Workspace not found' });
        }
        return json(200, { workspace });
      }

      if (method === 'PUT') {
        const payload = request.postDataJSON?.() as { name?: string } | null;
        const existing = state.adminWorkspaces.find(
          (entry) => entry.id === workspaceId,
        );
        if (!existing) {
          return json(404, { error: 'Workspace not found' });
        }
        const updated = {
          ...existing,
          name: payload?.name ?? existing.name,
          updated_at: new Date().toISOString(),
        };
        state.adminWorkspaces = state.adminWorkspaces.map((entry) =>
          entry.id === workspaceId ? updated : entry,
        );
        state.workspaces = state.workspaces.map((entry) =>
          entry.id === workspaceId ? updated : entry,
        );
        return json(200, { workspace: updated });
      }

      if (method === 'DELETE') {
        const exists = state.adminWorkspaces.some(
          (entry) => entry.id === workspaceId,
        );
        if (!exists) {
          return json(404, { error: 'Workspace not found' });
        }
        state.adminWorkspaces = state.adminWorkspaces.filter(
          (entry) => entry.id !== workspaceId,
        );
        state.workspaces = state.workspaces.filter(
          (entry) => entry.id !== workspaceId,
        );
        delete state.projectsByWorkspace[workspaceId];
        return json(200);
      }
    }

    if (
      url.pathname.startsWith('/api/v1/workspaces/') &&
      url.pathname.endsWith('/projects')
    ) {
      const parts = url.pathname.split('/');
      const workspaceId = parts[4];
      if (!workspaceId) {
        return json(400, { error: 'Workspace id is required' });
      }
      if (!state.user) {
        return json(401, { error: 'Not authenticated' });
      }

      if (method === 'GET') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        const offset = Number(url.searchParams.get('offset') ?? '0');
        const projects = state.projectsByWorkspace[workspaceId] ?? [];
        const paged = projects.slice(offset, offset + limit);
        return json(200, {
          projects: paged,
          total: projects.length,
          limit,
          offset,
        });
      }

      if (method === 'POST') {
        const payload = request.postDataJSON?.() as {
          name?: string;
          address?: string;
          comment?: string;
        } | null;
        const timestamp = new Date().toISOString();
        const createdProject = {
          id: `project-${projectCounter++}`,
          workspace_id: workspaceId,
          status_id: 2,
          name: payload?.name ?? 'Новый проект',
          address: payload?.address ?? null,
          comment: payload?.comment ?? null,
          created_at: timestamp,
          updated_at: timestamp,
        };
        const projects = state.projectsByWorkspace[workspaceId] ?? [];
        state.projectsByWorkspace[workspaceId] = [createdProject, ...projects];
        return json(201, { project: createdProject });
      }
    }

    if (url.pathname.startsWith('/api/v1/projects/')) {
      const parts = url.pathname.split('/');
      const projectId = parts[4];
      if (!projectId) {
        return json(400, { error: 'Project id is required' });
      }

      if (method === 'GET') {
        const project = findProject(projectId);
        if (!project) {
          return json(404, { error: 'Project not found' });
        }
        return json(200, { project });
      }

      if (method === 'PUT') {
        const project = findProject(projectId);
        if (!project) {
          return json(404, { error: 'Project not found' });
        }
        const payload = request.postDataJSON?.() as {
          name?: string;
          address?: string;
          comment?: string;
        } | null;
        const updated = {
          ...project,
          name: payload?.name ?? project.name,
          address:
            payload?.address === undefined ? project.address : payload.address,
          comment:
            payload?.comment === undefined ? project.comment : payload.comment,
          updated_at: new Date().toISOString(),
        };
        const workspaceProjects =
          state.projectsByWorkspace[project.workspace_id] ?? [];
        state.projectsByWorkspace[project.workspace_id] = workspaceProjects.map(
          (entry) => (entry.id === projectId ? updated : entry),
        );
        return json(200, { project: updated });
      }

      if (method === 'DELETE') {
        const project = findProject(projectId);
        if (!project) {
          return json(404, { error: 'Project not found' });
        }
        const workspaceProjects =
          state.projectsByWorkspace[project.workspace_id] ?? [];
        state.projectsByWorkspace[project.workspace_id] =
          workspaceProjects.filter((entry) => entry.id !== projectId);
        return json(200);
      }
    }

    return json(500, { error: `Unhandled ${method} ${url.pathname}` });
  });
};

export { mockAdminUser, mockProject, mockUser, mockWorkspace, setupApiMock };
export type { MockOptions };
