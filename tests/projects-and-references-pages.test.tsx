import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, rstest, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mocks = rstest.hoisted(() => ({
  getGetWorkspacesWorkspaceIdCounterpartiesQueryKey: rstest.fn(),
  getGetWorkspacesWorkspaceIdProjectsQueryKey: rstest.fn(),
  notificationsShow: rstest.fn(),
  useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId: rstest.fn(),
  useDeleteWorkspacesWorkspaceIdProjectsProjectId: rstest.fn(),
  useGetCounterpartyTypes: rstest.fn(),
  useGetProjectStatuses: rstest.fn(),
  useGetWorkspacesWorkspaceIdCounterparties: rstest.fn(),
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

import ProjectPage from '../src/pages/projects/ProjectPage';
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

  test('shows not found placeholder when project is absent in list', () => {
    mocks.useGetWorkspacesWorkspaceIdProjects.mockReturnValueOnce({
      data: { projects: [] },
      error: null,
      isError: false,
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
