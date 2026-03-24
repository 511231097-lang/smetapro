import { Box, Stack, Title } from "@mantine/core";
import { IconBrush, IconUser } from "@tabler/icons-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Tabs } from "../../shared/components/Tabs";
import { ROUTES } from "../../shared/constants/routes";

const ProfilePage = () => {
  const location = useLocation();

  const activeTab = location.pathname.includes("/appearance")
    ? "appearance"
    : "common";

  return (
    <Stack gap="lg" p={20}>
      <Title order={2}>Профиль</Title>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="common"
            component={Link}
            to={ROUTES.PROFILE_COMMON}
            leftSection={<IconUser size={14} />}
          >
            Личные данные
          </Tabs.Tab>
          <Tabs.Tab
            value="appearance"
            component={Link}
            to={ROUTES.PROFILE_APPEARANCE}
            leftSection={<IconBrush size={14} />}
          >
            Оформление
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Box pt={4}>
        <Outlet />
      </Box>
    </Stack>
  );
};

export default ProfilePage;
