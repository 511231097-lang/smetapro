import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostApiV1AuthLogout } from "../../shared/api/generated/smetchik";
import { Center, Loader, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../shared/constants/routes";

const LogoutPage = () => {
  const { mutateAsync } = usePostApiV1AuthLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) {
      return;
    }

    ref.current = true;
    mutateAsync()
      .catch(() => undefined)
      .finally(() => {
        queryClient.clear();
        navigate(ROUTES.LOGIN, { replace: true });
      });
  }, [mutateAsync, navigate, queryClient]);

  return (
    <Center h="100vh">
      <Stack align="center" gap="xs">
        <Loader />
      </Stack>
    </Center>
  );
};

export default LogoutPage;
