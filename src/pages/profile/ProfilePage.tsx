import { Breadcrumbs, Stack, Title, Text, Tabs } from "@mantine/core";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../../shared/constants/routes";

const ProfilePage = () => {
  const location = useLocation();
  const activeTab =
    location.pathname === ROUTES.PROFILE_SESSIONS ? "sessions" : "common";

  return (
    <Stack gap="lg">
      <Title order={2}>Настройки профиля</Title>
      <Breadcrumbs>
        <Text component={Link} to={ROUTES.ROOT}>
          Главная
        </Text>
        <Text
          c={location.pathname.startsWith(ROUTES.PROFILE) ? "dimmed" : undefined}
          component={Link}
          to={ROUTES.PROFILE_COMMON}
        >
          Профиль
        </Text>
      </Breadcrumbs>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="common"
            component={Link}
            to={ROUTES.PROFILE_COMMON}
            // leftSection={<IconPhoto size={12} />}
          >
            Профиль
          </Tabs.Tab>
          <Tabs.Tab
            value="sessions"
            component={Link}
            to={ROUTES.PROFILE_SESSIONS}
            // leftSection={<IconMessageCircle size={12} />}
          >
            Сессии
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Outlet />
    </Stack>
  );
};

export default ProfilePage;
