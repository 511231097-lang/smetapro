import { Center, Loader, Stack } from '@mantine/core';
import { useMemo } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { WorkspaceProvider } from '../providers/WorkspaceProvider';
import {
  useGetAuthMe,
  useGetWorkspaces,
} from '../shared/api/generated/smetchik';
import { ROUTES, buildRoute } from '../shared/constants/routes';
import ProtectedShell from './components/protected-shell/ProtectedShell';

const ProtectedLayout = () => {
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: user, isLoading, isError } = useGetAuthMe({});
  const {
    data: workspaces,
    isLoading: isWorkspacesLoading,
    isError: isWorkspacesError,
  } = useGetWorkspaces(undefined, {
    query: {
      enabled: !!user,
    },
  });
  const workspaceList = useMemo(
    () => workspaces?.workspaces ?? [],
    [workspaces],
  );

  if (isLoading || (user && isWorkspacesLoading)) {
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

  if (!isWorkspacesError && workspaceList.length === 0) {
    return <Navigate to={ROUTES.WORKSPACE_CREATE} replace />;
  }

  // Нет workspaceId в URL (например, открыт "/") — редирект на первый воркспейс
  if (!workspaceId && workspaceList.length > 0) {
    return (
      <Navigate
        to={buildRoute(ROUTES.PROJECTS, {
          workspaceId: workspaceList[0].id ?? '',
        })}
        replace
      />
    );
  }

  // workspaceId не найден в списке — редирект на первый воркспейс
  if (workspaceId && workspaceList.length > 0) {
    const validWorkspace = workspaceList.find((w) => w.id === workspaceId);
    if (!validWorkspace) {
      return (
        <Navigate
          to={buildRoute(ROUTES.PROJECTS, {
            workspaceId: workspaceList[0].id ?? '',
          })}
          replace
        />
      );
    }
  }

  return (
    <WorkspaceProvider
      workspaces={workspaceList}
      activeWorkspaceId={workspaceId ?? null}
    >
      <ProtectedShell user={user} />
    </WorkspaceProvider>
  );
};

export default ProtectedLayout;
