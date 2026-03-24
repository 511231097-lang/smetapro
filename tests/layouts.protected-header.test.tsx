import { AppShell, MantineProvider } from '@mantine/core';
import { describe, expect, rstest, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { WorkspacesWorkspaceResponse } from '../src/shared/api/generated/schemas';

rstest.mock('../src/layouts/components/protected-shell/WorkspaceMenu', () => ({
  default: () => <div data-testid="workspace-menu" />,
}));

import ProtectedHeader from '../src/layouts/components/protected-shell/ProtectedHeader';

const renderHeader = (activeWorkspace?: WorkspacesWorkspaceResponse) => {
  render(
    <MantineProvider>
      <MemoryRouter>
        <AppShell header={{ height: 59 }}>
          <ProtectedHeader
            email="maria@example.com"
            initials="MP"
            activeWorkspace={activeWorkspace}
            workspaceList={activeWorkspace ? [activeWorkspace] : []}
            onOpenMobileMenu={() => {}}
            onWorkspaceSelect={() => {}}
            onGoToProfile={() => {}}
            onLogout={() => {}}
          />
          <AppShell.Main />
        </AppShell>
      </MemoryRouter>
    </MantineProvider>,
  );
};

describe('ProtectedHeader', () => {
  test('logo link points to active workspace projects route', () => {
    renderHeader({
      id: 'ws-1',
      name: 'Workspace One',
    });

    expect(screen.getByRole('link', { name: 'СМЕТЧИК ПРО' })).toHaveAttribute(
      'href',
      '/ws-1/projects',
    );
  });

  test('logo link falls back to root when active workspace is missing', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'СМЕТЧИК ПРО' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
