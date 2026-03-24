import { Box, Stack, Title } from "@mantine/core";
import { IconBriefcase, IconId, IconUsers } from "@tabler/icons-react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { Tabs } from "../../shared/components/Tabs";
import { ROUTES, buildRoute } from "../../shared/constants/routes";

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const location = useLocation();

  const profilePath = buildRoute(ROUTES.WORKSPACE_GENERAL, {
    workspaceId: workspaceId ?? "",
  });
  const membersPath = buildRoute(ROUTES.WORKSPACE_MEMBERS, {
    workspaceId: workspaceId ?? "",
  });

  const rolesPath = buildRoute(ROUTES.WORKSPACE_ROLES, {
    workspaceId: workspaceId ?? "",
  });

  const activeTab =
    location.pathname === membersPath
      ? "members"
      : location.pathname.startsWith(rolesPath)
        ? "roles"
        : "profile";

  return (
    <Stack gap="lg" p={20}>
      <Title order={2}>Настройки пространства</Title>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="profile"
            component={Link}
            to={profilePath}
            leftSection={<IconId size={12} />}
          >
            Основное
          </Tabs.Tab>
          <Tabs.Tab
            value="members"
            component={Link}
            to={membersPath}
            leftSection={<IconUsers size={12} />}
          >
            Сотрудники
          </Tabs.Tab>

          <Tabs.Tab
            value="roles"
            component={Link}
            to={rolesPath}
            leftSection={<IconBriefcase size={12} />}
          >
            Роли
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Box pt={4}>
        <Outlet />
      </Box>
    </Stack>
  );
};

export default WorkspacePage;
