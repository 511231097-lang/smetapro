import { Center, Loader, Stack } from "@mantine/core";
import { Navigate, Outlet } from "react-router-dom";
import { useGetApiV1AuthMe } from "../shared/api/generated/smetchik";
import { ROUTES } from "../shared/constants/routes";

const RequireGuest = () => {
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

  if (!isError && user) {
    return <Navigate to={ROUTES.PROJECTS} replace />;
  }

  return <Outlet />;
};

export default RequireGuest;
