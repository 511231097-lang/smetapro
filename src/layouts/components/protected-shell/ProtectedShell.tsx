import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useWorkspace } from '../../../providers/WorkspaceProvider';
import type { AuthSuccessResponse } from '../../../shared/api/generated/schemas';
import { buildRoute, ROUTES } from '../../../shared/constants/routes';
import ProtectedHeader from './ProtectedHeader';
import ProtectedMobileDrawer from './ProtectedMobileDrawer';
import ProtectedSidebar from './ProtectedSidebar';

type ProtectedShellProps = {
  user: AuthSuccessResponse;
};

const FORCED_COLLAPSED_WIDTH = 950;

const ProtectedShell = ({ user }: ProtectedShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const forcedCollapsedQuery = `(max-width: ${FORCED_COLLAPSED_WIDTH}px)`;
  const [mobileMenuOpened, { open: openMobileMenu, close: closeMobileMenu }] =
    useDisclosure(false);
  const [sidebarCollapsed, { toggle: toggleSidebar }] = useDisclosure(false);
  const [forceCollapsed, setForceCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(forcedCollapsedQuery).matches
      : false,
  );
  const effectiveCollapsed = sidebarCollapsed || forceCollapsed;
  const { activeWorkspace, workspaceList, setActiveWorkspaceId } =
    useWorkspace();

  const email = user?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase() || 'U';

  // biome-ignore lint/correctness/useExhaustiveDependencies: location is intentional trigger
  useEffect(() => {
    closeMobileMenu();
  }, [closeMobileMenu, location]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(forcedCollapsedQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setForceCollapsed(event.matches);
    };

    setForceCollapsed(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [forcedCollapsedQuery]);

  return (
    <>
      <AppShell
        header={{ height: 59 }}
        navbar={{
          width: effectiveCollapsed ? 64 : 248,
          breakpoint: 'sm',
          collapsed: { mobile: true, desktop: false },
        }}
      >
        <ProtectedHeader
          email={email}
          initials={initials}
          activeWorkspace={activeWorkspace}
          workspaceList={workspaceList}
          onOpenMobileMenu={openMobileMenu}
          onWorkspaceSelect={setActiveWorkspaceId}
          onGoToProfile={() =>
            navigate(
              buildRoute(ROUTES.PROFILE_COMMON, {
                workspaceId: activeWorkspace?.id ?? '',
              }),
            )
          }
          onLogout={() =>
            navigate(
              buildRoute(ROUTES.LOGOUT, {
                workspaceId: activeWorkspace?.id ?? '',
              }),
            )
          }
        />

        <ProtectedSidebar
          pathname={location.pathname}
          collapsed={effectiveCollapsed}
          lockCollapsed={forceCollapsed}
          onToggleSidebar={toggleSidebar}
        />

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      <ProtectedMobileDrawer
        opened={mobileMenuOpened}
        pathname={location.pathname}
        initials={initials}
        activeWorkspace={activeWorkspace}
        workspaceList={workspaceList}
        onWorkspaceSelect={setActiveWorkspaceId}
        onClose={closeMobileMenu}
      />
    </>
  );
};

export default ProtectedShell;
