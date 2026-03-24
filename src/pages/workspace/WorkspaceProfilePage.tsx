import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getGetWorkspacesWorkspaceIdQueryKey,
  getGetWorkspacesQueryKey,
  useDeleteWorkspacesWorkspaceId,
  useGetWorkspacesWorkspaceId,
  usePutWorkspacesWorkspaceId,
} from '../../shared/api/generated/smetchik';
import type { WorkspacesWorkspaceResponse } from '../../shared/api/generated/schemas';
import type { WorkspacesListResponse } from '../../shared/api/generated/schemas/workspacesListResponse';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES, buildRoute } from '../../shared/constants/routes';
import { queryClient } from '../../shared/api/queryClient';

const DESCRIPTION_MAX = 320;

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось выполнить действие';
  }
  if (error instanceof Error) return error.message;
  return 'Не удалось выполнить действие. Попробуйте еще раз.';
};

type DeleteModalProps = {
  opened: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteModal = ({
  opened,
  isPending,
  onClose,
  onConfirm,
}: DeleteModalProps) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!opened) setInput('');
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Удаление пространства"
      centered
      size="md"
    >
      <Stack gap="md">
        <Alert
          color="red"
          variant="outline"
          icon={<IconAlertTriangle size={16} />}
        >
          <Text fw={600} c="red" size="sm" mb={8}>
            Внимание! Это действие приведёт к следующему:
          </Text>
          <Stack gap={4}>
            <Text size="sm">
              • Все сотрудники будут отвязаны от пространства
            </Text>
            <Text size="sm">
              • Доступ к проектам, финансам и справочникам будет закрыт
            </Text>
            <Text size="sm">
              • Данные можно будет восстановить в течение 30 дней
            </Text>
            <Text size="sm">
              • По истечении 30 дней все данные будут удалены окончательно
            </Text>
          </Stack>
        </Alert>

        <TextInput
          label="Для подтверждения введите слово Удалить"
          placeholder="Удалить"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отменить
          </Button>
          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            disabled={input.toLowerCase().trim() !== 'удалить'}
            loading={isPending}
            onClick={onConfirm}
          >
            Удалить пространство
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const WorkspaceGeneralPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Введите название' : null),
    },
  });

  const { data, isLoading, isError } = useGetWorkspacesWorkspaceId(
    workspaceId ?? '',
    { query: { enabled: !!workspaceId } },
  );

  const workspace = data?.workspace;

  useEffect(() => {
    if (!workspace) return;
    form.setValues({
      name: workspace.name ?? '',
      description: workspace.description ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, workspace?.name, workspace?.description]);

  const updateMutation = usePutWorkspacesWorkspaceId({
    mutation: {
      onSuccess: (response) => {
        const updated = response.workspace;
        notifications.show({
          color: 'teal',
          title: 'Пространство обновлено',
          message: 'Изменения сохранены.',
        });

        if (updated && workspaceId) {
          const listKey = getGetWorkspacesQueryKey();
          const detailKey = getGetWorkspacesWorkspaceIdQueryKey(workspaceId);
          const current = queryClient.getQueryData<
            WorkspacesListResponse | undefined
          >(listKey);

          if (current?.workspaces?.length) {
            queryClient.setQueryData<WorkspacesListResponse | undefined>(
              listKey,
              {
                ...current,
                workspaces: current.workspaces.map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
              },
            );
          }

          queryClient.setQueryData<WorkspacesWorkspaceResponse | undefined>(
            detailKey,
            updated,
          );
          form.resetDirty();
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

  const deleteMutation = useDeleteWorkspacesWorkspaceId({
    mutation: {
      onSuccess: () => {
        closeDelete();
        const listKey = getGetWorkspacesQueryKey();
        const current = queryClient.getQueryData<
          WorkspacesListResponse | undefined
        >(listKey);
        const remaining =
          current?.workspaces?.filter((item) => item.id !== workspaceId) ?? [];

        if (current) {
          const nextTotal =
            current.total === undefined
              ? remaining.length
              : Math.max(current.total - 1, remaining.length);
          queryClient.setQueryData<WorkspacesListResponse | undefined>(
            listKey,
            {
              ...current,
              workspaces: remaining,
              total: nextTotal,
            },
          );
        }

        if (workspaceId) {
          queryClient.removeQueries({
            queryKey: getGetWorkspacesWorkspaceIdQueryKey(workspaceId),
          });
        }

        if (remaining.length === 0) {
          navigate(ROUTES.WORKSPACE_CREATE, { replace: true });
          return;
        }
        navigate(
          buildRoute(ROUTES.PROJECTS, { workspaceId: remaining[0]?.id ?? '' }),
          { replace: true },
        );
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

  if (!workspaceId) return <Navigate to={ROUTES.WORKSPACE_CREATE} replace />;

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !workspace) {
    return <Text c="red">Пространство не найдено.</Text>;
  }

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate({
      workspaceId,
      data: {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      },
    });
  });

  const descLen = form.values.description.length;

  return (
    <>
      <DeleteModal
        opened={deleteOpened}
        isPending={deleteMutation.isPending}
        onClose={closeDelete}
        onConfirm={() => {
          if (!deleteMutation.isPending) {
            deleteMutation.mutate({ workspaceId });
          }
        }}
      />

      <Group align="flex-start" gap={20} wrap="nowrap">
        {/* Левая колонка: логотип + удалить */}
        <Stack gap={20} style={{ width: 372, flexShrink: 0 }}>
          <Paper
            radius="md"
            p={24}
            style={{
              height: 269,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <Title order={4} ta="center">
              Логотип компании
            </Title>
            <Box
              style={{
                width: 140,
                height: 140,
                borderRadius: 64,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#f1f3f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Text c="dimmed" size="sm">
                Фото
              </Text>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpeg,.jpg,.png,.gif"
              style={{ display: 'none' }}
            />
            <Text size="xs" c="dimmed" ta="center">
              Разрешены *.jpeg, *.jpg, *.png, *.gif
              <br />
              Максимальный размер до 3.0 MB
            </Text>
          </Paper>

          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={20} />}
            onClick={openDelete}
          >
            Удалить пространство
          </Button>
        </Stack>

        {/* Правая колонка: форма */}
        <Paper radius="md" p={24} style={{ flex: 1 }}>
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                label="Название пространства"
                {...form.getInputProps('name')}
              />

              <Box>
                <Textarea
                  label="Информация для сотрудников"
                  minRows={4}
                  maxLength={DESCRIPTION_MAX}
                  {...form.getInputProps('description')}
                />
                <Text size="xs" c="dimmed" ta="right" mt={4}>
                  {descLen}/{DESCRIPTION_MAX}
                </Text>
              </Box>

              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={updateMutation.isPending}
                  disabled={!form.isDirty()}
                >
                  Сохранить
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Group>
    </>
  );
};

export default WorkspaceGeneralPage;
