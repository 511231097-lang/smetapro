import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, rstest, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mocks = rstest.hoisted(() => ({
  useGetProfile: rstest.fn(),
  useGetWorkspaces: rstest.fn(),
}));

rstest.mock('../src/shared/api/generated/smetchik', () => ({
  useGetProfile: mocks.useGetProfile,
  useGetWorkspaces: mocks.useGetWorkspaces,
}));

rstest.mock('../src/layouts/components/protected-shell/ProtectedShell', () => ({
  default: ({ user }: { user?: { email?: string } }) => (
    <div data-testid="protected-shell">{user?.email ?? 'unknown'}</div>
  ),
}));

import ProtectedLayout from '../src/layouts/ProtectedLayout';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const setup = (entry: string) => {
  render(
    <MantineProvider>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<ProtectedLayout />} />
          <Route path="/:workspaceId/*" element={<ProtectedLayout />} />
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/workspaces/create"
            element={<div>workspace create</div>}
          />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
};

describe('ProtectedLayout', () => {
  beforeEach(() => {
    mocks.useGetProfile.mockReset();
    mocks.useGetWorkspaces.mockReset();
  });

  test('shows loader while auth query is loading', () => {
    mocks.useGetProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    setup('/');

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  test('redirects to login when auth query fails', () => {
    mocks.useGetProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    setup('/ws-1/projects');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  test('redirects to workspace create when user has no workspaces', () => {
    mocks.useGetProfile.mockReturnValue({
      data: { user: { email: 'maria@example.com' } },
      isLoading: false,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: { workspaces: [] },
      isLoading: false,
      isError: false,
    });

    setup('/');

    expect(screen.getByText('workspace create')).toBeInTheDocument();
  });

  test('renders workspace fetch error stub when workspaces request fails', () => {
    mocks.useGetProfile.mockReturnValue({
      data: { user: { email: 'maria@example.com' } },
      isLoading: false,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    setup('/ws-1/projects');

    expect(
      screen.getByRole('heading', {
        name: 'Не удалось загрузить пространства',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Обновить' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('protected-shell')).not.toBeInTheDocument();
  });

  test('redirects root route to the first workspace projects page', () => {
    mocks.useGetProfile.mockReturnValue({
      data: { user: { email: 'maria@example.com' } },
      isLoading: false,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ id: 'ws-1', name: 'Workspace One' }],
      },
      isLoading: false,
      isError: false,
    });

    setup('/');

    expect(screen.getByTestId('location')).toHaveTextContent('/ws-1/projects');
    expect(screen.getByTestId('protected-shell')).toHaveTextContent(
      'maria@example.com',
    );
  });

  test('redirects when workspace id in url is invalid', () => {
    mocks.useGetProfile.mockReturnValue({
      data: { user: { email: 'maria@example.com' } },
      isLoading: false,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: {
        workspaces: [
          { id: 'ws-1', name: 'Workspace One' },
          { id: 'ws-2', name: 'Workspace Two' },
        ],
      },
      isLoading: false,
      isError: false,
    });

    setup('/missing/profile');

    expect(screen.getByTestId('location')).toHaveTextContent('/ws-1/projects');
    expect(screen.getByTestId('protected-shell')).toHaveTextContent(
      'maria@example.com',
    );
  });

  test('renders protected shell when workspace id is valid', () => {
    mocks.useGetProfile.mockReturnValue({
      data: { user: { email: 'maria@example.com' } },
      isLoading: false,
      isError: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: {
        workspaces: [{ id: 'ws-1', name: 'Workspace One' }],
      },
      isLoading: false,
      isError: false,
    });

    setup('/ws-1/profile/common');

    expect(screen.getByTestId('protected-shell')).toHaveTextContent(
      'maria@example.com',
    );
  });
});
