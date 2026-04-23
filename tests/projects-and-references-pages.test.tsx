import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, rstest, test } from '@rstest/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HttpClientError } from '../src/shared/api/httpClient';

const mocks = rstest.hoisted(() => ({
  getGetWorkspacesWorkspaceIdCounterpartiesQueryKey: rstest.fn(),
  getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey: rstest.fn(),
  getGetWorkspacesWorkspaceIdProjectsQueryKey: rstest.fn(),
  notificationsShow: rstest.fn(),
  useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId: rstest.fn(),
  useDeleteWorkspacesWorkspaceIdProjectsProjectId: rstest.fn(),
  useGetCounterpartyTypes: rstest.fn(),
  useGetProjectStatuses: rstest.fn(),
  useGetWorkspacesWorkspaceIdCounterparties: rstest.fn(),
  useGetWorkspacesWorkspaceIdProjectsProjectId: rstest.fn(),
  useGetWorkspacesWorkspaceIdProjects: rstest.fn(),
  usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId: rstest.fn(),
  usePatchWorkspacesWorkspaceIdProjectsProjectId: rstest.fn(),
  usePostWorkspacesWorkspaceIdCounterparties: rstest.fn(),
  usePostWorkspacesWorkspaceIdProjects: rstest.fn(),
  usePostWorkspacesWorkspaceIdProjectsProjectIdCopy: rstest.fn(),
}));

rstest.mock('../src/shared/api/generated/smetchik', () => ({
  getGetWorkspacesWorkspaceIdCounterpartiesQueryKey:
    mocks.getGetWorkspacesWorkspaceIdCounterpartiesQueryKey,
  getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey:
    mocks.getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey,
  getGetWorkspacesWorkspaceIdProjectsQueryKey:
    mocks.getGetWorkspacesWorkspaceIdProjectsQueryKey,
  useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId:
    mocks.useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId,
  useDeleteWorkspacesWorkspaceIdProjectsProjectId:
    mocks.useDeleteWorkspacesWorkspaceIdProjectsProjectId,
  useGetCounterpartyTypes: mocks.useGetCounterpartyTypes,
  useGetProjectStatuses: mocks.useGetProjectStatuses,
  useGetWorkspacesWorkspaceIdCounterparties:
    mocks.useGetWorkspacesWorkspaceIdCounterparties,
  useGetWorkspacesWorkspaceIdProjectsProjectId:
    mocks.useGetWorkspacesWorkspaceIdProjectsProjectId,
  useGetWorkspacesWorkspaceIdProjects:
    mocks.useGetWorkspacesWorkspaceIdProjects,
  usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId:
    mocks.usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId,
  usePatchWorkspacesWorkspaceIdProjectsProjectId:
    mocks.usePatchWorkspacesWorkspaceIdProjectsProjectId,
  usePostWorkspacesWorkspaceIdCounterparties:
    mocks.usePostWorkspacesWorkspaceIdCounterparties,
  usePostWorkspacesWorkspaceIdProjects:
    mocks.usePostWorkspacesWorkspaceIdProjects,
  usePostWorkspacesWorkspaceIdProjectsProjectIdCopy:
    mocks.usePostWorkspacesWorkspaceIdProjectsProjectIdCopy,
}));

rstest.mock('@mantine/notifications', () => ({
  notifications: {
    show: mocks.notificationsShow,
  },
}));

import ProjectPage, {
  getClientCounterpartyOptions,
} from '../src/pages/projects/ProjectPage';
import ProjectsPage from '../src/pages/projects/ProjectsPage';
import ReferencesPage from '../src/pages/references/ReferencesPage';

const workspaceId = 'ws-1';
const projectId = 'project-1';

const locationProbeTestId = 'location-probe';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid={locationProbeTestId}>{location.pathname}</div>;
};

const renderWithRoutes = (
  initialEntry: string,
  routePath: string,
  element: ReactNode,
) =>
  render(
    <MantineProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes>
          <Route path={routePath} element={element} />
          <Route
            path="/:workspaceId/projects/:projectId"
            element={<div>project details route</div>}
          />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );

const createMutationState = () => ({
  isPending: false,
  mutate: rstest.fn(),
});

beforeEach(() => {
  const project = {
    counterparty: { id: 'counterparty-1', name: 'ВИЦЦ' },
    created_at: '2026-05-01T10:00:00.000Z',
    end_date: '2026-05-31',
    id: projectId,
    name: 'ЖК Восток 1',
    start_date: '2026-05-01',
    status: { id: 1, name: 'Черновик' },
    updated_at: '2026-05-01T10:00:00.000Z',
  };

  const counterparty = {
    email: 'client@example.com',
    id: 'counterparty-1',
    name: 'ВИЦЦ',
    phone: '+79000000000',
    type: { code: 'client', name: 'Клиент', sort_order: 1 },
  };

  mocks.notificationsShow.mockReset();
  mocks.getGetWorkspacesWorkspaceIdProjectsQueryKey.mockReset();
  mocks.getGetWorkspacesWorkspaceIdProjectsQueryKey.mockImplementation(
    (id: string) => [`/projects/${id}`],
  );
  mocks.getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey.mockReset();
  mocks.getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey.mockImplementation(
    (workspace: string, project: string) => [`/projects/${workspace}/${project}`],
  );
  mocks.getGetWorkspacesWorkspaceIdCounterpartiesQueryKey.mockReset();
  mocks.getGetWorkspacesWorkspaceIdCounterpartiesQueryKey.mockImplementation(
    (id: string) => [`/counterparties/${id}`],
  );

  mocks.useGetWorkspacesWorkspaceIdProjects.mockReset();
  mocks.useGetWorkspacesWorkspaceIdProjects.mockReturnValue({
    data: {
      projects: [project],
      total: 1,
    },
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: rstest.fn(),
  });
  mocks.useGetWorkspacesWorkspaceIdProjectsProjectId.mockReset();
  mocks.useGetWorkspacesWorkspaceIdProjectsProjectId.mockReturnValue({
    data: { project },
    error: null,
    isError: false,
    isLoading: false,
    refetch: rstest.fn(),
  });

  mocks.useGetProjectStatuses.mockReset();
  mocks.useGetProjectStatuses.mockReturnValue({
    data: {
      statuses: [
        { id: 1, name: 'Черновик' },
        { id: 2, name: 'В работе' },
      ],
    },
  });

  mocks.useGetWorkspacesWorkspaceIdCounterparties.mockReset();
  mocks.useGetWorkspacesWorkspaceIdCounterparties.mockReturnValue({
    data: {
      counterparties: [counterparty],
      total: 1,
    },
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: rstest.fn(),
  });

  mocks.useGetCounterpartyTypes.mockReset();
  mocks.useGetCounterpartyTypes.mockReturnValue({
    data: {
      types: [{ code: 'client', name: 'Клиент', sort_order: 1 }],
    },
  });

  mocks.usePostWorkspacesWorkspaceIdProjects.mockReset();
  mocks.usePostWorkspacesWorkspaceIdProjects.mockReturnValue(
    createMutationState(),
  );
  mocks.usePostWorkspacesWorkspaceIdProjectsProjectIdCopy.mockReset();
  mocks.usePostWorkspacesWorkspaceIdProjectsProjectIdCopy.mockReturnValue(
    createMutationState(),
  );
  mocks.useDeleteWorkspacesWorkspaceIdProjectsProjectId.mockReset();
  mocks.useDeleteWorkspacesWorkspaceIdProjectsProjectId.mockReturnValue(
    createMutationState(),
  );
  mocks.usePatchWorkspacesWorkspaceIdProjectsProjectId.mockReset();
  mocks.usePatchWorkspacesWorkspaceIdProjectsProjectId.mockReturnValue(
    createMutationState(),
  );

  mocks.usePostWorkspacesWorkspaceIdCounterparties.mockReset();
  mocks.usePostWorkspacesWorkspaceIdCounterparties.mockReturnValue(
    createMutationState(),
  );
  mocks.usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId.mockReset();
  mocks.usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId.mockReturnValue(
    createMutationState(),
  );
  mocks.useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId.mockReset();
  mocks.useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId.mockReturnValue(
    createMutationState(),
  );
});

describe('ProjectsPage', () => {
  test('opens project details when table row is clicked', () => {
    window.localStorage.setItem('smetapro.projects.viewMode', 'table');

    renderWithRoutes(
      `/${workspaceId}/projects`,
      '/:workspaceId/projects',
      <ProjectsPage />,
    );

    expect(
      screen.getByRole('heading', { name: 'Проекты' }),
    ).toBeInTheDocument();

    const projectRowLink = screen
      .getAllByRole('link', { name: 'ЖК Восток 1' })
      .find((item) => item.closest('tr'));
    const projectRow = projectRowLink?.closest('tr');
    expect(projectRow).not.toBeNull();
    fireEvent.click(projectRow as HTMLTableRowElement);

    expect(screen.getByTestId(locationProbeTestId)).toHaveTextContent(
      `/${workspaceId}/projects/${projectId}`,
    );
  });

  test('passes search value to projects query', () => {
    renderWithRoutes(`/${workspaceId}/projects`, '/:workspaceId/projects', <ProjectsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Открыть поиск' }));
    fireEvent.change(screen.getByLabelText('Поиск по проектам'), {
      target: { value: 'ВИЦЦ' },
    });

    expect(
      mocks.useGetWorkspacesWorkspaceIdProjects,
    ).toHaveBeenLastCalledWith(
      workspaceId,
      expect.objectContaining({
        search: 'ВИЦЦ',
      }),
      expect.anything(),
    );
  });
});

describe('ProjectPage', () => {
  test('renders main project form and tab placeholders', () => {
    renderWithRoutes(
      `/${workspaceId}/projects/${projectId}`,
      '/:workspaceId/projects/:projectId',
      <ProjectPage />,
    );

    expect(screen.getByRole('heading', { name: 'ЖК Восток 1' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Все проекты' })).toBeVisible();

    fireEvent.click(screen.getByRole('tab', { name: 'Финансы' }));

    expect(
      screen.getByText('Раздел «Финансы» пока в разработке.'),
    ).toBeVisible();
  });

  test('shows not found placeholder when project endpoint returns 404', () => {
    mocks.useGetWorkspacesWorkspaceIdProjectsProjectId.mockReturnValueOnce({
      data: undefined,
      error: new HttpClientError(
        new Response(null, { status: 404 }),
        { error: 'Project not found' },
      ),
      isError: true,
      isLoading: false,
      refetch: rstest.fn(),
    });

    renderWithRoutes(
      `/${workspaceId}/projects/missing-project`,
      '/:workspaceId/projects/:projectId',
      <ProjectPage />,
    );

    expect(
      screen.getByRole('heading', { name: 'Проект не найден' }),
    ).toBeVisible();
  });

  test('allows saving project with empty address', async () => {
    const mutate = rstest.fn();
    let patchHookCallCount = 0;

    mocks.useGetWorkspacesWorkspaceIdProjectsProjectId.mockReturnValueOnce({
      data: {
        project: {
          address: 'ул. Ленина, 1',
          counterparty: { id: 'counterparty-1', name: 'ВИЦЦ' },
          created_at: '2026-05-01T10:00:00.000Z',
          end_date: '2026-05-31',
          id: projectId,
          name: 'ЖК Восток 1',
          start_date: '2026-05-01',
          status: { id: 1, name: 'Черновик' },
          updated_at: '2026-05-01T10:00:00.000Z',
        },
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: rstest.fn(),
    });
    mocks.usePatchWorkspacesWorkspaceIdProjectsProjectId.mockImplementation(
      () => {
        patchHookCallCount += 1;
        return patchHookCallCount % 2 === 1
          ? {
              isPending: false,
              mutate,
            }
          : createMutationState();
      },
    );

    renderWithRoutes(
      `/${workspaceId}/projects/${projectId}`,
      '/:workspaceId/projects/:projectId',
      <ProjectPage />,
    );

    const addressInput = await screen.findByDisplayValue('ул. Ленина, 1');

    fireEvent.change(addressInput, {
      target: { value: '' },
    });
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    expect(mutate).toHaveBeenCalledWith({
      workspaceId,
      projectId,
      data: expect.objectContaining({
        address: '',
      }),
    });
  });
});

describe('getClientCounterpartyOptions', () => {
  test('returns only client counterparties for project form select', () => {
    const options = getClientCounterpartyOptions([
      {
        id: 'counterparty-1',
        name: 'ВИЦЦ',
        type: { code: 'client' },
      },
      {
        id: 'counterparty-2',
        name: 'Поставщик',
        type: { code: 'supplier' },
      },
    ]);

    expect(options).toEqual([{ value: 'counterparty-1', label: 'ВИЦЦ' }]);
  });
});

describe('ReferencesPage', () => {
  test('renders counterparties list and create modal', () => {
    renderWithRoutes(
      `/${workspaceId}/references`,
      '/:workspaceId/references',
      <ReferencesPage />,
    );

    expect(screen.getByRole('heading', { name: 'Справочники' })).toBeVisible();
    expect(screen.getByText('Всего контрагентов: 1')).toBeVisible();
    expect(screen.getByText('ВИЦЦ')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Добавить контрагента' }),
    ).toBeVisible();
  });
});
