import {
  AppShell,
  Avatar,
  Center,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  UnstyledButton,
  NavLink,
  ActionIcon,
  Burger,
  Box,
} from "@mantine/core";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  useGetApiV1AuthMe,
  useGetApiV1Workspaces,
} from "../shared/api/generated/smetchik";
import type { User } from "../shared/api/generated/schemas";
import { getInitials } from "../shared/utils/getInitials";
import { ROUTES } from "../shared/constants/routes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01FreeIcons,
  Coins01Icon,
  Home01FreeIcons,
} from "@hugeicons/core-free-icons";
import { useEffect, useMemo } from "react";
import { useDisclosure } from "@mantine/hooks";
import { WorkspaceProvider, useWorkspace } from "../providers/WorkspaceProvider";

type ProtectedShellProps = {
  user: User;
};

const ProtectedShell = ({ user }: ProtectedShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle, close }] = useDisclosure();
  const { activeWorkspace, workspaceList, setActiveWorkspaceId } =
    useWorkspace();

  const initials = getInitials(user?.name, user?.surname);
  const fullName = [user?.name, user?.surname].filter(Boolean).join(" ");
  const isAdmin = user?.roles?.includes("admin");

  useEffect(() => {
    close();
  }, [close, location.pathname]);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      layout="alt"
    >
      <AppShell.Header className="dashboard-header">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />

            <UnstyledButton
              component={Link}
              to={ROUTES.WORKSPACE_PROFILE.replace(
                ":workspaceId",
                activeWorkspace?.id ?? "",
              )}
            >
              {activeWorkspace?.name ?? "Пространство"}
            </UnstyledButton>

            <Menu
              position="bottom-end"
              width={200}
              withinPortal
              offset={{ crossAxis: 20 }}
            >
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" aria-label="Settings">
                  <HugeiconsIcon icon={ArrowDown01FreeIcons} size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Выберите пространство</Menu.Label>
                {workspaceList.map((workspace) => (
                  <Menu.Item
                    key={workspace.id}
                    onClick={() => setActiveWorkspaceId(workspace.id ?? null)}
                  >
                    {workspace.name}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Menu position="bottom-end" width={200} withinPortal>
            <Menu.Target>
              <UnstyledButton aria-label="Открыть профиль">
                <Avatar radius="xl" color="teal" variant="light">
                  {initials}
                </Avatar>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{fullName || "Профиль"}</Menu.Label>
              <Menu.Item onClick={() => navigate(ROUTES.PROFILE_COMMON)}>
                Профиль
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                onClick={() => {
                  navigate(ROUTES.LOGOUT);
                }}
              >
                Выйти
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="dashboard-navbar" p="md">
        <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Stack gap="sm">
            <Group justify="flex-end">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="md" />
            </Group>

            <NavLink
              component={Link}
              to={ROUTES.PROJECTS}
              label={
                <Group>
                  <HugeiconsIcon icon={Home01FreeIcons} size={18} />
                  <Text>Проекты</Text>
                </Group>
              }
              active={location.pathname.startsWith(ROUTES.PROJECTS)}
            />
            <NavLink
              component={Link}
              to={ROUTES.FINANCES}
              label={
                <Group>
                  <HugeiconsIcon icon={Coins01Icon} size={18} />
                  <Text>Финансы</Text>
                </Group>
              }
              active={location.pathname === ROUTES.FINANCES}
            />
          </Stack>

          {isAdmin && (
            <Box mt="auto">
              <NavLink
                component={Link}
                to={ROUTES.ADMIN_USERS}
                label={
                  <Group>
                    <Text>Админка</Text>
                  </Group>
                }
                active={location.pathname.startsWith(ROUTES.ADMIN_ROOT)}
              />
            </Box>
          )}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main className="dashboard-main">
        <div className="dashboard-content">
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

const ProtectedLayout = () => {
  const location = useLocation();
  const { data: user, isLoading, isError } = useGetApiV1AuthMe({});
  const {
    data: workspaces,
    isLoading: isWorkspacesLoading,
    isError: isWorkspacesError,
  } = useGetApiV1Workspaces(undefined, {
    query: {
      enabled: !!user,
    },
  });
  const workspaceList = useMemo(
    () => workspaces?.workspaces ?? [],
    [workspaces],
  );

  if (isLoading || (user && isWorkspacesLoading)) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="xs">
          <Loader />
        </Stack>
      </Center>
    );
  }

  if (isError || !user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!isWorkspacesError && workspaceList.length === 0) {
    return <Navigate to={ROUTES.WORKSPACE_CREATE} replace />;
  }

  return (
    <WorkspaceProvider workspaces={workspaceList}>
      <ProtectedShell user={user} />
    </WorkspaceProvider>
  );
};

export default ProtectedLayout;
