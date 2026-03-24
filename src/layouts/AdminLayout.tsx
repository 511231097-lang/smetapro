import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Center,
  Group,
  Loader,
  Menu,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { usePrimaryColor } from "../providers/PrimaryColorProvider";
import { useGetAuthMe } from "../shared/api/generated/smetchik";
import { ROUTES } from "../shared/constants/routes";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();
  const [opened, { toggle, close }] = useDisclosure();
  const { data: userResp, isLoading, isError } = useGetAuthMe({});
  const user = userResp?.user;

  useEffect(() => {
    close();
  }, [close, location.pathname]);

  if (isLoading) {
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

  if (!user.roles?.includes("admin")) {
    return <Navigate to={ROUTES.PROJECTS} replace />;
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "U";
  const fullName = user?.email ?? "";

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
            <Title order={4}>Админка</Title>
          </Group>
          <Menu position="bottom-end" width={200} withinPortal>
            <Menu.Target>
              <UnstyledButton aria-label="Открыть профиль">
                <Avatar radius="xl" color={primaryColor} variant="light">
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
              <Menu.Item color="red" onClick={() => navigate(ROUTES.LOGOUT)}>
                Выйти
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="dashboard-navbar" p="md">
        <Box
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Stack gap="sm">
            <Group justify="flex-end">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="md"
              />
            </Group>

            <NavLink
              component={Link}
              to={ROUTES.ADMIN_USERS}
              label={<Text>Пользователи</Text>}
              active={location.pathname.startsWith(ROUTES.ADMIN_USERS)}
            />
            <NavLink
              component={Link}
              to={ROUTES.ADMIN_WORKSPACES}
              label={<Text>Пространства</Text>}
              active={location.pathname.startsWith(ROUTES.ADMIN_WORKSPACES)}
            />
          </Stack>

          <Box mt="auto">
            <NavLink
              component={Link}
              to={ROUTES.PROJECTS}
              label={<Text>Вернуться в приложение</Text>}
              active={location.pathname.startsWith(ROUTES.PROJECTS)}
            />
          </Box>
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

export default AdminLayout;
