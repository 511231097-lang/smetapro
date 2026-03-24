import { Center, Loader, Stack } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useGetAuthMe } from '../shared/api/generated/smetchik';

const RequireGuest = () => {
  const { isLoading } = useGetAuthMe({});

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="xs">
          <Loader />
        </Stack>
      </Center>
    );
  }

  // if (!isError && user) {
  //   return <Navigate to={ROUTES.PROJECTS} replace />;
  // }

  return <Outlet />;
};

export default RequireGuest;
