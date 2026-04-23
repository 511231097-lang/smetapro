import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconBriefcase,
  IconCalendarPlus,
  IconChevronLeft,
  IconCopy,
  IconDotsVertical,
  IconFileInvoice,
  IconHierarchy2,
  IconId,
  IconListDetails,
  IconMapPin,
  IconPhoto,
  IconSelector,
  IconTrash,
  IconWallet,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { ProjectsProjectListResponse } from '../../shared/api/generated/schemas/projectsProjectListResponse';
import type { ProjectsSingleProjectResponse } from '../../shared/api/generated/schemas/projectsSingleProjectResponse';
import {
  getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey,
  getGetWorkspacesWorkspaceIdProjectsQueryKey,
  useDeleteWorkspacesWorkspaceIdProjectsProjectId,
  useGetProjectStatuses,
  useGetWorkspacesWorkspaceIdCounterparties,
  useGetWorkspacesWorkspaceIdProjectsProjectId,
  usePatchWorkspacesWorkspaceIdProjectsProjectId,
  usePostWorkspacesWorkspaceIdProjectsProjectIdCopy,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { Tabs } from '../../shared/components/Tabs';
import { buildRoute, ROUTES } from '../../shared/constants/routes';

const DESCRIPTION_MAX = 320;

type ProjectTab = 'main' | 'estimates' | 'gallery' | 'documents' | 'finances';

type ProjectMainFormValues = {
  address: string;
  counterpartyId: string;
  description: string;
  endDate: string;
  name: string;
  startDate: string;
  statusId: string;
};

type StatusPalette = {
  badgeBorder: string;
  badgeBg: string;
  badgeColor: string;
};

type CounterpartyOptionSource = {
  id?: string;
  name?: string;
  type?: {
    code?: string;
  };
};

type CounterpartyOption = {
  label: string;
  value: string;
};

const STATUS_PALETTES_LIGHT: Record<string, StatusPalette> = {
  черновик: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-gray-light)',
    badgeColor: 'var(--mantine-color-gray-light-color)',
  },
  'на согласовании': {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-yellow-light)',
    badgeColor: 'var(--mantine-color-yellow-light-color)',
  },
  'в работе': {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-indigo-light)',
    badgeColor: 'var(--mantine-color-indigo-light-color)',
  },
  приостановлен: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-red-light)',
    badgeColor: 'var(--mantine-color-red-light-color)',
  },
  завершен: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-teal-light)',
    badgeColor: 'var(--mantine-color-teal-light-color)',
  },
};

const STATUS_PALETTES_DARK: Record<string, StatusPalette> = {
  черновик: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-gray-light)',
    badgeColor: 'var(--mantine-color-gray-light-color)',
  },
  'на согласовании': {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-yellow-light)',
    badgeColor: 'var(--mantine-color-yellow-light-color)',
  },
  'в работе': {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-indigo-light)',
    badgeColor: 'var(--mantine-color-indigo-light-color)',
  },
  приостановлен: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-red-light)',
    badgeColor: 'var(--mantine-color-red-light-color)',
  },
  завершен: {
    badgeBorder: 'transparent',
    badgeBg: 'var(--mantine-color-teal-light)',
    badgeColor: 'var(--mantine-color-teal-light-color)',
  },
};

const normalizeStatus = (value: string | undefined) =>
  (value ?? '').trim().toLowerCase().replace(/ё/g, 'е');

const resolveStatusPalette = (
  statusName: string | undefined,
  colorScheme: 'light' | 'dark',
): StatusPalette => {
  const palettes =
    colorScheme === 'dark' ? STATUS_PALETTES_DARK : STATUS_PALETTES_LIGHT;
  return palettes[normalizeStatus(statusName)] ?? palettes.черновик;
};

const toInputDate = (value: string | undefined) => {
  if (!value) return '';

  const direct = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) return direct;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toISOString().slice(0, 10);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const toFormValues = (project?: {
  address?: string;
  counterparty?: { id?: string };
  description?: string;
  end_date?: string;
  name?: string;
  start_date?: string;
  status?: { id?: number };
}): ProjectMainFormValues => ({
  name: project?.name ?? '',
  statusId:
    project?.status?.id !== undefined && project.status.id !== null
      ? String(project.status.id)
      : '',
  counterpartyId: project?.counterparty?.id ?? '',
  startDate: toInputDate(project?.start_date),
  endDate: toInputDate(project?.end_date),
  address: project?.address ?? '',
  description: project?.description ?? '',
});

export const getClientCounterpartyOptions = (
  counterparties: CounterpartyOptionSource[] | undefined,
  currentCounterparty?: {
    id?: string;
    name?: string;
  },
): CounterpartyOption[] => {
  const base = (counterparties ?? [])
    .filter(
      (item) => item.id && item.name && item.type?.code?.trim() === 'client',
    )
    .map((item) => ({
      value: item.id ?? '',
      label: item.name ?? '',
    }));

  const currentId = currentCounterparty?.id;
  const currentName = currentCounterparty?.name;
  if (
    currentId &&
    currentName &&
    !base.some((option) => option.value === currentId)
  ) {
    return [...base, { value: currentId, label: currentName }];
  }

  return base;
};

const mergeUpdatedProjectInListCache = (
  cache: ProjectsProjectListResponse | undefined,
  updatedProject: NonNullable<ProjectsProjectListResponse['projects']>[number],
) => {
  if (!cache?.projects || !updatedProject.id) return cache;

  let hasChanged = false;
  const nextProjects = cache.projects.map((project) => {
    if (project.id !== updatedProject.id) return project;
    hasChanged = true;
    return {
      ...project,
      ...updatedProject,
    };
  });

  if (!hasChanged) return cache;

  return {
    ...cache,
    projects: nextProjects,
  };
};

const ProjectPage = () => {
  const { workspaceId, projectId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  const navigate = useNavigate();
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: false,
  });
  const [activeTab, setActiveTab] = useState<ProjectTab>('main');
  const [syncedSignature, setSyncedSignature] = useState('');
  const form = useForm<ProjectMainFormValues>({
    initialValues: {
      name: '',
      statusId: '',
      counterpartyId: '',
      startDate: '',
      endDate: '',
      address: '',
      description: '',
    },
    validateInputOnChange: ['startDate', 'endDate'],
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'Введите наименование проекта' : null,
      description: (value) =>
        value.length > DESCRIPTION_MAX
          ? `Максимум ${DESCRIPTION_MAX} символов`
          : null,
      startDate: (value, values) => {
        if (!value || !values.endDate) return null;
        if (value <= values.endDate) return null;
        return 'Дата начала не может быть позже даты окончания';
      },
      endDate: (value, values) => {
        if (!value || !values.startDate) return null;
        if (value >= values.startDate) return null;
        return 'Дата окончания не может быть раньше даты начала';
      },
    },
  });

  const {
    data: projectData,
    error: projectError,
    isLoading,
    isError,
    refetch: refetchProject,
  } = useGetWorkspacesWorkspaceIdProjectsProjectId(
    workspaceId ?? '',
    projectId ?? '',
    {
      query: {
        enabled: !!workspaceId && !!projectId,
      },
    },
  );

  const { data: statusesData } = useGetProjectStatuses({
    query: {
      enabled: !!workspaceId,
    },
  });

  const { data: counterpartiesData } =
    useGetWorkspacesWorkspaceIdCounterparties(
      workspaceId ?? '',
      {
        limit: 200,
        offset: 0,
        sort_by: 'name',
        sort_dir: 'asc',
      },
      {
        query: {
          enabled: !!workspaceId,
          refetchOnMount: true,
        },
      },
    );

  const project = projectData?.project;
  const isProjectNotFound =
    projectError instanceof HttpClientError && projectError.status === 404;

  const statusOptions = useMemo(() => {
    const base = (statusesData?.statuses ?? [])
      .filter((item) => item.id !== undefined && item.name)
      .map((item) => ({
        value: String(item.id),
        label: item.name ?? '',
      }));

    const currentId = project?.status?.id;
    const currentName = project?.status?.name;
    if (
      currentId !== undefined &&
      currentName &&
      !base.some((option) => option.value === String(currentId))
    ) {
      return [...base, { value: String(currentId), label: currentName }];
    }

    return base;
  }, [project?.status?.id, project?.status?.name, statusesData?.statuses]);

  const counterpartyOptions = useMemo(() => {
    return getClientCounterpartyOptions(counterpartiesData?.counterparties, {
      id: project?.counterparty?.id,
      name: project?.counterparty?.name,
    });
  }, [
    counterpartiesData?.counterparties,
    project?.counterparty?.id,
    project?.counterparty?.name,
  ]);

  const upsertProjectInCache = (
    updatedProject: NonNullable<
      ProjectsProjectListResponse['projects']
    >[number],
  ) => {
    if (!workspaceId || !updatedProject.id) return;

    queryClient.setQueryData<ProjectsSingleProjectResponse>(
      getGetWorkspacesWorkspaceIdProjectsProjectIdQueryKey(
        workspaceId,
        updatedProject.id,
      ),
      { project: updatedProject },
    );

    const projectsQueryKey =
      getGetWorkspacesWorkspaceIdProjectsQueryKey(workspaceId);

    queryClient.setQueriesData<ProjectsProjectListResponse>(
      { queryKey: projectsQueryKey },
      (cache) => mergeUpdatedProjectInListCache(cache, updatedProject),
    );
  };

  const refreshProjects = () => {
    if (!workspaceId) return;

    queryClient.invalidateQueries({
      queryKey: getGetWorkspacesWorkspaceIdProjectsQueryKey(workspaceId),
    });
  };

  const updateProjectMutation = usePatchWorkspacesWorkspaceIdProjectsProjectId({
    mutation: {
      onSuccess: (response) => {
        const updatedProject = response.project;

        notifications.show({
          color: 'teal',
          title: 'Проект обновлен',
          message: 'Изменения сохранены.',
        });

        if (updatedProject?.id) {
          upsertProjectInCache(updatedProject);
        }
        refreshProjects();

        if (response.project) {
          const nextValues = toFormValues(response.project);
          form.setValues(nextValues);
          form.resetDirty();
        }
      },
      onError: (error) => {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(error, 'Не удалось сохранить проект'),
        });
      },
    },
  });

  const quickStatusMutation = usePatchWorkspacesWorkspaceIdProjectsProjectId({
    mutation: {
      onSuccess: (response) => {
        const updatedProject = response.project;
        if (!updatedProject) return;

        notifications.show({
          color: 'teal',
          title: 'Статус обновлен',
          message: 'Статус проекта изменен.',
        });

        upsertProjectInCache(updatedProject);
        refreshProjects();

        if (!form.isDirty()) {
          const nextValues = toFormValues(updatedProject);
          form.setValues(nextValues);
          form.resetDirty();
        }

        setSyncedSignature(
          `${updatedProject.id ?? ''}:${updatedProject.updated_at ?? ''}`,
        );
      },
      onError: (error) => {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(error, 'Не удалось изменить статус проекта'),
        });
      },
    },
  });

  const copyProjectMutation = usePostWorkspacesWorkspaceIdProjectsProjectIdCopy(
    {
      mutation: {
        onSuccess: (response) => {
          const copiedProjectId = response.project?.id;
          const copiedName = response.project?.name?.trim();

          notifications.show({
            color: 'teal',
            title: 'Проект скопирован',
            message: copiedName
              ? `Создана копия: «${copiedName}».`
              : 'Копия проекта успешно создана.',
          });

          refreshProjects();

          if (workspaceId && copiedProjectId) {
            navigate(
              buildRoute(ROUTES.PROJECT_DETAILS, {
                workspaceId,
                projectId: copiedProjectId,
              }),
            );
          }
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка копирования',
            message: getErrorMessage(error, 'Не удалось скопировать проект'),
          });
        },
      },
    },
  );

  const deleteProjectMutation = useDeleteWorkspacesWorkspaceIdProjectsProjectId(
    {
      mutation: {
        onSuccess: () => {
          const deletedName = project?.name?.trim();

          notifications.show({
            color: 'teal',
            title: 'Проект удален',
            message: deletedName
              ? `«${deletedName}» удален.`
              : 'Проект успешно удален.',
          });

          refreshProjects();

          if (workspaceId) {
            navigate(buildRoute(ROUTES.PROJECTS, { workspaceId }), {
              replace: true,
            });
          }
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка удаления',
            message: getErrorMessage(error, 'Не удалось удалить проект'),
          });
        },
      },
    },
  );

  useEffect(() => {
    if (!project) return;

    const signature = `${project.id ?? ''}:${project.updated_at ?? ''}`;
    if (signature === syncedSignature) return;

    if (!form.isDirty()) {
      const nextValues = toFormValues(project);
      form.setValues(nextValues);
      form.resetDirty();
    }

    setSyncedSignature(signature);
  }, [form, project, syncedSignature]);

  if (!workspaceId) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isProjectNotFound || (!isLoading && !isError && !project)) {
    return (
      <Center h="calc(100vh - 220px)" mih={320}>
        <Paper withBorder radius="md" p={28} maw={560} w="100%">
          <Stack gap={12} align="center">
            <Title order={4} ta="center">
              Проект не найден
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Возможно, проект был удален или ссылка устарела. Откройте список
              проектов и выберите нужный.
            </Text>
            <Button
              component={Link}
              to={buildRoute(ROUTES.PROJECTS, { workspaceId })}
              variant="default"
              leftSection={<IconChevronLeft size={16} />}
            >
              К списку проектов
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (isError) {
    return (
      <Paper p={20} radius="md">
        <Stack gap={12}>
          <Text c="red">Не удалось загрузить данные проекта.</Text>
          <Group>
            <Button
              variant="default"
              size="xs"
              onClick={() => refetchProject()}
            >
              Повторить
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  if (!project) {
    return null;
  }

  const currentProject = project;

  const currentProjectStatusId =
    currentProject.status?.id !== undefined && currentProject.status.id !== null
      ? String(currentProject.status.id)
      : '';
  const headerStatusName =
    statusOptions.find((item) => item.value === currentProjectStatusId)
      ?.label ??
    currentProject.status?.name ??
    '—';
  const statusPalette = resolveStatusPalette(headerStatusName, colorScheme);
  const isHeaderActionsPending =
    copyProjectMutation.isPending || deleteProjectMutation.isPending;

  const handleQuickStatusChange = (statusId: string) => {
    if (!workspaceId || !projectId || !statusId) return;
    if (statusId === currentProjectStatusId) return;

    quickStatusMutation.mutate({
      workspaceId,
      projectId,
      data: {
        status_id: Number(statusId),
      },
    });
  };

  const handleCopyProject = () => {
    if (!workspaceId || !projectId) return;
    copyProjectMutation.mutate({ workspaceId, projectId });
  };

  const handleDeleteProject = () => {
    if (!workspaceId || !projectId) return;
    deleteProjectMutation.mutate({ workspaceId, projectId });
  };

  const handleStartDateChange = (value: string | null) => {
    form.setFieldValue('startDate', value ?? '');
    form.validateField('startDate');
    form.validateField('endDate');
  };

  const handleEndDateChange = (value: string | null) => {
    form.setFieldValue('endDate', value ?? '');
    form.validateField('startDate');
    form.validateField('endDate');
  };

  const handleSubmit = form.onSubmit((values) => {
    if (!projectId) return;

    updateProjectMutation.mutate({
      workspaceId,
      projectId,
      data: {
        name: values.name.trim(),
        status_id: values.statusId ? Number(values.statusId) : undefined,
        counterparty_id: values.counterpartyId || undefined,
        start_date: values.startDate || undefined,
        end_date: values.endDate || undefined,
        address: values.address.trim(),
        description: values.description.trim() || undefined,
      },
    });
  });

  const placeholderTitles: Record<Exclude<ProjectTab, 'main'>, string> = {
    estimates: 'Сметы',
    gallery: 'Галерея',
    documents: 'Документы',
    finances: 'Финансы',
  };

  return (
    <Stack gap={20} p={20}>
      <Stack gap={8}>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<IconChevronLeft size={16} />}
          component={Link}
          to={buildRoute(ROUTES.PROJECTS, { workspaceId })}
          styles={{
            root: {
              alignSelf: 'flex-start',
              paddingInline: 8,
            },
            label: { fontSize: 14, lineHeight: '20px' },
          }}
        >
          Все проекты
        </Button>

        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={16} wrap="nowrap">
            <Title order={3}>{currentProject.name?.trim() || 'Проект'}</Title>
            <Menu
              withinPortal
              position="bottom-start"
              shadow="sm"
              styles={{
                dropdown: {
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 6,
                  padding: 4,
                },
                item: {
                  fontSize: 13,
                  lineHeight: '18px',
                  padding: '8px 10px',
                },
              }}
            >
              <Menu.Target>
                <UnstyledButton
                  disabled={
                    quickStatusMutation.isPending || statusOptions.length === 0
                  }
                >
                  <Badge
                    radius="xl"
                    px={10}
                    styles={{
                      root: {
                        backgroundColor: statusPalette.badgeBg,
                        border: `1px solid ${statusPalette.badgeBorder}`,
                        minHeight: 26,
                        cursor:
                          quickStatusMutation.isPending ||
                          statusOptions.length === 0
                            ? 'default'
                            : 'pointer',
                      },
                      label: {
                        color: statusPalette.badgeColor,
                        fontSize: 14,
                        fontWeight: 600,
                        lineHeight: '20px',
                        textTransform: 'none',
                      },
                    }}
                  >
                    <Group gap={6} wrap="nowrap">
                      <Text
                        size="sm"
                        fw={600}
                        lh="20px"
                        style={{ color: statusPalette.badgeColor }}
                      >
                        {headerStatusName}
                      </Text>
                      {quickStatusMutation.isPending ? (
                        <Loader size={12} color={statusPalette.badgeColor} />
                      ) : (
                        <IconSelector
                          size={14}
                          color={statusPalette.badgeColor}
                        />
                      )}
                    </Group>
                  </Badge>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                {statusOptions.length === 0 ? (
                  <Menu.Label>Статусы не найдены</Menu.Label>
                ) : (
                  statusOptions.map((option) => (
                    <Menu.Item
                      key={option.value}
                      disabled={
                        quickStatusMutation.isPending ||
                        option.value === currentProjectStatusId
                      }
                      onClick={() => handleQuickStatusChange(option.value)}
                    >
                      {option.label}
                    </Menu.Item>
                  ))
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>

          <Menu
            withinPortal
            position="bottom-end"
            shadow="sm"
            styles={{
              dropdown: {
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 6,
                padding: 4,
              },
              item: {
                fontSize: 13,
                lineHeight: '18px',
                padding: '8px 10px',
              },
            }}
          >
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={28}
                disabled={isHeaderActionsPending}
              >
                {isHeaderActionsPending ? (
                  <Loader size={14} />
                ) : (
                  <IconDotsVertical size={20} />
                )}
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                disabled={isHeaderActionsPending}
                onClick={handleCopyProject}
              >
                Копировать проект
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                disabled={isHeaderActionsPending}
                onClick={handleDeleteProject}
              >
                Удалить проект
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab((value as ProjectTab) ?? 'main')}
      >
        <Tabs.List>
          <Tabs.Tab value="main" leftSection={<IconId size={12} />}>
            Основное
          </Tabs.Tab>
          <Tabs.Tab
            value="estimates"
            leftSection={<IconListDetails size={12} />}
          >
            Сметы
          </Tabs.Tab>
          <Tabs.Tab value="gallery" leftSection={<IconPhoto size={12} />}>
            Галерея
          </Tabs.Tab>
          <Tabs.Tab
            value="documents"
            leftSection={<IconFileInvoice size={12} />}
          >
            Документы
          </Tabs.Tab>
          <Tabs.Tab value="finances" leftSection={<IconWallet size={12} />}>
            Финансы
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'main' ? (
        <Paper
          radius="md"
          p={24}
          maw={666}
          w="100%"
          styles={{
            root: {
              alignSelf: 'flex-start',
            },
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap={16}>
              <TextInput
                label="Наименование"
                withAsterisk
                leftSection={<IconId size={16} />}
                {...form.getInputProps('name')}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                <Select
                  label="Статус"
                  leftSection={<IconHierarchy2 size={16} />}
                  data={statusOptions}
                  searchable
                  nothingFoundMessage="Статусы не найдены"
                  {...form.getInputProps('statusId')}
                />
                <Select
                  label="Клиент"
                  leftSection={<IconBriefcase size={16} />}
                  data={counterpartyOptions}
                  searchable
                  nothingFoundMessage="Клиенты не найдены"
                  {...form.getInputProps('counterpartyId')}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
                <DatePickerInput
                  label="Дата начала"
                  leftSection={<IconCalendarPlus size={16} />}
                  placeholder="Выберите дату"
                  clearable
                  valueFormat="DD.MM.YYYY"
                  value={form.values.startDate || null}
                  onChange={handleStartDateChange}
                  onBlur={() => {
                    form.validateField('startDate');
                    form.validateField('endDate');
                  }}
                  maxDate={form.values.endDate || undefined}
                  error={form.errors.startDate}
                />
                <DatePickerInput
                  label="Дата окончания"
                  leftSection={<IconCalendarPlus size={16} />}
                  placeholder="Выберите дату"
                  clearable
                  valueFormat="DD.MM.YYYY"
                  value={form.values.endDate || null}
                  onChange={handleEndDateChange}
                  onBlur={() => {
                    form.validateField('startDate');
                    form.validateField('endDate');
                  }}
                  minDate={form.values.startDate || undefined}
                  error={form.errors.endDate}
                />
              </SimpleGrid>

              <TextInput
                label="Адрес"
                leftSection={<IconMapPin size={16} />}
                {...form.getInputProps('address')}
              />

              <Box>
                <Textarea
                  label="Описание"
                  autosize
                  minRows={3}
                  maxRows={8}
                  styles={{
                    input: {
                      fontSize: 12,
                      lineHeight: '16px',
                    },
                  }}
                  {...form.getInputProps('description')}
                />
                <Text size="xxs" c="dimmed" ta="right" mt={4}>
                  {form.values.description.length}/{DESCRIPTION_MAX}
                </Text>
              </Box>

              <Group justify="flex-end">
                <Button
                  type="submit"
                  disabled={!form.isDirty() || updateProjectMutation.isPending}
                  loading={updateProjectMutation.isPending}
                >
                  Сохранить
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      ) : (
        <Paper radius="md" p={24}>
          <Text size="sm" c="dimmed">
            Раздел «
            {placeholderTitles[activeTab as Exclude<ProjectTab, 'main'>]}» пока
            в разработке.
          </Text>
        </Paper>
      )}
    </Stack>
  );
};

export default ProjectPage;
