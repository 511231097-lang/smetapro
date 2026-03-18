import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { postAuthRefresh } from "../shared/api/generated/smetchik";
import { setAuthHandlers } from "../shared/api/httpClient";
import { ROUTES } from "../shared/constants/routes";

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handlers = useMemo(
    () => ({
      refresh: async () => {
        await postAuthRefresh();
      },
      logout: () => {
        queryClient.clear();
        navigate(ROUTES.LOGIN, { replace: true });
      },
    }),
    [navigate, queryClient],
  );

  setAuthHandlers(handlers);

  return children;
};

export default AuthProvider;
