import { describe, expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import {
  useWorkspace,
  WorkspaceProvider,
} from '../src/providers/WorkspaceProvider';
import type { WorkspacesWorkspaceResponse } from '../src/shared/api/generated/schemas';

const workspaces: WorkspacesWorkspaceResponse[] = [
  { id: 'ws-1', name: 'Workspace One' },
  { id: 'ws-2', name: 'Workspace Two' },
];

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const WorkspaceConsumer = () => {
  const { activeWorkspace, activeWorkspaceId, setActiveWorkspaceId } =
    useWorkspace();

  return (
    <div>
      <div data-testid="active-id">{activeWorkspaceId ?? 'none'}</div>
      <div data-testid="active-workspace-id">
        {activeWorkspace?.id ?? 'none'}
      </div>
      <button type="button" onClick={() => setActiveWorkspaceId('ws-2')}>
        switch workspace
      </button>
      <button type="button" onClick={() => setActiveWorkspaceId(null)}>
        clear workspace
      </button>
    </div>
  );
};

describe('WorkspaceProvider', () => {
  test('throws when useWorkspace is used outside provider', () => {
    const BrokenConsumer = () => {
      useWorkspace();
      return null;
    };

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useWorkspace must be used within WorkspaceProvider',
    );
  });

  test('switches workspace and preserves sub-path in url', () => {
    render(
      <MemoryRouter initialEntries={['/ws-1/profile/common']}>
        <Routes>
          <Route
            path="/:workspaceId/*"
            element={
              <WorkspaceProvider
                workspaces={workspaces}
                activeWorkspaceId="ws-1"
              >
                <WorkspaceConsumer />
                <LocationProbe />
              </WorkspaceProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('active-id')).toHaveTextContent('ws-1');
    expect(screen.getByTestId('active-workspace-id')).toHaveTextContent('ws-1');

    fireEvent.click(screen.getByRole('button', { name: 'switch workspace' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/ws-2/profile/common',
    );
  });

  test('falls back to first workspace when active id is invalid', () => {
    render(
      <MemoryRouter initialEntries={['/missing/projects']}>
        <Routes>
          <Route
            path="/:workspaceId/*"
            element={
              <WorkspaceProvider
                workspaces={workspaces}
                activeWorkspaceId="missing"
              >
                <WorkspaceConsumer />
              </WorkspaceProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('active-workspace-id')).toHaveTextContent('ws-1');
  });

  test('returns undefined active workspace when list is empty', () => {
    render(
      <MemoryRouter initialEntries={['/ws-1/projects']}>
        <Routes>
          <Route
            path="/:workspaceId/*"
            element={
              <WorkspaceProvider workspaces={[]} activeWorkspaceId="ws-1">
                <WorkspaceConsumer />
              </WorkspaceProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('active-workspace-id')).toHaveTextContent('none');
  });

  test('ignores null workspace id switch', () => {
    render(
      <MemoryRouter initialEntries={['/ws-1/projects']}>
        <Routes>
          <Route
            path="/:workspaceId/*"
            element={
              <WorkspaceProvider
                workspaces={workspaces}
                activeWorkspaceId="ws-1"
              >
                <WorkspaceConsumer />
                <LocationProbe />
              </WorkspaceProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'clear workspace' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/ws-1/projects');
  });
});
