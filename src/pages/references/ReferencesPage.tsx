import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconBriefcase,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { ProjectsCounterpartyResponse } from '../../shared/api/generated/schemas/projectsCounterpartyResponse';
import {
  getGetWorkspacesWorkspaceIdCounterpartiesQueryKey,
  useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId,
  useGetCounterpartyTypes,
  useGetWorkspacesWorkspaceIdCounterparties,
  usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId,
  usePostWorkspacesWorkspaceIdCounterparties,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { Tabs } from '../../shared/components/Tabs';
import { ROUTES } from '../../shared/constants/routes';

type ReferenceTab = 'counterparties';

type CounterpartyFormValues = {
  email: string;
  name: string;
  phone: string;
  type: string;
};

const getErrorMessage = (
  error: unknown,
  fallback = 'Не удалось выполнить действие',
) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toCounterpartyFormValues = (
  counterparty?: Pick<
    ProjectsCounterpartyResponse,
    'email' | 'name' | 'phone'
  > & {
    type?: { code?: string };
  },
): CounterpartyFormValues => ({
  name: counterparty?.name ?? '',
  type: counterparty?.type?.code ?? '',
  phone: counterparty?.phone ?? '',
  email: counterparty?.email ?? '',
});

const ReferencesPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activeTab, setActiveTab] = useState<ReferenceTab>('counterparties');
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalCounterparty, setEditModalCounterparty] =
    useState<ProjectsCounterpartyResponse | null>(null);
  const [deleteModalCounterparty, setDeleteModalCounterparty] =
    useState<ProjectsCounterpartyResponse | null>(null);
  const [pendingActionCounterpartyId, setPendingActionCounterpartyId] =
    useState<string | null>(null);

  const createCounterpartyForm = useForm<CounterpartyFormValues>({
    initialValues: {
      name: '',
      type: '',
      phone: '',
      email: '',
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'Введите наименование контрагента' : null,
      type: (value) => (value.trim().length === 0 ? 'Выберите тип' : null),
      email: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        return emailPattern.test(trimmed)
          ? null
          : 'Введите корректный адрес электронной почты';
      },
    },
  });

  const editCounterpartyForm = useForm<CounterpartyFormValues>({
    initialValues: {
      name: '',
      type: '',
      phone: '',
      email: '',
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'Введите наименование контрагента' : null,
      type: (value) => (value.trim().length === 0 ? 'Выберите тип' : null),
      email: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        return emailPattern.test(trimmed)
          ? null
          : 'Введите корректный адрес электронной почты';
      },
    },
  });

  const listParams = useMemo(
    () => ({
      limit: 200,
      offset: 0,
      sort_by: 'name',
      sort_dir: 'asc',
    }),
    [],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetWorkspacesWorkspaceIdCounterparties(workspaceId ?? '', listParams, {
      query: {
        enabled: !!workspaceId,
      },
    });

  const { data: counterpartyTypesData } = useGetCounterpartyTypes();

  const counterpartyTypeOptions = useMemo(
    () =>
      [...(counterpartyTypesData?.types ?? [])]
        .filter((item) => item.code && item.name)
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
        .map((item) => ({
          label: item.name ?? '',
          value: item.code ?? '',
        })),
    [counterpartyTypesData?.types],
  );

  const counterparties = data?.counterparties ?? [];

  const refreshCounterparties = () => {
    if (!workspaceId) return;

    const queryKey =
      getGetWorkspacesWorkspaceIdCounterpartiesQueryKey(workspaceId);

    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey, type: 'all' });
  };

  const createCounterpartyMutation = usePostWorkspacesWorkspaceIdCounterparties(
    {
      mutation: {
        onSuccess: (response) => {
          const createdName =
            response.counterparty?.name?.trim() ||
            createCounterpartyForm.values.name.trim();

          notifications.show({
            color: 'teal',
            title: 'Контрагент добавлен',
            message: createdName
              ? `«${createdName}» добавлен в справочник.`
              : 'Контрагент добавлен в справочник.',
          });

          refreshCounterparties();

          setCreateModalOpened(false);
          createCounterpartyForm.reset();
        },
        onError: (mutationError) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка',
            message: getErrorMessage(mutationError),
          });
        },
      },
    },
  );

  const updateCounterpartyMutation =
    usePatchWorkspacesWorkspaceIdCounterpartiesCounterpartyId({
      mutation: {
        onSuccess: (response) => {
          const updatedName =
            response.counterparty?.name?.trim() ||
            editCounterpartyForm.values.name.trim();

          notifications.show({
            color: 'teal',
            title: 'Контрагент обновлен',
            message: updatedName
              ? `«${updatedName}» успешно обновлен.`
              : 'Контрагент успешно обновлен.',
          });

          refreshCounterparties();
          setEditModalCounterparty(null);
          editCounterpartyForm.reset();
        },
        onError: (mutationError) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка обновления',
            message: getErrorMessage(mutationError),
          });
        },
        onSettled: () => {
          setPendingActionCounterpartyId(null);
        },
      },
    });

  const deleteCounterpartyMutation =
    useDeleteWorkspacesWorkspaceIdCounterpartiesCounterpartyId({
      mutation: {
        onSuccess: () => {
          const deletedName = deleteModalCounterparty?.name?.trim();

          notifications.show({
            color: 'teal',
            title: 'Контрагент удален',
            message: deletedName
              ? `«${deletedName}» удален из справочника.`
              : 'Контрагент удален из справочника.',
          });

          refreshCounterparties();
          setDeleteModalCounterparty(null);
        },
        onError: (mutationError) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка удаления',
            message: getErrorMessage(mutationError),
          });
        },
        onSettled: () => {
          setPendingActionCounterpartyId(null);
        },
      },
    });

  const closeCreateModal = () => {
    if (createCounterpartyMutation.isPending) return;
    setCreateModalOpened(false);
    createCounterpartyForm.reset();
  };

  const closeEditModal = () => {
    if (updateCounterpartyMutation.isPending) return;
    setEditModalCounterparty(null);
    editCounterpartyForm.reset();
  };

  const closeDeleteModal = () => {
    if (deleteCounterpartyMutation.isPending) return;
    setDeleteModalCounterparty(null);
  };

  const handleCreateCounterparty = createCounterpartyForm.onSubmit((values) => {
    if (!workspaceId) return;

    createCounterpartyMutation.mutate({
      workspaceId,
      data: {
        name: values.name.trim(),
        type: values.type,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
      },
    });
  });

  const handleOpenEditCounterparty = (
    counterparty: ProjectsCounterpartyResponse,
  ) => {
    setEditModalCounterparty(counterparty);
    editCounterpartyForm.setValues(toCounterpartyFormValues(counterparty));
    editCounterpartyForm.resetDirty();
  };

  const handleRequestDeleteCounterparty = (
    counterparty: ProjectsCounterpartyResponse,
  ) => {
    if (!counterparty.id) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Не удалось определить контрагента для удаления.',
      });
      return;
    }

    setDeleteModalCounterparty(counterparty);
  };

  const handleEditCounterparty = editCounterpartyForm.onSubmit((values) => {
    const counterpartyId = editModalCounterparty?.id;
    if (!workspaceId || !counterpartyId) return;

    setPendingActionCounterpartyId(counterpartyId);
    updateCounterpartyMutation.mutate({
      workspaceId,
      counterpartyId,
      data: {
        name: values.name.trim(),
        type: values.type,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
      },
    });
  });

  const handleDeleteCounterparty = () => {
    const counterpartyId = deleteModalCounterparty?.id;
    if (!workspaceId || !counterpartyId) return;

    setPendingActionCounterpartyId(counterpartyId);
    deleteCounterpartyMutation.mutate({ workspaceId, counterpartyId });
  };

  const renderCounterpartyActions = (
    counterparty: ProjectsCounterpartyResponse,
  ) => {
    const counterpartyId = counterparty.id ?? null;
    const isActionPending =
      pendingActionCounterpartyId === counterpartyId &&
      (updateCounterpartyMutation.isPending ||
        deleteCounterpartyMutation.isPending);

    return (
      <Menu
        withinPortal
        position="bottom-end"
        shadow="sm"
        styles={{
          dropdown: {
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 4,
            padding: 4,
          },
          item: {
            padding: '8px 12px',
            fontSize: 12,
            lineHeight: '16px',
          },
        }}
      >
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={28}
            disabled={isActionPending}
          >
            {isActionPending ? (
              <Loader size={14} />
            ) : (
              <IconDotsVertical size={16} />
            )}
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconPencil size={12} />}
            disabled={!counterparty.id || isActionPending}
            onClick={() => handleOpenEditCounterparty(counterparty)}
          >
            Редактировать
          </Menu.Item>
          <Menu.Item
            leftSection={<IconTrash size={12} />}
            color="red"
            disabled={!counterparty.id || isActionPending}
            onClick={() => handleRequestDeleteCounterparty(counterparty)}
          >
            Удалить
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  };

  if (!workspaceId) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  return (
    <Stack gap={20} p={20}>
      <Title order={3}>Справочники</Title>

      <Tabs
        value={activeTab}
        onChange={(value) =>
          setActiveTab((value as ReferenceTab) ?? 'counterparties')
        }
      >
        <Tabs.List>
          <Tabs.Tab
            value="counterparties"
            leftSection={<IconBriefcase size={12} />}
          >
            Контрагенты
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'counterparties' && (
        <>
          <Paper withBorder={false} radius="md" p={12}>
            <Group justify="space-between" gap={12} wrap="nowrap">
              <Text size="sm" c="dimmed">
                Всего контрагентов: {data?.total ?? counterparties.length}
              </Text>

              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpened(true)}
              >
                Добавить контрагента
              </Button>
            </Group>
          </Paper>

          {isLoading ? (
            <Center py={40}>
              <Loader size="sm" />
            </Center>
          ) : isError ? (
            <Paper radius="md" p={16}>
              <Stack gap={8}>
                <Text c="red">{getErrorMessage(error)}</Text>
                <Group>
                  <Button size="xs" variant="default" onClick={() => refetch()}>
                    Повторить
                  </Button>
                </Group>
              </Stack>
            </Paper>
          ) : (
            <Paper
              withBorder={false}
              radius="md"
              style={{ overflow: 'hidden' }}
            >
              <Table
                verticalSpacing={0}
                horizontalSpacing={0}
                styles={{
                  th: {
                    borderBottom:
                      '1px solid var(--mantine-color-default-border)',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: '20px',
                    padding: '8px 12px',
                  },
                  td: {
                    borderBottom:
                      '1px solid var(--mantine-color-default-border)',
                    fontSize: 14,
                    lineHeight: '20px',
                    padding: '8px 12px',
                    verticalAlign: 'middle',
                  },
                }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w="36%">Наименование</Table.Th>
                    <Table.Th w="20%">Тип</Table.Th>
                    <Table.Th w="22%">Телефон</Table.Th>
                    <Table.Th w="22%">Email</Table.Th>
                    <Table.Th w={38} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {counterparties.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Center py={36}>
                          <Text size="sm" c="dimmed">
                            Контрагенты пока не добавлены.
                          </Text>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    counterparties.map((counterparty) => (
                      <Table.Tr
                        key={
                          counterparty.id ??
                          `${counterparty.name}-${counterparty.created_at}`
                        }
                      >
                        <Table.Td>{counterparty.name?.trim() || '—'}</Table.Td>
                        <Table.Td>
                          {counterparty.type?.name?.trim() ||
                            counterparty.type?.code?.trim() ||
                            '—'}
                        </Table.Td>
                        <Table.Td>{counterparty.phone?.trim() || '—'}</Table.Td>
                        <Table.Td>{counterparty.email?.trim() || '—'}</Table.Td>
                        <Table.Td>
                          {renderCounterpartyActions(counterparty)}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          {isFetching && !isLoading && (
            <Text size="xs" c="dimmed">
              Обновляем список...
            </Text>
          )}
        </>
      )}

      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        withCloseButton={false}
        centered
        radius="sm"
        size={520}
        styles={{
          content: {
            borderRadius: 4,
            boxShadow: 'var(--mantine-shadow-sm)',
          },
          body: {
            padding: 16,
          },
        }}
      >
        <form onSubmit={handleCreateCounterparty} noValidate>
          <Stack gap={20}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="md" lh="24px" fw={400}>
                Новый контрагент
              </Text>
              <ActionIcon
                variant="transparent"
                color="gray"
                size={16}
                type="button"
                aria-label="Закрыть форму создания контрагента"
                onClick={closeCreateModal}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>

            <TextInput
              label="Наименование"
              withAsterisk
              placeholder="Например ООО “СтройИнвест”"
              disabled={createCounterpartyMutation.isPending}
              {...createCounterpartyForm.getInputProps('name')}
            />

            <Select
              label="Тип"
              withAsterisk
              placeholder="Выберите тип контрагента"
              data={counterpartyTypeOptions}
              searchable
              nothingFoundMessage="Типы не найдены"
              disabled={createCounterpartyMutation.isPending}
              {...createCounterpartyForm.getInputProps('type')}
            />

            <TextInput
              label="Телефон"
              placeholder="+7 900 000-00-00"
              disabled={createCounterpartyMutation.isPending}
              {...createCounterpartyForm.getInputProps('phone')}
            />

            <TextInput
              label="Email"
              placeholder="mail@example.com"
              disabled={createCounterpartyMutation.isPending}
              {...createCounterpartyForm.getInputProps('email')}
            />

            <Group justify="flex-end" gap={12}>
              <Button
                variant="default"
                type="button"
                onClick={closeCreateModal}
                disabled={createCounterpartyMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                loading={createCounterpartyMutation.isPending}
              >
                Добавить
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!editModalCounterparty}
        onClose={closeEditModal}
        withCloseButton={false}
        centered
        radius="sm"
        size={520}
        styles={{
          content: {
            borderRadius: 4,
            boxShadow: 'var(--mantine-shadow-sm)',
          },
          body: {
            padding: 16,
          },
        }}
      >
        <form onSubmit={handleEditCounterparty} noValidate>
          <Stack gap={20}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="md" lh="24px" fw={400}>
                Редактировать контрагента
              </Text>
              <ActionIcon
                variant="transparent"
                color="gray"
                size={16}
                type="button"
                aria-label="Закрыть форму редактирования контрагента"
                onClick={closeEditModal}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>

            <TextInput
              label="Наименование"
              withAsterisk
              placeholder="Например ООО “СтройИнвест”"
              disabled={updateCounterpartyMutation.isPending}
              {...editCounterpartyForm.getInputProps('name')}
            />

            <Select
              label="Тип"
              withAsterisk
              placeholder="Выберите тип контрагента"
              data={counterpartyTypeOptions}
              searchable
              nothingFoundMessage="Типы не найдены"
              disabled={updateCounterpartyMutation.isPending}
              {...editCounterpartyForm.getInputProps('type')}
            />

            <TextInput
              label="Телефон"
              placeholder="+7 900 000-00-00"
              disabled={updateCounterpartyMutation.isPending}
              {...editCounterpartyForm.getInputProps('phone')}
            />

            <TextInput
              label="Email"
              placeholder="mail@example.com"
              disabled={updateCounterpartyMutation.isPending}
              {...editCounterpartyForm.getInputProps('email')}
            />

            <Group justify="flex-end" gap={12}>
              <Button
                variant="default"
                type="button"
                onClick={closeEditModal}
                disabled={updateCounterpartyMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                loading={updateCounterpartyMutation.isPending}
              >
                Сохранить
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!deleteModalCounterparty}
        onClose={closeDeleteModal}
        withCloseButton={false}
        centered
        radius="sm"
        size={420}
        padding={16}
      >
        <Stack gap={16}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="md" lh="24px">
              Удалить контрагента
            </Text>
            <ActionIcon
              variant="transparent"
              color="gray"
              size={16}
              type="button"
              aria-label="Закрыть форму удаления контрагента"
              disabled={deleteCounterpartyMutation.isPending}
              onClick={closeDeleteModal}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>

          <Text size="sm" c="dimmed">
            {deleteModalCounterparty?.name?.trim()
              ? `Контрагент «${deleteModalCounterparty.name.trim()}» будет удален без возможности восстановления.`
              : 'Контрагент будет удален без возможности восстановления.'}
          </Text>

          <Group justify="flex-end" gap={12}>
            <Button
              variant="default"
              type="button"
              disabled={deleteCounterpartyMutation.isPending}
              onClick={closeDeleteModal}
            >
              Отмена
            </Button>
            <Button
              color="red"
              type="button"
              loading={deleteCounterpartyMutation.isPending}
              onClick={handleDeleteCounterparty}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ReferencesPage;
