import { Breadcrumbs, Stack, Tabs, Text, Title } from "@mantine/core";
import {
  Link,
  Outlet,
  useLocation,
  useParams,
  // useParams
} from "react-router-dom";
import { ROUTES } from "../../shared/constants/routes";

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const profilePath = ROUTES.WORKSPACE_PROFILE.replace(
    ":workspaceId",
    workspaceId ?? "",
  );
  const membersPath = ROUTES.WORKSPACE_MEMBERS.replace(
    ":workspaceId",
    workspaceId ?? "",
  );
  const activeTab = location.pathname === membersPath ? "members" : "profile";

  return (
    <Stack gap="lg">
      <Title order={2}>Настройки пространства</Title>

      <Breadcrumbs>
        <Text component={Link} to={ROUTES.PROJECTS}>
          Проекты
        </Text>
        <Text
          c={location.pathname.startsWith("/workspace") ? "dimmed" : undefined}
          component={Link}
          to={profilePath}
        >
          Пространства
        </Text>
      </Breadcrumbs>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="profile"
            component={Link}
            to={profilePath}
            // leftSection={<IconPhoto size={12} />}
          >
            Профиль
          </Tabs.Tab>
          <Tabs.Tab
            value="members"
            component={Link}
            to={membersPath}
            // leftSection={<IconMessageCircle size={12} />}
          >
            Сотрудники
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Outlet />
    </Stack>
  );
};

export default WorkspacePage;
