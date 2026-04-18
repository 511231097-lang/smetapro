import { Center, Loader, Stack } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGetProfile } from '../shared/api/generated/smetchik';
import { ROUTES } from '../shared/constants/routes';

const RequireAuth = () => {
  const location = useLocation();
  const { data: profile, isLoading, isError } = useGetProfile({});

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="xs">
          <Loader />
        </Stack>
      </Center>
    );
  }

  if (isError || !profile?.user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
