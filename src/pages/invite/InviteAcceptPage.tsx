import {
  Avatar,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { wsInitials } from '../../layouts/components/protected-shell/constants';
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
  const location = useLocation();
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();
  const inviteRouteState = location.state as {
    autoAcceptInvite?: boolean;
  } | null;

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
  const [autoJoinMode, setAutoJoinMode] = useState<
    'off' | 'queued' | 'running' | 'failed'
  >(() => (inviteRouteState?.autoAcceptInvite ? 'queued' : 'off'));

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
                    logo_url: invite?.logo_url,
                    members_count: invite?.member_count,
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
        setAutoJoinMode((current) =>
          current === 'running' ? 'failed' : current,
        );
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(error),
        });
      },
    },
  });

  const invite = inviteData?.invite;
  const isAuthenticated = Boolean(userData?.user);
  const workspaceName = invite?.workspace_name ?? '—';
  const membersLabel = useMemo(
    () => formatMembersLabel(invite?.member_count),
    [invite?.member_count],
  );
  const existingWorkspaceId = useMemo(
    () => getInviteWorkspaceId(invite),
    [invite],
  );

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

  const workspacePanelBackground = 'var(--mantine-color-gray-1)';
  const cardBackground = 'var(--mantine-color-white)';
  const titleColor = 'var(--mantine-color-black)';
  const textColor = 'var(--mantine-color-gray-9)';
  const workspaceNameColor = 'var(--mantine-color-black)';
  const workspaceMembersColor = 'var(--mantine-color-dimmed)';

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

  useEffect(() => {
    if (autoJoinMode !== 'queued') return;
    if (!isAuthenticated || !invite || !token) return;
    if (isLoading || existingWorkspaceId) return;

    setAutoJoinMode('running');
    join({ token });
  }, [
    autoJoinMode,
    existingWorkspaceId,
    invite,
    isAuthenticated,
    isLoading,
    join,
    token,
  ]);

  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-body)',
        minHeight: '100vh',
      }}
    >
      <Center
        style={{
          minHeight: '100vh',
          padding:
            'var(--mantine-spacing-xl) var(--mantine-spacing-md) var(--mantine-spacing-md)',
        }}
      >
        <Paper
          radius="md"
          p={0}
          style={{
            background: cardBackground,
            maxWidth: 528,
            width: '100%',
          }}
        >
          {isLoading && (
            <Center p={48}>
              <Loader />
            </Center>
          )}

          {!isLoading && isError && (
            <Box p={32}>
              <Stack gap={16}>
                <Title
                  order={3}
                  style={{
                    color: titleColor,
                    fontSize: 24,
                    lineHeight: '32px',
                    fontWeight: 700,
                  }}
                >
                  Ссылка-приглашение устарела
                </Title>

                <Text
                  style={{
                    color: textColor,
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
            <Stack gap={16} p={32}>
              <Title
                order={3}
                style={{
                  color: titleColor,
                  fontSize: 24,
                  lineHeight: '32px',
                  fontWeight: 700,
                }}
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
                  <Group wrap="nowrap" gap={16} style={{ minWidth: 0 }}>
                    <Avatar
                      size={40}
                      radius={8}
                      color={primaryColor}
                      variant="filled"
                      src={invite.logo_url ?? undefined}
                      style={{ fontSize: 16, fontWeight: 700, flexShrink: 0 }}
                    >
                      {wsInitials(workspaceName)}
                    </Avatar>
                    <Text
                      style={{
                        color: workspaceNameColor,
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: '24px',
                      }}
                      truncate
                    >
                      {workspaceName}
                    </Text>
                  </Group>

                  {membersLabel && (
                    <Text
                      style={{
                        color: workspaceMembersColor,
                        flexShrink: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: '16px',
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
                style={{
                  color: textColor,
                  fontSize: 14,
                  lineHeight: '20px',
                  fontWeight: 400,
                }}
              >
                {isAuthenticated
                  ? `Подтвердите приглашение в пространство «${workspaceName}» или отклоните его.`
                  : `Для того чтобы принять приглашение от «${workspaceName}», вам необходимо войти либо зарегистрироваться в «Сметчик ПРО»`}
              </Text>

              {isAuthenticated && autoJoinMode === 'running' ? (
                <Center py={8}>
                  <Stack gap={12} align="center">
                    <Loader color={primaryColor} size="sm" />
                    <Text
                      ta="center"
                      style={{
                        color: textColor,
                        fontSize: 14,
                        lineHeight: '20px',
                        fontWeight: 400,
                      }}
                    >
                      Подключаем вас к пространству...
                    </Text>
                  </Stack>
                </Center>
              ) : isAuthenticated ? (
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
              ) : (
                <Group grow wrap="nowrap" gap={16}>
                  <Button
                    component={Link}
                    to={ROUTES.LOGIN}
                    state={{ autoAcceptInvite: true, from: location }}
                    radius={4}
                    style={{ height: 32 }}
                    styles={{
                      label: {
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: '20px',
                      },
                    }}
                  >
                    Войти
                  </Button>
                  <Button
                    component={Link}
                    to={ROUTES.REGISTER}
                    state={{ autoAcceptInvite: true, from: location }}
                    variant="outline"
                    color={primaryColor}
                    radius={4}
                    style={{ height: 32 }}
                    styles={{
                      label: {
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: '20px',
                      },
                    }}
                  >
                    Зарегистрироваться
                  </Button>
                </Group>
              )}
            </Stack>
          )}
        </Paper>
      </Center>
    </Box>
  );
};

export default InviteAcceptPage;
