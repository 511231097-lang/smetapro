import {
  AppShell,
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { wsInitials } from '../../layouts/components/protected-shell/constants';
import ProtectedHeader from '../../layouts/components/protected-shell/ProtectedHeader';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type { WorkspacesListResponse } from '../../shared/api/generated/schemas/workspacesListResponse';
import {
  getGetWorkspacesQueryKey,
  useGetInviteToken,
  useGetProfile,
  useGetWorkspaces,
  usePostInviteToken,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { buildRoute, ROUTES } from '../../shared/constants/routes';

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось вступить в пространство';
  }
  return 'Не удалось вступить в пространство';
};

const getInviteWorkspaceId = (invite: unknown): string | null => {
  if (!invite || typeof invite !== 'object') return null;

  const workspaceId = (invite as { workspace_id?: unknown }).workspace_id;
  if (typeof workspaceId !== 'string') return null;

  const normalizedWorkspaceId = workspaceId.trim();
  return normalizedWorkspaceId.length > 0 ? normalizedWorkspaceId : null;
};

const formatMembersLabel = (count?: number) => {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;

  const value = Math.max(0, Math.trunc(count));
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} сотрудник`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} сотрудника`;
  }

  return `${value} сотрудников`;
};

const InviteAcceptPage = () => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  const { data: userData } = useGetProfile({});
  const { data: workspacesData, isLoading: isWorkspacesLoading } =
    useGetWorkspaces(undefined, {
      query: { enabled: !!userData },
    });
  const workspaceList = workspacesData?.workspaces ?? [];

  const {
    data: inviteData,
    isLoading,
    isError,
  } = useGetInviteToken(token, {
    query: { enabled: !!token, retry: false },
  });

  const { mutate: join, isPending: isJoining } = usePostInviteToken({
    mutation: {
      onSuccess: (data) => {
        const workspaceId = data.member?.workspace_id;

        if (workspaceId) {
          const listKey = getGetWorkspacesQueryKey();
          queryClient.setQueryData<WorkspacesListResponse | undefined>(
            listKey,
            (current) => {
              if (!current) return current;
              if (current.workspaces?.some((item) => item.id === workspaceId)) {
                return current;
              }

              const now = new Date().toISOString();
              const workspaceNameForCache =
                invite?.workspace_name ?? 'Приглашенное пространство';

              return {
                ...current,
                total:
                  typeof current.total === 'number'
                    ? current.total + 1
                    : current.total,
                workspaces: [
                  {
                    created_at: now,
                    created_by: userData?.user?.id,
                    id: workspaceId,
                    name: workspaceNameForCache,
                    updated_at: now,
                  },
                  ...(current.workspaces ?? []),
                ],
              };
            },
          );

          navigate(buildRoute(ROUTES.WORKSPACE_GENERAL, { workspaceId }), {
            replace: true,
          });
          return;
        }

        navigate(resolveFallbackRoute(), { replace: true });
      },
      onError: (error) => {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(error),
        });
      },
    },
  });

  const invite = inviteData?.invite;
  const workspaceName = invite?.workspace_name ?? '—';
  const membersLabel = useMemo(
    () => formatMembersLabel(invite?.member_count),
    [invite?.member_count],
  );
  const existingWorkspaceId = useMemo(
    () => getInviteWorkspaceId(invite),
    [invite],
  );

  const email = userData?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase() || 'U';
  const isFallbackRouteLoading =
    Boolean(userData) && isWorkspacesLoading && workspaceList.length === 0;

  const resolveFallbackWorkspaceId = () => {
    const queryWorkspaces =
      queryClient.getQueryData<WorkspacesListResponse | undefined>(
        getGetWorkspacesQueryKey(),
      )?.workspaces ?? [];

    return queryWorkspaces[0]?.id ?? workspaceList[0]?.id ?? null;
  };

  const resolveFallbackRoute = () => {
    const workspaceId = resolveFallbackWorkspaceId();
    return workspaceId
      ? buildRoute(ROUTES.PROJECTS, { workspaceId })
      : ROUTES.ROOT;
  };

  const navigateToFallbackRoute = () =>
    navigate(resolveFallbackRoute(), { replace: true });

  const handleGoToProfile = () => {
    const workspaceId = resolveFallbackWorkspaceId();
    if (!workspaceId) {
      navigate(ROUTES.ROOT);
      return;
    }

    navigate(buildRoute(ROUTES.PROFILE_COMMON, { workspaceId }));
  };

  const handleLogout = () => {
    const workspaceId = resolveFallbackWorkspaceId();
    if (!workspaceId) {
      navigate(ROUTES.ROOT);
      return;
    }

    navigate(buildRoute(ROUTES.LOGOUT, { workspaceId }));
  };

  const workspacePanelBackground = isDark ? '#3b414b' : '#f1f3f5';
  const workspaceNameColor = isDark ? '#f8f9fa' : '#000000';
  const workspaceMembersColor = isDark ? '#adb5bd' : '#868e96';

  useEffect(() => {
    if (!existingWorkspaceId) return;
    if (isLoading) return;

    navigate(
      buildRoute(ROUTES.WORKSPACE_GENERAL, {
        workspaceId: existingWorkspaceId,
      }),
      { replace: true },
    );
  }, [existingWorkspaceId, isLoading, navigate]);

  return (
    <AppShell header={{ height: 59 }}>
      <ProtectedHeader
        email={email}
        initials={initials}
        activeWorkspace={workspaceList[0]}
        workspaceList={workspaceList}
        onOpenMobileMenu={() => {}}
        onWorkspaceSelect={() => {}}
        onGoToProfile={handleGoToProfile}
        onLogout={handleLogout}
        hideWorkspaceMenu
        hideMobileMenuButton
      />

      <AppShell.Main
        style={{
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <Center
          style={{
            minHeight: 'calc(100vh - 59px)',
            padding:
              'var(--mantine-spacing-xl) var(--mantine-spacing-md) var(--mantine-spacing-md)',
          }}
        >
          <Card
            withBorder
            radius="md"
            style={{ width: '100%', maxWidth: 528 }}
            padding={0}
          >
            {isLoading && (
              <Center p={48}>
                <Loader />
              </Center>
            )}

            {!isLoading && isError && (
              <Box p={16}>
                <Stack gap={16}>
                  <Title
                    order={3}
                    style={{
                      fontSize: 24,
                      lineHeight: '32px',
                      fontWeight: 700,
                    }}
                  >
                    Ссылка-приглашение устарела
                  </Title>

                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      fontWeight: 400,
                    }}
                  >
                    Ссылка-приглашение в компанию устарела. Запросите у
                    администратора компании новую ссылку-приглашение.
                  </Text>

                  <Group justify="flex-end">
                    <Button
                      variant="default"
                      radius={4}
                      style={{ height: 32, minWidth: 120 }}
                      styles={{
                        label: {
                          fontSize: 14,
                          lineHeight: '20px',
                          fontWeight: 400,
                        },
                      }}
                      disabled={isFallbackRouteLoading}
                      onClick={navigateToFallbackRoute}
                    >
                      Хорошо
                    </Button>
                  </Group>
                </Stack>
              </Box>
            )}

            {!isLoading && !isError && invite && !existingWorkspaceId && (
              <Stack gap={16} p={16}>
                <Title
                  order={3}
                  style={{ fontSize: 24, lineHeight: '32px', fontWeight: 700 }}
                >
                  Вас пригласили в пространство
                </Title>

                <Box
                  style={{
                    backgroundColor: workspacePanelBackground,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap={12}>
                    <Group wrap="nowrap" gap={16}>
                      <Avatar
                        size={40}
                        radius={8}
                        color={primaryColor}
                        variant="filled"
                        style={{ fontSize: 16, fontWeight: 700 }}
                      >
                        {wsInitials(workspaceName)}
                      </Avatar>
                      <Text
                        style={{
                          fontSize: 20,
                          lineHeight: '24px',
                          fontWeight: 700,
                          color: workspaceNameColor,
                        }}
                        truncate
                      >
                        {workspaceName}
                      </Text>
                    </Group>

                    {membersLabel && (
                      <Text
                        style={{
                          fontSize: 12,
                          lineHeight: '16px',
                          fontWeight: 700,
                          color: workspaceMembersColor,
                        }}
                        ta="right"
                      >
                        {membersLabel}
                      </Text>
                    )}
                  </Group>
                </Box>

                <Text
                  ta="center"
                  style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400 }}
                >
                  Подтвердите приглашение в пространство «{workspaceName}» или
                  {'\u00A0'}отклоните его.
                </Text>

                <Group grow wrap="nowrap" gap={16}>
                  <Button
                    variant="default"
                    radius={4}
                    style={{ height: 32 }}
                    styles={{
                      label: {
                        fontSize: 14,
                        lineHeight: '20px',
                        fontWeight: 400,
                      },
                    }}
                    disabled={isFallbackRouteLoading}
                    onClick={navigateToFallbackRoute}
                  >
                    Отклонить
                  </Button>

                  <Button
                    color={primaryColor}
                    radius={4}
                    style={{ height: 32 }}
                    leftSection={<IconCheck size={16} stroke={2} />}
                    styles={{
                      label: {
                        fontSize: 14,
                        lineHeight: '20px',
                        fontWeight: 400,
                      },
                    }}
                    loading={isJoining}
                    onClick={() => join({ token })}
                  >
                    Принять приглашение
                  </Button>
                </Group>
              </Stack>
            )}
          </Card>
        </Center>
      </AppShell.Main>
    </AppShell>
  );
};

export default InviteAcceptPage;
