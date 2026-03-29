import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, rstest, test } from '@rstest/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = rstest.hoisted(() => ({
  mutateInvite: rstest.fn(),
  navigate: rstest.fn(),
  useGetAuthMe: rstest.fn(),
  useGetInviteToken: rstest.fn(),
  useGetWorkspaces: rstest.fn(),
  useNavigate: rstest.fn(),
  useParams: rstest.fn(),
  usePostInviteToken: rstest.fn(),
}));

rstest.mock('react-router-dom', () => ({
  useNavigate: mocks.useNavigate,
  useParams: mocks.useParams,
}));

rstest.mock(
  '../src/layouts/components/protected-shell/ProtectedHeader',
  () => ({
    __esModule: true,
    default: () => <div data-testid="protected-header" />,
  }),
);

rstest.mock('../src/providers/PrimaryColorProvider', () => ({
  usePrimaryColor: () => ({ primaryColor: 'teal' }),
}));

rstest.mock('../src/shared/api/generated/smetchik', () => ({
  getGetWorkspacesQueryKey: () => ['/api/v1/workspaces'],
  useGetAuthMe: mocks.useGetAuthMe,
  useGetInviteToken: mocks.useGetInviteToken,
  useGetWorkspaces: mocks.useGetWorkspaces,
  usePostInviteToken: mocks.usePostInviteToken,
}));

import InviteAcceptPage from '../src/pages/invite/InviteAcceptPage';

const renderPage = () => {
  render(
    <MantineProvider>
      <InviteAcceptPage />
    </MantineProvider>,
  );
};

describe('InviteAcceptPage', () => {
  beforeEach(() => {
    mocks.mutateInvite.mockReset();
    mocks.navigate.mockReset();
    mocks.useGetAuthMe.mockReset();
    mocks.useGetInviteToken.mockReset();
    mocks.useGetWorkspaces.mockReset();
    mocks.useNavigate.mockReset();
    mocks.useParams.mockReset();
    mocks.usePostInviteToken.mockReset();

    mocks.useNavigate.mockReturnValue(mocks.navigate);
    mocks.useParams.mockReturnValue({ token: 'invite-token' });
    mocks.useGetAuthMe.mockReturnValue({
      data: { user: { id: 'user-1', email: 'ivan@example.com' } },
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: {
        workspaces: [
          {
            created_at: '2024-01-01T00:00:00.000Z',
            created_by: 'user-1',
            id: 'ws-1',
            name: 'Текущее пространство',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
    });
    mocks.useGetInviteToken.mockReturnValue({
      data: {
        invite: {
          member_count: 2,
          workspace_name: 'Команда QA',
        },
      },
      isError: false,
      isLoading: false,
    });
    mocks.usePostInviteToken.mockReturnValue({
      isPending: false,
      mutate: mocks.mutateInvite,
    });
  });

  test('shows invite preview and declines to first workspace projects', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Вас пригласили в пространство' }),
    ).toBeVisible();
    expect(screen.getByText('2 сотрудника')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/ws-1/projects', {
      replace: true,
    });
  });

  test('redirects immediately when invite includes stable workspace_id', async () => {
    mocks.useGetInviteToken.mockReturnValue({
      data: {
        invite: {
          workspace_id: 'ws-invite',
          workspace_name: 'Команда QA',
        },
      },
      isError: false,
      isLoading: false,
    });

    renderPage();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith(
        '/ws-invite/workspace/general',
        {
          replace: true,
        },
      );
    });
  });

  test('shows outdated state and disables fallback button while workspace list is loading', () => {
    mocks.useGetInviteToken.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    });
    mocks.useGetWorkspaces.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Ссылка-приглашение устарела' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Хорошо' })).toBeDisabled();
  });
});
