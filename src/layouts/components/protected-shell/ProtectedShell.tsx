import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useWorkspace } from "../../../providers/WorkspaceProvider";
import type { AuthSuccessResponse } from "../../../shared/api/generated/schemas";
import { ROUTES, buildRoute } from "../../../shared/constants/routes";
import ProtectedHeader from "./ProtectedHeader";
import ProtectedMobileDrawer from "./ProtectedMobileDrawer";
import ProtectedSidebar from "./ProtectedSidebar";

type ProtectedShellProps = {
  user: AuthSuccessResponse;
};

const ProtectedShell = ({ user }: ProtectedShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpened, { open: openMobileMenu, close: closeMobileMenu }] =
    useDisclosure(false);
  const [sidebarCollapsed, { toggle: toggleSidebar }] = useDisclosure(false);
  const [searchOpen, { toggle: toggleSearch, close: closeSearch }] =
    useDisclosure(false);
  const { activeWorkspace, workspaceList, setActiveWorkspaceId } =
    useWorkspace();

  const email = user?.user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "U";

  // biome-ignore lint/correctness/useExhaustiveDependencies: location is intentional trigger
  useEffect(() => {
    closeMobileMenu();
  }, [closeMobileMenu, location]);

  return (
    <>
      <AppShell
        header={{ height: 59 }}
        navbar={{
          width: sidebarCollapsed ? 64 : 248,
          breakpoint: "sm",
          collapsed: { mobile: true, desktop: false },
        }}
      >
        <ProtectedHeader
          email={email}
          initials={initials}
          searchOpen={searchOpen}
          activeWorkspace={activeWorkspace}
          workspaceList={workspaceList}
          onOpenMobileMenu={openMobileMenu}
          onToggleSearch={toggleSearch}
          onCloseSearch={closeSearch}
          onWorkspaceSelect={setActiveWorkspaceId}
          onGoToProfile={() =>
            navigate(
              buildRoute(ROUTES.PROFILE_COMMON, {
                workspaceId: activeWorkspace?.id ?? "",
              }),
            )
          }
          onLogout={() =>
            navigate(
              buildRoute(ROUTES.LOGOUT, {
                workspaceId: activeWorkspace?.id ?? "",
              }),
            )
          }
        />

        <ProtectedSidebar
          pathname={location.pathname}
          collapsed={sidebarCollapsed}
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
