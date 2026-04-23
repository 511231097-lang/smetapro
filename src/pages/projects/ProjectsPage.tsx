import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsSort,
  IconBriefcase,
  IconCalendarTime,
  IconCopy,
  IconDotsVertical,
  IconFilter,
  IconLayoutGrid,
  IconListDetails,
  IconPlus,
  IconSearch,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ProjectsProjectResponse } from '../../shared/api/generated/schemas/projectsProjectResponse';
import {
  getGetWorkspacesWorkspaceIdProjectsQueryKey,
  useDeleteWorkspacesWorkspaceIdProjectsProjectId,
  useGetWorkspacesWorkspaceIdProjects,
  usePostWorkspacesWorkspaceIdProjects,
  usePostWorkspacesWorkspaceIdProjectsProjectIdCopy,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { buildRoute, ROUTES } from '../../shared/constants/routes';

type SortField = 'name' | 'counterparty' | 'start_date' | 'status';
type SortDirection = 'asc' | 'desc';

type ColumnConfig = {
  filterable?: boolean;
  key: 'name' | 'counterparty' | 'period' | 'status';
  label: string;
  sortBy?: SortField;
  width?: number;
};

type StatusPalette = {
  badgeBg: string;
  badgeColor: string;
  dotColor: string;
  stripeColor: string;
};

type CreateProjectFormValues = {
  name: string;
};

type ViewMode = 'table' | 'grid';

const VIEW_MODE_STORAGE_KEY = 'smetapro.projects.viewMode';
const FOLDER_STATUS_WIDTH = 150;
const FOLDER_STATUS_HEIGHT = 8;
const FOLDER_SIDE_HEIGHT = 15;
const FOLDER_TOP_RIGHT_PADDING = 28;
const FOLDER_TAB_CONNECTOR_WIDTH = 23.8486;
const CREATE_PROJECT_CONNECTOR_OVERLAP = 3;

const isViewMode = (value: string | null): value is ViewMode =>
  value === 'table' || value === 'grid';

const getInitialViewMode = (): ViewMode => {
  if (typeof window === 'undefined') return 'grid';

  try {
    const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return isViewMode(saved) ? saved : 'grid';
  } catch {
    return 'grid';
  }
};

const COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Наименование', sortBy: 'name', filterable: false },
  {
    key: 'counterparty',
    label: 'Клиент',
    sortBy: 'counterparty',
    width: 210,
    filterable: false,
  },
  { key: 'period', label: 'Сроки', sortBy: 'start_date', width: 210 },
  { key: 'status', label: 'Статус', sortBy: 'status', width: 221 },
];

const STATUS_PALETTES_LIGHT: Record<string, StatusPalette> = {
  черновик: {
    badgeBg: 'var(--mantine-color-gray-light)',
    badgeColor: 'var(--mantine-color-gray-light-color)',
    dotColor: 'var(--mantine-color-gray-6)',
    stripeColor: 'var(--mantine-color-gray-6)',
  },
  'на согласовании': {
    badgeBg: 'var(--mantine-color-yellow-light)',
    badgeColor: 'var(--mantine-color-yellow-light-color)',
    dotColor: 'var(--mantine-color-yellow-6)',
    stripeColor: 'var(--mantine-color-yellow-6)',
  },
  'в работе': {
    badgeBg: 'var(--mantine-color-indigo-light)',
    badgeColor: 'var(--mantine-color-indigo-light-color)',
    dotColor: 'var(--mantine-color-indigo-6)',
    stripeColor: 'var(--mantine-color-indigo-6)',
  },
  приостановлен: {
    badgeBg: 'var(--mantine-color-red-light)',
    badgeColor: 'var(--mantine-color-red-light-color)',
    dotColor: 'var(--mantine-color-red-6)',
    stripeColor: 'var(--mantine-color-red-6)',
  },
  завершен: {
    badgeBg: 'var(--mantine-color-teal-light)',
    badgeColor: 'var(--mantine-color-teal-light-color)',
    dotColor: 'var(--mantine-color-teal-6)',
    stripeColor: 'var(--mantine-color-teal-6)',
  },
};

const STATUS_PALETTES_DARK: Record<string, StatusPalette> = {
  черновик: {
    badgeBg: 'var(--mantine-color-gray-light)',
    badgeColor: 'var(--mantine-color-gray-light-color)',
    dotColor: 'var(--mantine-color-gray-4)',
    stripeColor: 'var(--mantine-color-gray-5)',
  },
  'на согласовании': {
    badgeBg: 'var(--mantine-color-yellow-light)',
    badgeColor: 'var(--mantine-color-yellow-light-color)',
    dotColor: 'var(--mantine-color-yellow-4)',
    stripeColor: 'var(--mantine-color-yellow-5)',
  },
  'в работе': {
    badgeBg: 'var(--mantine-color-indigo-light)',
    badgeColor: 'var(--mantine-color-indigo-light-color)',
    dotColor: 'var(--mantine-color-indigo-4)',
    stripeColor: 'var(--mantine-color-indigo-5)',
  },
  приостановлен: {
    badgeBg: 'var(--mantine-color-red-light)',
    badgeColor: 'var(--mantine-color-red-light-color)',
    dotColor: 'var(--mantine-color-red-4)',
    stripeColor: 'var(--mantine-color-red-5)',
  },
  завершен: {
    badgeBg: 'var(--mantine-color-teal-light)',
    badgeColor: 'var(--mantine-color-teal-light-color)',
    dotColor: 'var(--mantine-color-teal-4)',
    stripeColor: 'var(--mantine-color-teal-5)',
  },
};

const ruShortDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

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

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось выполнить действие';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Не удалось выполнить действие';
};

const formatDate = (value: string | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return ruShortDate.format(date).replace(' г.', '');
};

const formatPeriod = (
  startDate: string | undefined,
  endDate: string | undefined,
) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start && end) return `${start} – ${end}`;
  if (start) return `с ${start}`;
  if (end) return `до ${end}`;
  return '—';
};

type FolderCardTopProps = {
  statusColor: string;
  sideColor: string;
};

const FolderTabConnector = ({ color }: { color: string }) => (
  <Box
    component="svg"
    width={FOLDER_TAB_CONNECTOR_WIDTH}
    height={FOLDER_SIDE_HEIGHT}
    viewBox="0 0 23.8486 15"
    aria-hidden="true"
    style={{
      display: 'block',
      flexShrink: 0,
      left: 1,
      position: 'relative',
      transform: 'scaleX(-1)',
      transformOrigin: 'center',
    }}
  >
    <path
      d="M0 0.0300909L2 0.0300945C2.23033 0.0300945 2.23033 0 8.23033 0C14.2303 0 17 5.02006 17 5.02006L23.8486 15L0 15V0.0300909Z"
      fill={color}
    />
  </Box>
);

const CreateProjectTabConnector = ({
  backgroundColor,
  strokeColor,
}: {
  backgroundColor: string;
  strokeColor: string;
}) => (
  <Box
    component="svg"
    width={FOLDER_TAB_CONNECTOR_WIDTH}
    height={FOLDER_SIDE_HEIGHT}
    viewBox="0 0 23.8486 15"
    aria-hidden="true"
    style={{
      display: 'block',
      flexShrink: 0,
      position: 'relative',
      transform: 'scaleX(-1)',
      transformOrigin: 'center',
    }}
  >
    <path
      d="M0 0.0300909L2 0.0300945C2.23033 0.0300945 2.23033 0 8.23033 0C14.2303 0 17 5.02006 17 5.02006L23.8486 15L0 15V0.0300909Z"
      fill={backgroundColor}
    />
    <path
      d="M0 0.0300909L2 0.0300945C2.23033 0.0300945 2.23033 0 8.23033 0C14.2303 0 17 5.02006 17 5.02006L23.8486 15L0 15"
      fill="none"
      stroke={strokeColor}
      strokeDasharray="2 2"
      vectorEffect="non-scaling-stroke"
    />
  </Box>
);

const FolderCardTop = ({ statusColor, sideColor }: FolderCardTopProps) => {
  return (
    <Box
      style={{
        alignItems: 'flex-end',
        display: 'flex',
        height: FOLDER_SIDE_HEIGHT,
        paddingRight: FOLDER_TOP_RIGHT_PADDING,
        position: 'relative',
        top: 1,
        width: '100%',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          marginRight: -FOLDER_TOP_RIGHT_PADDING,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            background: statusColor,
            borderTopLeftRadius: 8,
            height: FOLDER_STATUS_HEIGHT,
            width: FOLDER_STATUS_WIDTH,
          }}
        />
      </Box>
      <Box
        style={{
          alignItems: 'center',
          display: 'flex',
          flex: '1 0 0',
          marginRight: -FOLDER_TOP_RIGHT_PADDING,
          minWidth: 0,
          position: 'relative',
        }}
      >
        <FolderTabConnector color={sideColor} />
        <Box
          style={{
            background: sideColor,
            borderTopRightRadius: 8,
            flex: '1 0 0',
            height: FOLDER_SIDE_HEIGHT,
            minWidth: 0,
          }}
        />
      </Box>
    </Box>
  );
};

const CreateProjectCardTop = ({
  backgroundColor,
  strokeColor,
}: {
  backgroundColor: string;
  strokeColor: string;
}) => (
  <Box
    style={{
      alignItems: 'flex-end',
      display: 'flex',
      height: FOLDER_SIDE_HEIGHT,
      marginBottom: -1,
      paddingRight: FOLDER_TOP_RIGHT_PADDING,
      position: 'relative',
      width: '100%',
    }}
  >
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        marginRight: -FOLDER_TOP_RIGHT_PADDING,
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          border: `1px dashed ${strokeColor}`,
          borderTopLeftRadius: 8,
          boxSizing: 'border-box',
          height: FOLDER_STATUS_HEIGHT,
          width: FOLDER_STATUS_WIDTH,
        }}
      />
    </Box>

    <Box
      style={{
        alignItems: 'center',
        display: 'flex',
        flex: '1 0 0',
        marginRight: -FOLDER_TOP_RIGHT_PADDING,
        minWidth: 0,
        paddingRight: CREATE_PROJECT_CONNECTOR_OVERLAP,
        position: 'relative',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexShrink: 0,
          marginRight: -CREATE_PROJECT_CONNECTOR_OVERLAP,
        }}
      >
        <CreateProjectTabConnector
          backgroundColor={backgroundColor}
          strokeColor={strokeColor}
        />
      </Box>

      <Box
        style={{
          background: backgroundColor,
          borderBottom: `1px dashed ${strokeColor}`,
          borderRight: `1px dashed ${strokeColor}`,
          borderTop: `1px dashed ${strokeColor}`,
          borderTopRightRadius: 8,
          boxSizing: 'border-box',
          flex: '1 0 0',
          height: FOLDER_SIDE_HEIGHT,
          marginRight: -CREATE_PROJECT_CONNECTOR_OVERLAP,
          minWidth: 0,
        }}
      />
    </Box>
  </Box>
);

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: false,
  });
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [gridSortNewestFirst, setGridSortNewestFirst] = useState(true);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [deleteModalProject, setDeleteModalProject] =
    useState<ProjectsProjectResponse | null>(null);
  const [pendingActionProjectId, setPendingActionProjectId] = useState<
    string | null
  >(null);
  const createProjectForm = useForm<CreateProjectFormValues>({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? 'Введите наименование проекта' : null,
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // Ignore localStorage access errors
    }
  }, [viewMode]);

  const trimmedSearch = searchValue.trim();
  const hasSearch = trimmedSearch.length > 0;

  const listParams = useMemo(
    () => ({
      limit: 100,
      offset: 0,
      search: trimmedSearch || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [sortBy, sortDir, trimmedSearch],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetWorkspacesWorkspaceIdProjects(workspaceId ?? '', listParams, {
      query: {
        enabled: !!workspaceId,
      },
    });

  const projects = data?.projects ?? [];
  const gridProjects = useMemo(() => {
    const next = [...projects];
    next.sort((left, right) => {
      const leftTs = left.created_at ? Date.parse(left.created_at) : NaN;
      const rightTs = right.created_at ? Date.parse(right.created_at) : NaN;

      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return gridSortNewestFirst ? rightTs - leftTs : leftTs - rightTs;
      }

      if (!Number.isNaN(leftTs)) return gridSortNewestFirst ? -1 : 1;
      if (!Number.isNaN(rightTs)) return gridSortNewestFirst ? 1 : -1;

      const leftName = left.name?.trim().toLowerCase() ?? '';
      const rightName = right.name?.trim().toLowerCase() ?? '';
      return leftName.localeCompare(rightName, 'ru');
    });

    return next;
  }, [projects, gridSortNewestFirst]);

  const invalidateProjects = () => {
    if (!workspaceId) return;

    queryClient.invalidateQueries({
      queryKey: getGetWorkspacesWorkspaceIdProjectsQueryKey(workspaceId),
    });
  };

  const createProjectMutation = usePostWorkspacesWorkspaceIdProjects({
    mutation: {
      onSuccess: (response) => {
        const createdName =
          response.project?.name?.trim() ||
          createProjectForm.values.name.trim();

        notifications.show({
          color: 'teal',
          title: 'Проект создан',
          message: createdName
            ? `«${createdName}» добавлен в список.`
            : 'Проект добавлен в список.',
        });

        setCreateModalOpened(false);
        createProjectForm.reset();
        invalidateProjects();
      },
      onError: (mutationError) => {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(mutationError),
        });
      },
    },
  });

  const copyProjectMutation = usePostWorkspacesWorkspaceIdProjectsProjectIdCopy(
    {
      mutation: {
        onSuccess: (response) => {
          const copiedName = response.project?.name?.trim();

          notifications.show({
            color: 'teal',
            title: 'Проект скопирован',
            message: copiedName
              ? `Создана копия: «${copiedName}».`
              : 'Копия проекта успешно создана.',
          });
          invalidateProjects();
        },
        onError: (mutationError) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка копирования',
            message: getErrorMessage(mutationError),
          });
        },
        onSettled: () => {
          setPendingActionProjectId(null);
        },
      },
    },
  );

  const deleteProjectMutation = useDeleteWorkspacesWorkspaceIdProjectsProjectId(
    {
      mutation: {
        onSuccess: () => {
          const deletedName = deleteModalProject?.name?.trim();

          notifications.show({
            color: 'teal',
            title: 'Проект удален',
            message: deletedName
              ? `«${deletedName}» удален.`
              : 'Проект успешно удален.',
          });
          setDeleteModalProject(null);
          invalidateProjects();
        },
        onError: (mutationError) => {
          notifications.show({
            color: 'red',
            title: 'Ошибка удаления',
            message: getErrorMessage(mutationError),
          });
        },
        onSettled: () => {
          setPendingActionProjectId(null);
        },
      },
    },
  );

  const closeCreateProjectModal = () => {
    if (createProjectMutation.isPending) return;
    setCreateModalOpened(false);
    createProjectForm.reset();
  };

  const closeDeleteProjectModal = () => {
    if (deleteProjectMutation.isPending) return;
    setDeleteModalProject(null);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDir('asc');
  };

  const notifyListOnly = (title: string) => {
    notifications.show({
      color: 'blue',
      title,
      message: 'Фильтры и расширенные действия пока в разработке.',
    });
  };

  const handleCreateProject = createProjectForm.onSubmit((values) => {
    if (!workspaceId) return;

    createProjectMutation.mutate({
      workspaceId,
      data: {
        name: values.name.trim(),
      },
    });
  });

  const handleCopyProject = (project: ProjectsProjectResponse) => {
    const projectId = project.id;

    if (!workspaceId || !projectId) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Не удалось определить проект для копирования.',
      });
      return;
    }

    setPendingActionProjectId(projectId);
    copyProjectMutation.mutate({ workspaceId, projectId });
  };

  const handleRequestDeleteProject = (project: ProjectsProjectResponse) => {
    if (!project.id) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Не удалось определить проект для удаления.',
      });
      return;
    }

    setDeleteModalProject(project);
  };

  const getProjectRoute = (project: ProjectsProjectResponse) =>
    workspaceId && project.id
      ? buildRoute(ROUTES.PROJECT_DETAILS, {
          workspaceId,
          projectId: project.id,
        })
      : null;

  const shouldSkipProjectNavigation = (
    event: MouseEvent<HTMLElement>,
  ): boolean => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return true;
    }

    if (
      event.target instanceof Element &&
      event.target.closest('a,button,[role="button"]')
    ) {
      return true;
    }

    return false;
  };

  const handleDeleteProject = () => {
    const projectId = deleteModalProject?.id;
    if (!workspaceId || !projectId) return;

    setPendingActionProjectId(projectId);
    deleteProjectMutation.mutate({ workspaceId, projectId });
  };

  const SortIcon = ({ field, label }: { field: SortField; label: string }) => {
    const nextSortDirection =
      sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
    const sortActionLabel = `Сортировать столбец «${label}» ${
      nextSortDirection === 'asc' ? 'по возрастанию' : 'по убыванию'
    }`;

    const icon =
      sortBy !== field ? (
        <IconArrowsSort size={14} color="var(--mantine-color-gray-5)" />
      ) : sortDir === 'asc' ? (
        <IconSortAscendingLetters
          size={14}
          color="var(--mantine-color-teal-6)"
        />
      ) : (
        <IconSortDescendingLetters
          size={14}
          color="var(--mantine-color-teal-6)"
        />
      );

    return (
      <ActionIcon
        variant="transparent"
        color="gray"
        size={16}
        aria-label={sortActionLabel}
        title={sortActionLabel}
        onClick={(event) => {
          event.stopPropagation();
          handleSort(field);
        }}
      >
        {icon}
      </ActionIcon>
    );
  };

  const renderStatus = (statusName: string | undefined) => {
    const label = statusName?.trim() || '—';
    if (label === '—') {
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );
    }

    const palette = resolveStatusPalette(label, colorScheme);
    return (
      <Badge
        radius="xl"
        px={12}
        styles={{
          root: {
            backgroundColor: palette.badgeBg,
            border: 'none',
            minHeight: 24,
          },
          label: {
            color: palette.badgeColor,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            textTransform: 'none',
          },
        }}
      >
        {label}
      </Badge>
    );
  };

  const renderProjectName = (project: ProjectsProjectResponse) => {
    const statusPalette = resolveStatusPalette(
      project.status?.name,
      colorScheme,
    );
    const projectRoute = getProjectRoute(project);

    return (
      <Group gap={8} wrap="nowrap">
        <Box
          w={10}
          h={10}
          style={{
            borderRadius: '50%',
            background: statusPalette.dotColor,
            flexShrink: 0,
          }}
        />
        {projectRoute ? (
          <Text
            component={Link}
            to={projectRoute}
            size="sm"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              textDecorationColor: 'var(--mantine-color-default-border)',
              textUnderlineOffset: 3,
            }}
          >
            {project.name?.trim() || '—'}
          </Text>
        ) : (
          <Text
            size="sm"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              textDecorationColor: 'var(--mantine-color-default-border)',
              textUnderlineOffset: 3,
            }}
          >
            {project.name?.trim() || '—'}
          </Text>
        )}
      </Group>
    );
  };

  const renderActions = (project: ProjectsProjectResponse) => {
    const projectId = project.id ?? null;
    const isCopyPending =
      copyProjectMutation.isPending && pendingActionProjectId === projectId;
    const isDeletePending =
      deleteProjectMutation.isPending && pendingActionProjectId === projectId;
    const isActionPending = isCopyPending || isDeletePending;

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
            onClick={(event) => event.stopPropagation()}
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
            leftSection={<IconCopy size={12} />}
            disabled={!projectId || isActionPending}
            onClick={(event) => {
              event.stopPropagation();
              handleCopyProject(project);
            }}
          >
            Копировать проект
          </Menu.Item>
          <Menu.Item
            leftSection={<IconTrash size={12} />}
            color="red"
            disabled={!projectId || isActionPending}
            onClick={(event) => {
              event.stopPropagation();
              handleRequestDeleteProject(project);
            }}
          >
            Удалить
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  };

  const renderProjectCard = (project: ProjectsProjectResponse) => {
    const key = project.id ?? `${project.name}-${project.created_at}`;
    const palette = resolveStatusPalette(project.status?.name, colorScheme);
    const projectRoute = getProjectRoute(project);
    const counterpartyName = project.counterparty?.name?.trim() || null;
    const period = formatPeriod(project.start_date, project.end_date);
    const periodText = period === '—' ? null : period;

    return (
      <Box
        key={key}
        onClick={
          projectRoute
            ? (event) => {
                if (shouldSkipProjectNavigation(event)) return;
                navigate(projectRoute);
              }
            : undefined
        }
        style={{
          cursor: projectRoute ? 'pointer' : 'default',
        }}
      >
        <FolderCardTop
          statusColor={palette.stripeColor}
          sideColor="var(--mantine-color-default)"
        />
        <Paper
          withBorder={false}
          radius={0}
          p={16}
          style={{
            background: 'var(--mantine-color-default)',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            minHeight: 128,
            position: 'relative',
            zIndex: 3,
          }}
        >
          <Stack justify="space-between" h="100%" gap={16}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              {projectRoute ? (
                <Text
                  component={Link}
                  to={projectRoute}
                  fw={700}
                  size="md"
                  lh="20px"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    flex: 1,
                  }}
                >
                  {project.name?.trim() || '—'}
                </Text>
              ) : (
                <Text
                  fw={700}
                  size="md"
                  lh="20px"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    flex: 1,
                  }}
                >
                  {project.name?.trim() || '—'}
                </Text>
              )}
              {renderActions(project)}
            </Group>

            <Stack gap={8}>
              <Group
                gap={8}
                wrap="nowrap"
                style={{ visibility: counterpartyName ? 'visible' : 'hidden' }}
              >
                <IconBriefcase size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed" lh="20px">
                  {counterpartyName || '—'}
                </Text>
              </Group>

              <Group
                gap={8}
                wrap="nowrap"
                style={{ visibility: periodText ? 'visible' : 'hidden' }}
              >
                <IconCalendarTime
                  size={16}
                  color="var(--mantine-color-gray-6)"
                />
                <Text size="sm" c="dimmed" lh="20px">
                  {periodText || '—'}
                </Text>
              </Group>

              <Box>{renderStatus(project.status?.name)}</Box>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  };

  const renderCreateProjectCard = () => (
    <Box
      h="100%"
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CreateProjectCardTop
        backgroundColor="var(--app-page-bg)"
        strokeColor="var(--mantine-color-gray-6)"
      />

      <UnstyledButton
        onClick={() => setCreateModalOpened(true)}
        style={{
          alignItems: 'center',
          background: 'var(--app-page-bg)',
          borderBottom: '1px dashed var(--mantine-color-gray-6)',
          borderLeft: '1px dashed var(--mantine-color-gray-6)',
          borderRight: '1px dashed var(--mantine-color-gray-6)',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          color: 'var(--mantine-primary-color-filled)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: 8,
          justifyContent: 'center',
          minHeight: 128,
          width: '100%',
        }}
      >
        <IconPlus size={32} />
        <Text
          size="md"
          fw={600}
          lh="24px"
          style={{ color: 'var(--mantine-primary-color-filled)' }}
        >
          Создать проект
        </Text>
      </UnstyledButton>
    </Box>
  );

  return (
    <Stack gap={20} p={20}>
      <Title order={3}>Проекты</Title>

      <Paper withBorder={false} radius="md" p={12}>
        <Group justify="space-between" gap={8} wrap="nowrap">
          <Button
            size="sm"
            leftSection={<IconPlus size={16} />}
            style={{ flexShrink: 0 }}
            onClick={() => setCreateModalOpened(true)}
          >
            Создать проект
          </Button>

          <Group gap={8} wrap="nowrap">
            {searchExpanded ? (
              <TextInput
                value={searchValue}
                onChange={(event) => setSearchValue(event.currentTarget.value)}
                placeholder="Поиск по проектам..."
                aria-label="Поиск по проектам"
                leftSection={<IconSearch size={16} />}
                rightSection={
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={22}
                    aria-label="Очистить поиск"
                    title="Очистить поиск"
                    onClick={() => {
                      setSearchValue('');
                      setSearchExpanded(false);
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                }
                rightSectionPointerEvents="all"
                size="sm"
                style={{ width: 320 }}
              />
            ) : (
              <ActionIcon
                variant="default"
                color="gray"
                size={32}
                aria-label="Открыть поиск"
                title="Открыть поиск"
                onClick={() => setSearchExpanded(true)}
              >
                <IconSearch size={16} />
              </ActionIcon>
            )}

            <Divider orientation="vertical" />

            {viewMode === 'grid' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<IconArrowsSort size={16} />}
                  onClick={() => setGridSortNewestFirst((current) => !current)}
                >
                  {gridSortNewestFirst ? 'Сначала новые' : 'Сначала старые'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<IconFilter size={16} />}
                  onClick={() => notifyListOnly('Фильтр')}
                >
                  Фильтр
                </Button>
                <Divider orientation="vertical" />
              </>
            )}

            <Group
              gap={2}
              p={2}
              style={{
                background: 'var(--mantine-color-gray-light)',
                borderRadius: 4,
                height: 32,
                width: 62,
              }}
            >
              <ActionIcon
                variant="transparent"
                size={28}
                aria-label="Карточки"
                title="Карточки"
                onClick={() => setViewMode('grid')}
                style={{
                  background:
                    viewMode === 'grid'
                      ? 'var(--mantine-color-default)'
                      : 'transparent',
                  boxShadow:
                    viewMode === 'grid' ? 'var(--mantine-shadow-xs)' : 'none',
                  color:
                    viewMode === 'grid'
                      ? 'var(--mantine-color-text)'
                      : 'var(--mantine-color-gray-5)',
                }}
              >
                <IconLayoutGrid size={16} />
              </ActionIcon>
              <ActionIcon
                variant="transparent"
                size={28}
                aria-label="Таблица"
                title="Таблица"
                onClick={() => setViewMode('table')}
                style={{
                  background:
                    viewMode === 'table'
                      ? 'var(--mantine-color-default)'
                      : 'transparent',
                  boxShadow:
                    viewMode === 'table' ? 'var(--mantine-shadow-xs)' : 'none',
                  color:
                    viewMode === 'table'
                      ? 'var(--mantine-color-text)'
                      : 'var(--mantine-color-gray-5)',
                }}
              >
                <IconListDetails size={16} />
              </ActionIcon>
            </Group>
          </Group>
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
        <>
          <Box visibleFrom="sm">
            {viewMode === 'table' ? (
              <Paper
                withBorder={false}
                radius="md"
                style={{ overflow: 'hidden' }}
              >
                <Table
                  highlightOnHover
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
                    },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      {COLUMNS.map((column) => (
                        <Table.Th key={column.key} w={column.width}>
                          <Group justify="space-between" gap={8} wrap="nowrap">
                            <Text fw={600} size="sm">
                              {column.label}
                            </Text>
                            <Group gap={6} wrap="nowrap">
                              {column.filterable !== false && (
                                <ActionIcon
                                  variant="transparent"
                                  color="gray"
                                  size={16}
                                  aria-label={`Фильтр по колонке «${column.label}»`}
                                  title={`Фильтр по колонке «${column.label}»`}
                                  onClick={() => notifyListOnly('Фильтрация')}
                                >
                                  <IconFilter size={14} />
                                </ActionIcon>
                              )}
                              {column.sortBy && (
                                <SortIcon
                                  field={column.sortBy}
                                  label={column.label}
                                />
                              )}
                            </Group>
                          </Group>
                        </Table.Th>
                      ))}
                      <Table.Th w={38} />
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {projects.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={COLUMNS.length + 1}>
                          <Center py={36}>
                            <Text size="sm" c="dimmed">
                              {hasSearch
                                ? 'По вашему запросу ничего не найдено.'
                                : 'Проекты пока не созданы.'}
                            </Text>
                          </Center>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      projects.map((project) => {
                        const projectRoute = getProjectRoute(project);
                        return (
                          <Table.Tr
                            key={
                              project.id ??
                              `${project.name}-${project.created_at}`
                            }
                            onClick={
                              projectRoute
                                ? (event) => {
                                    if (shouldSkipProjectNavigation(event))
                                      return;
                                    navigate(projectRoute);
                                  }
                                : undefined
                            }
                            style={{
                              cursor: projectRoute ? 'pointer' : 'default',
                            }}
                          >
                            <Table.Td>{renderProjectName(project)}</Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {project.counterparty?.name?.trim() || '—'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {formatPeriod(
                                  project.start_date,
                                  project.end_date,
                                )}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {renderStatus(project.status?.name)}
                            </Table.Td>
                            <Table.Td>{renderActions(project)}</Table.Td>
                          </Table.Tr>
                        );
                      })
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : (
              <Stack gap={12}>
                {gridProjects.length === 0 && hasSearch && (
                  <Text size="sm" c="dimmed">
                    По вашему запросу ничего не найдено.
                  </Text>
                )}
                <SimpleGrid cols={{ base: 1, lg: 2, xl: 3 }} spacing={20}>
                  {gridProjects.map((project) => renderProjectCard(project))}
                  {renderCreateProjectCard()}
                </SimpleGrid>
              </Stack>
            )}
          </Box>

          <Box hiddenFrom="sm">
            {projects.length === 0 ? (
              <Center py={36}>
                <Text size="sm" c="dimmed">
                  {hasSearch
                    ? 'По вашему запросу ничего не найдено.'
                    : 'Проекты пока не созданы.'}
                </Text>
              </Center>
            ) : (
              <Stack gap={8}>
                {projects.map((project) => (
                  <Paper
                    key={project.id ?? `${project.name}-${project.created_at}`}
                    radius="md"
                    p={12}
                    withBorder
                  >
                    <Group justify="space-between" align="flex-start" gap={8}>
                      <Stack gap={6} style={{ flex: 1 }}>
                        {renderProjectName(project)}
                        <Text size="sm" c="dimmed">
                          Клиент: {project.counterparty?.name?.trim() || '—'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Сроки:{' '}
                          {formatPeriod(project.start_date, project.end_date)}
                        </Text>
                        <Box>{renderStatus(project.status?.name)}</Box>
                      </Stack>
                      {renderActions(project)}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        </>
      )}

      {isFetching && !isLoading && (
        <Text size="xs" c="dimmed">
          Обновляем список...
        </Text>
      )}

      <Modal
        opened={createModalOpened}
        onClose={closeCreateProjectModal}
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
        <form onSubmit={handleCreateProject} noValidate>
          <Stack gap={24}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="md" lh="24px" fw={400}>
                Новый проект
              </Text>
              <ActionIcon
                variant="transparent"
                color="gray"
                size={16}
                type="button"
                aria-label="Закрыть форму создания проекта"
                onClick={closeCreateProjectModal}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>

            <TextInput
              label="Наименование"
              description="Остальные параметры можно будет задать внутри проекта"
              placeholder="Например ЖК “Солнечный”"
              size="md"
              autoFocus
              disabled={createProjectMutation.isPending}
              styles={{
                label: {
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: '24px',
                  marginBottom: 0,
                },
                description: {
                  color: 'var(--mantine-color-gray-6)',
                  fontSize: 14,
                  lineHeight: '20px',
                  marginBottom: 4,
                },
                input: {
                  borderColor: 'var(--mantine-color-default-border)',
                  height: 40,
                  fontSize: 16,
                  lineHeight: '24px',
                  paddingLeft: 16,
                  paddingRight: 16,
                },
              }}
              {...createProjectForm.getInputProps('name')}
            />

            <Group justify="flex-end" gap={16}>
              <Button
                variant="default"
                type="button"
                size="sm"
                radius="sm"
                onClick={closeCreateProjectModal}
                disabled={createProjectMutation.isPending}
                styles={{
                  root: {
                    height: 32,
                    borderColor: 'var(--mantine-color-default-border)',
                  },
                  label: {
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: '20px',
                  },
                }}
              >
                Отменить
              </Button>
              <Button
                type="submit"
                size="sm"
                radius="sm"
                loading={createProjectMutation.isPending}
                disabled={!createProjectForm.values.name.trim()}
                styles={{
                  root: {
                    height: 32,
                    '&:disabled, &[data-disabled]': {
                      background: 'var(--mantine-color-gray-2)',
                      color: 'var(--mantine-color-gray-5)',
                    },
                  },
                  label: {
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: '20px',
                  },
                }}
              >
                Создать проект
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!deleteModalProject}
        onClose={closeDeleteProjectModal}
        withCloseButton={false}
        centered
        radius="sm"
        size={420}
        padding={16}
      >
        <Stack gap={16}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="md" lh="24px">
              Удалить проект
            </Text>
            <ActionIcon
              variant="transparent"
              color="gray"
              size={16}
              type="button"
              aria-label="Закрыть форму удаления проекта"
              disabled={deleteProjectMutation.isPending}
              onClick={closeDeleteProjectModal}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>

          <Text size="sm" c="dimmed">
            {deleteModalProject?.name?.trim()
              ? `Проект «${deleteModalProject.name.trim()}» будет удален без возможности восстановления.`
              : 'Проект будет удален без возможности восстановления.'}
          </Text>

          <Group justify="flex-end" gap={12}>
            <Button
              variant="default"
              type="button"
              disabled={deleteProjectMutation.isPending}
              onClick={closeDeleteProjectModal}
            >
              Отменить
            </Button>
            <Button
              color="red"
              type="button"
              loading={deleteProjectMutation.isPending}
              onClick={handleDeleteProject}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ProjectsPage;
