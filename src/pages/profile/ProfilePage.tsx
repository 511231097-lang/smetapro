import { Box, Stack, Title } from '@mantine/core';
import { IconBrush, IconUser } from '@tabler/icons-react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { Tabs } from '../../shared/components/Tabs';
import { buildRoute, ROUTES } from '../../shared/constants/routes';

const ProfilePage = () => {
  const location = useLocation();
  const { workspaceId } = useParams();

  const commonPath = buildRoute(ROUTES.PROFILE_COMMON, {
    workspaceId: workspaceId ?? '',
  });
  const appearancePath = buildRoute(ROUTES.PROFILE_APPEARANCE, {
    workspaceId: workspaceId ?? '',
  });

  const activeTab =
    location.pathname === appearancePath ? 'appearance' : 'common';

  return (
    <Stack gap="lg" p={20}>
      <Title order={2}>Профиль</Title>

      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab
            value="common"
            component={Link}
            to={commonPath}
            leftSection={<IconUser size={14} />}
          >
            Личные данные
          </Tabs.Tab>
          <Tabs.Tab
            value="appearance"
            component={Link}
            to={appearancePath}
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
