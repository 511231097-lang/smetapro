import { Button, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { WorkspaceProvider } from '../providers/WorkspaceProvider';
import {
  useGetProfile,
  useGetWorkspaces,
} from '../shared/api/generated/smetchik';
import { buildRoute, ROUTES } from '../shared/constants/routes';
import ProtectedShell from './components/protected-shell/ProtectedShell';

const ProtectedLayout = () => {
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: profile, isLoading, isError } = useGetProfile({});
  const user = profile?.user;
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

  if (isWorkspacesError) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Title order={3}>Не удалось загрузить пространства</Title>
          <Text c="dimmed" ta="center">
            Ошибка загрузки списка пространств. Попробуйте обновить страницу.
          </Text>
          <Button onClick={() => window.location.reload()}>Обновить</Button>
        </Stack>
      </Center>
    );
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
