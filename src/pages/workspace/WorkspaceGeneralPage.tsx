import {
  Alert,
  Avatar,
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
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconTrash, IconUpload } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type { WorkspacesListResponse } from '../../shared/api/generated/schemas/workspacesListResponse';
import type { WorkspacesSingleWorkspaceResponse } from '../../shared/api/generated/schemas/workspacesSingleWorkspaceResponse';
import {
  getGetWorkspacesQueryKey,
  getGetWorkspacesWorkspaceIdQueryKey,
  postWorkspacesWorkspaceIdLogo,
  useDeleteWorkspacesWorkspaceId,
  useGetWorkspacesWorkspaceId,
  usePutWorkspacesWorkspaceId,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import ImageEditorModal, {
  type EditorSource,
} from '../../shared/components/ImageEditorModal';
import { buildRoute, ROUTES } from '../../shared/constants/routes';

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

type WorkspaceFormValues = {
  description: string;
  name: string;
};

const normalizeWorkspaceFormValues = (
  values: WorkspaceFormValues,
): WorkspaceFormValues => ({
  name: values.name.trim(),
  description: values.description.trim(),
});

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
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorSource, setEditorSource] = useState<EditorSource | null>(null);
  const [savedValues, setSavedValues] = useState<WorkspaceFormValues>({
    name: '',
    description: '',
  });
  const { primaryColor } = usePrimaryColor();

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Введите название' : null),
    },
  });
  const { setValues } = form;

  const { data, isLoading, isError } = useGetWorkspacesWorkspaceId(
    workspaceId ?? '',
    { query: { enabled: !!workspaceId } },
  );

  const workspace = data?.workspace;
  const workspaceSyncId = workspace?.id ?? '';
  const workspaceName = workspace?.name ?? '';
  const workspaceDescription = workspace?.description ?? '';

  useEffect(() => {
    if (!workspaceSyncId) return;

    const nextValues = normalizeWorkspaceFormValues({
      name: workspaceName,
      description: workspaceDescription,
    });
    setValues(nextValues);
    setSavedValues(nextValues);
  }, [setValues, workspaceSyncId, workspaceName, workspaceDescription]);

  useEffect(() => {
    return () => {
      if (editorSource?.url) {
        URL.revokeObjectURL(editorSource.url);
      }
    };
  }, [editorSource?.url]);

  const currentValues = normalizeWorkspaceFormValues(form.values);
  const currentSavedValues = normalizeWorkspaceFormValues(savedValues);
  const hasChanges =
    currentValues.name !== currentSavedValues.name ||
    currentValues.description !== currentSavedValues.description;

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

          queryClient.setQueryData<
            WorkspacesSingleWorkspaceResponse | undefined
          >(detailKey, { workspace: updated });
          const nextValues = normalizeWorkspaceFormValues({
            name: updated?.name ?? '',
            description: updated?.description ?? '',
          });
          setValues(nextValues);
          setSavedValues(nextValues);
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

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!workspaceId) {
        throw new Error('Не удалось определить пространство');
      }

      const formData = new FormData();
      formData.append('file', file);
      return postWorkspacesWorkspaceIdLogo(workspaceId, { data: formData });
    },
    onSuccess: (response) => {
      if (!workspaceId) return;

      const nextLogoUrl = response.logo_url;
      const listKey = getGetWorkspacesQueryKey();
      const detailKey = getGetWorkspacesWorkspaceIdQueryKey(workspaceId);
      const currentList = queryClient.getQueryData<
        WorkspacesListResponse | undefined
      >(listKey);

      if (currentList?.workspaces?.length) {
        queryClient.setQueryData<WorkspacesListResponse | undefined>(listKey, {
          ...currentList,
          workspaces: currentList.workspaces.map((item) =>
            item.id === workspaceId ? { ...item, logo_url: nextLogoUrl } : item,
          ),
        });
      }

      const currentDetail = queryClient.getQueryData<
        WorkspacesSingleWorkspaceResponse | undefined
      >(detailKey);
      if (currentDetail?.workspace) {
        queryClient.setQueryData<WorkspacesSingleWorkspaceResponse | undefined>(
          detailKey,
          {
            ...currentDetail,
            workspace: {
              ...currentDetail.workspace,
              logo_url: nextLogoUrl,
            },
          },
        );
      } else if (workspace) {
        queryClient.setQueryData<WorkspacesSingleWorkspaceResponse | undefined>(
          detailKey,
          {
            workspace: {
              ...workspace,
              logo_url: nextLogoUrl,
            },
          },
        );
      }

      setEditorSource(null);
      notifications.show({
        color: 'teal',
        title: 'Логотип обновлён',
        message: 'Изображение успешно сохранено.',
      });
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        title: 'Ошибка загрузки',
        message: getErrorMessage(error),
      });
    },
  });

  const closeEditor = () => {
    if (uploadLogoMutation.isPending) return;
    setEditorSource(null);
  };

  const handleLogoFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png']);
    const maxSize = 3 * 1024 * 1024;

    if (!allowedTypes.has(file.type.toLowerCase())) {
      notifications.show({
        color: 'red',
        title: 'Неверный формат',
        message: 'Поддерживаются файлы *.jpeg, *.jpg, *.png',
      });
      return;
    }

    if (file.size > maxSize) {
      notifications.show({
        color: 'red',
        title: 'Файл слишком большой',
        message: 'Максимальный размер изображения — 3.0 MB',
      });
      return;
    }

    setEditorSource({
      file,
      url: URL.createObjectURL(file),
    });
  };

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
    if (!hasChanges) return;
    const normalizedValues = normalizeWorkspaceFormValues(values);

    updateMutation.mutate({
      workspaceId,
      data: {
        name: normalizedValues.name,
        description: normalizedValues.description || undefined,
      },
    });
  });

  const descLen = form.values.description.length;
  const workspaceInitials =
    workspace.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'WS';

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

      <Group
        align="flex-start"
        gap={isMobile ? 12 : 20}
        wrap={isMobile ? 'wrap' : 'nowrap'}
      >
        <Stack
          gap={isMobile ? 12 : 20}
          style={{
            width: isMobile ? '100%' : 372,
            flexShrink: 0,
          }}
        >
          <Paper
            radius="md"
            p={isMobile ? 16 : 24}
            style={{
              minHeight: isMobile ? undefined : 269,
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
              role="button"
              tabIndex={0}
              aria-label="Загрузить логотип"
              style={{
                width: isMobile ? 110 : 140,
                height: isMobile ? 110 : 140,
                minHeight: isMobile ? 110 : 140,
                borderRadius: 30,
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'var(--mantine-color-default-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Avatar
                size={isMobile ? 110 : 140}
                radius={30}
                color={primaryColor}
                variant="filled"
                src={workspace.logo_url ?? undefined}
              >
                {workspaceInitials}
              </Avatar>
            </Box>
            <Button
              variant="outline"
              color="gray"
              size="xs"
              leftSection={<IconUpload size={12} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogoMutation.isPending}
            >
              Загрузить логотип
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpeg,.jpg,.png"
              style={{ display: 'none' }}
              onChange={handleLogoFileSelect}
            />
            <Text size="xs" c="dimmed" ta="center">
              Разрешены *.jpeg, *.jpg, *.png
              <br />
              Максимальный размер до 3.0 MB
            </Text>
          </Paper>

          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={20} />}
            onClick={openDelete}
            fullWidth={isMobile}
          >
            Удалить пространство
          </Button>
        </Stack>

        {/* Правая колонка: форма */}
        <Paper
          radius="md"
          p={isMobile ? 16 : 24}
          style={{ flex: 1, width: isMobile ? '100%' : undefined }}
        >
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
                  disabled={!hasChanges}
                  fullWidth={isMobile}
                >
                  Сохранить
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Group>

      <ImageEditorModal
        opened={!!editorSource}
        source={editorSource}
        shape="rounded"
        loading={uploadLogoMutation.isPending}
        onClose={closeEditor}
        onSave={async (file) => {
          await uploadLogoMutation.mutateAsync(file);
        }}
      />
    </>
  );
};

export default WorkspaceGeneralPage;
