import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconBuilding,
  IconCheck,
  IconUsers,
} from '@tabler/icons-react';
import {
  useGetInviteToken,
  usePostInviteToken,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES, buildRoute } from '../../shared/constants/routes';
import logo from '../../assets/logo.svg';

const formatExpiry = (expiresAt: string) =>
  new Date(expiresAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось вступить в пространство';
  }
  return 'Не удалось вступить в пространство';
};

const InviteAcceptPage = () => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

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
        setJoined(true);
        if (workspaceId) {
          setTimeout(
            () =>
              navigate(buildRoute(ROUTES.WORKSPACE, { workspaceId }), {
                replace: true,
              }),
            1500,
          );
        }
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

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Center
        style={{ minHeight: '100vh', padding: 'var(--mantine-spacing-xl)' }}
      >
        <Card
          withBorder
          shadow="sm"
          radius="md"
          style={{ width: '100%', maxWidth: 460 }}
          padding="xl"
        >
          <Group justify="center" mb="xl">
            <img src={logo} alt="Сметчик ПРО" style={{ height: 36 }} />
          </Group>

          {isLoading && (
            <Center py="xl">
              <Loader />
            </Center>
          )}

          {!isLoading && isError && (
            <Alert
              icon={<IconAlertCircle size={18} />}
              color="red"
              title="Ссылка недействительна"
              radius="md"
            >
              Инвайт-ссылка не найдена или срок её действия истёк.
            </Alert>
          )}

          {joined && (
            <Stack gap="md" align="center" py="md">
              <ThemeIcon color="teal" size={56} radius="xl">
                <IconCheck size={28} />
              </ThemeIcon>
              <Text fw={600} ta="center" size="lg">
                Вы успешно вступили в пространство!
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Перенаправление...
              </Text>
            </Stack>
          )}

          {!isLoading && !isError && !joined && invite && (
            <Stack gap="md">
              <Stack gap={6} align="center">
                <ThemeIcon color="blue" size={56} radius="xl">
                  <IconBuilding size={28} />
                </ThemeIcon>
                <Title order={3} ta="center" mt="xs">
                  {invite.workspace_name}
                </Title>
                {invite.workspace_description && (
                  <Text size="sm" c="dimmed" ta="center">
                    {invite.workspace_description}
                  </Text>
                )}
              </Stack>

              <Divider />

              <Stack gap="xs">
                {invite.role && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Роль
                    </Text>
                    <Badge variant="light">{invite.role.name}</Badge>
                  </Group>
                )}
                {typeof invite.member_count === 'number' && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Участников
                    </Text>
                    <Group gap={4}>
                      <IconUsers size={16} />
                      <Text size="sm">{invite.member_count}</Text>
                    </Group>
                  </Group>
                )}
                {invite.expires_at && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Действует до
                    </Text>
                    <Text size="sm">{formatExpiry(invite.expires_at)}</Text>
                  </Group>
                )}
              </Stack>

              <Button
                fullWidth
                mt="xs"
                loading={isJoining}
                onClick={() => join({ token })}
              >
                Вступить в пространство
              </Button>
            </Stack>
          )}
        </Card>
      </Center>
    </Box>
  );
};

export default InviteAcceptPage;
