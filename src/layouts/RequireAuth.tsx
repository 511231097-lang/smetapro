import { Center, Loader, Stack } from "@mantine/core";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useGetApiV1AuthMe } from "../shared/api/generated/smetchik";
import { ROUTES } from "../shared/constants/routes";

const RequireAuth = () => {
  const location = useLocation();
  const { data: user, isLoading, isError } = useGetApiV1AuthMe({});

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

  return <Outlet />;
};

export default RequireAuth;
