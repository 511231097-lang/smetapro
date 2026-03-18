import {
  Add01FreeIcons,
  ArrowRight01Icon,
  ArrowUpDownFreeIcons,
  Book01Icon,
  Building01Icon,
  Cancel01Icon,
  Coins01Icon,
  HelpCircleIcon,
  Home01FreeIcons,
  LayoutLeftIcon,
  Menu01Icon,
  Notification01FreeIcons,
  Search01Icon,
  Settings01FreeIcons,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Center,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  NavLink,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  useWorkspace,
  WorkspaceProvider,
} from '../providers/WorkspaceProvider';
import type { AuthSuccessResponse } from '../shared/api/generated/schemas';
import {
  useGetAuthMe,
  useGetWorkspaces,
} from '../shared/api/generated/smetchik';
import { ROUTES } from '../shared/constants/routes';

type ProtectedShellProps = {
  user: AuthSuccessResponse;
};

const WS_COLORS = [
  'teal',
  'blue',
  'violet',
  'orange',
  'pink',
  'green',
  'red',
  'indigo',
  'cyan',
  'grape',
];

const wsInitials = (name?: string | null): string => {
  if (!name) return 'WS';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const wsColor = (id?: string | null): string => {
  if (!id) return 'teal';
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return WS_COLORS[hash % WS_COLORS.length] as string;
};

const NAV_ITEMS = [
  {
    label: 'Проекты',
    icon: Home01FreeIcons,
    route: ROUTES.PROJECTS,
    chevron: true,
  },
  {
    label: 'Финансы',
    icon: Coins01Icon,
    route: ROUTES.FINANCES,
    chevron: false,
  },
  {
    label: 'Справочники',
    icon: Book01Icon,
    route: '/references',
    chevron: false,
  },
];

const ProtectedShell = ({ user }: ProtectedShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpened, { open: openMobileMenu, close: closeMobileMenu }] =
    useDisclosure(false);
  const [sidebarCollapsed, { toggle: toggleSidebar }] = useDisclosure(false);
  const [searchOpen, { toggle: toggleSearch, close: closeSearch }] =
    useDisclosure(false);
  const { activeWorkspace, workspaceList, setActiveWorkspaceId } =
    useWorkspace();

  const email = user?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase() || 'U';

  // biome-ignore lint/correctness/useExhaustiveDependencies: location is intentional trigger
  useEffect(() => {
    closeMobileMenu();
  }, [closeMobileMenu, location]);

  return (
    <>
      <AppShell
        header={{ height: 59 }}
        navbar={{
          width: 248,
          breakpoint: 'sm',
          collapsed: { mobile: true, desktop: sidebarCollapsed },
        }}
      >
        {/* ─── HEADER ─────────────────────────────────── */}
        <AppShell.Header
          style={{
            background: '#fff',
            borderBottom: '1px solid var(--app-border)',
          }}
        >
          <Group h="100%" px={16} justify="space-between" wrap="nowrap">
            {/* Left: Logo + Workspace picker */}
            <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Link
                to={ROUTES.PROJECTS}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  marginRight: 16,
                }}
              >
                <img src="/logo_light.svg" alt="СМЕТЧИК ПРО" height={18} />
              </Link>

              {/* Workspace picker — desktop only */}
              <Menu position="bottom-start" width={300} withinPortal>
                <Menu.Target>
                  <UnstyledButton
                    visibleFrom="sm"
                    style={{
                      padding: '5px 8px',
                      borderRadius: 8,
                    }}
                  >
                    <Group gap={8} wrap="nowrap">
                      <Avatar
                        size={28}
                        radius={8}
                        color={wsColor(activeWorkspace?.id)}
                        variant="filled"
                        style={{ fontSize: 11, fontWeight: 700 }}
                      >
                        {wsInitials(activeWorkspace?.name)}
                      </Avatar>
                      <Text
                        size="sm"
                        fw={500}
                        style={{ maxWidth: 130 }}
                        truncate
                      >
                        {activeWorkspace?.name ?? '—'}
                      </Text>
                      <HugeiconsIcon
                        icon={ArrowUpDownFreeIcons}
                        size={12}
                        style={{
                          color: 'var(--mantine-color-dimmed)',
                          flexShrink: 0,
                        }}
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown
                  p={0}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                >
                  {/* Активное пространство */}
                  <Box px={16} pt={16} pb={12}>
                    <Group gap={12} align="flex-start" wrap="nowrap">
                      <Avatar
                        size={56}
                        radius={14}
                        color={wsColor(activeWorkspace?.id)}
                        variant="filled"
                        style={{ fontSize: 20, fontWeight: 700, flexShrink: 0 }}
                      >
                        {wsInitials(activeWorkspace?.name)}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                        <Text fw={700} size="lg" truncate lh={1.3}>
                          {activeWorkspace?.name ?? '—'}
                        </Text>
                        {activeWorkspace?.description && (
                          <Text size="sm" c="dimmed" truncate mt={2}>
                            {activeWorkspace.description}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Box>

                  {/* Профиль пространства */}
                  <Box px={12} pb={12}>
                    <UnstyledButton
                      component={Link}
                      to={ROUTES.WORKSPACE_PROFILE.replace(
                        ':workspaceId',
                        activeWorkspace?.id ?? '',
                      )}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '7px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--app-border)',
                      }}
                    >
                      <Group gap={8}>
                        <HugeiconsIcon
                          icon={Settings01FreeIcons}
                          size={14}
                          style={{ color: 'var(--mantine-color-dimmed)' }}
                        />
                        <Text size="sm" c="dimmed">
                          Профиль пространства
                        </Text>
                      </Group>
                    </UnstyledButton>
                  </Box>

                  {/* Прочие пространства */}
                  {workspaceList.filter((ws) => ws.id !== activeWorkspace?.id)
                    .length > 0 && (
                    <>
                      <Divider />
                      <Box py={8}>
                        {workspaceList
                          .filter((ws) => ws.id !== activeWorkspace?.id)
                          .map((ws) => (
                            <UnstyledButton
                              key={ws.id}
                              onClick={() =>
                                setActiveWorkspaceId(ws.id ?? null)
                              }
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                              }}
                            >
                              <Group gap={12} wrap="nowrap">
                                <Avatar
                                  size={36}
                                  radius={8}
                                  color={wsColor(ws.id)}
                                  variant="filled"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {wsInitials(ws.name)}
                                </Avatar>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <Text fw={600} size="sm" truncate>
                                    {ws.name}
                                  </Text>
                                  {ws.description && (
                                    <Text size="xs" c="dimmed" truncate>
                                      {ws.description}
                                    </Text>
                                  )}
                                </Box>
                              </Group>
                            </UnstyledButton>
                          ))}
                      </Box>
                    </>
                  )}

                  {/* Новое пространство */}
                  <Box py={8} pb={12}>
                    <UnstyledButton
                      component={Link}
                      to={ROUTES.WORKSPACE_CREATE}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 16px',
                      }}
                    >
                      <Group gap={12} wrap="nowrap">
                        <Avatar
                          size={36}
                          radius={8}
                          color="gray"
                          variant="light"
                          style={{ flexShrink: 0 }}
                        >
                          <HugeiconsIcon icon={Add01FreeIcons} size={18} />
                        </Avatar>
                        <Text size="sm">Новое пространство</Text>
                      </Group>
                    </UnstyledButton>
                  </Box>
                </Menu.Dropdown>
              </Menu>
            </Group>

            {/* Desktop inline search (visible when open) */}
            {searchOpen && (
              <Box visibleFrom="sm" style={{ flex: 1, margin: '0 16px' }}>
                <TextInput
                  autoFocus
                  leftSection={<HugeiconsIcon icon={Search01Icon} size={16} />}
                  placeholder="Найти смету, проекты, сотрудника..."
                  radius="md"
                  size="sm"
                  rightSection={
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={closeSearch}
                      aria-label="Закрыть поиск"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </ActionIcon>
                  }
                />
              </Box>
            )}

            {/* Right zone */}
            <Group gap={4} wrap="nowrap">
              {/* Mobile: search icon */}
              <ActionIcon
                variant="subtle"
                color="gray"
                hiddenFrom="sm"
                aria-label="Поиск"
              >
                <HugeiconsIcon icon={Search01Icon} size={20} />
              </ActionIcon>
              {/* Mobile: burger */}
              <ActionIcon
                variant="subtle"
                color="gray"
                hiddenFrom="sm"
                onClick={openMobileMenu}
                aria-label="Открыть меню"
              >
                <HugeiconsIcon icon={Menu01Icon} size={20} />
              </ActionIcon>

              {/* Desktop: search toggle */}
              <ActionIcon
                variant="subtle"
                color="gray"
                visibleFrom="sm"
                onClick={toggleSearch}
                aria-label="Поиск"
              >
                <HugeiconsIcon icon={Search01Icon} size={20} />
              </ActionIcon>

              {/* Desktop: notifications */}
              <ActionIcon
                variant="subtle"
                color="gray"
                visibleFrom="sm"
                aria-label="Уведомления"
              >
                <HugeiconsIcon icon={Notification01FreeIcons} size={20} />
              </ActionIcon>

              {/* Avatar / user menu */}
              <Menu position="bottom-end" width={200} withinPortal>
                <Menu.Target>
                  <UnstyledButton
                    aria-label="Профиль"
                    style={{ marginLeft: 4 }}
                  >
                    <Avatar color="teal" variant="filled" radius="xl" size={34}>
                      {initials}
                    </Avatar>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{email || 'Профиль'}</Menu.Label>
                  <Menu.Item onClick={() => navigate(ROUTES.PROFILE_COMMON)}>
                    Мой профиль
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    onClick={() => navigate(ROUTES.LOGOUT)}
                  >
                    Выйти
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </AppShell.Header>

        {/* ─── SIDEBAR ────────────────────────────────── */}
        <AppShell.Navbar
          style={{
            background: '#fff',
            borderRight: '1px solid var(--app-border)',
          }}
        >
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              padding: '8px 0',
            }}
          >
            <Stack gap={2} style={{ flex: 1 }}>
              {NAV_ITEMS.map(({ label, icon, route, chevron }) => (
                <NavLink
                  key={route}
                  component={Link}
                  to={route}
                  label={label}
                  leftSection={<HugeiconsIcon icon={icon} size={18} />}
                  rightSection={
                    chevron ? (
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    ) : undefined
                  }
                  active={location.pathname.startsWith(route)}
                  style={{ margin: '0 8px', borderRadius: 6 }}
                />
              ))}
            </Stack>

            {/* Collapse toggle */}
            <Box
              style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--app-border)',
              }}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={toggleSidebar}
                aria-label="Свернуть боковое меню"
              >
                <HugeiconsIcon icon={LayoutLeftIcon} size={20} />
              </ActionIcon>
            </Box>
          </Box>
        </AppShell.Navbar>

        {/* ─── MAIN ───────────────────────────────────── */}
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      {/* ─── MOBILE MENU DRAWER ─────────────────────── */}
      <Drawer
        opened={mobileMenuOpened}
        onClose={closeMobileMenu}
        position="right"
        size={300}
        withCloseButton={false}
        styles={{ body: { padding: 0 } }}
      >
        {/* Drawer header */}
        <Group
          justify="space-between"
          align="center"
          px={16}
          py={14}
          style={{ borderBottom: '1px solid var(--app-border)' }}
        >
          <Text fw={600} size="md">
            Меню
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={closeMobileMenu}
            aria-label="Закрыть"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </ActionIcon>
        </Group>

        <Box style={{ overflowY: 'auto', height: 'calc(100% - 53px)' }}>
          {/* Profile */}
          <UnstyledButton
            component={Link}
            to={ROUTES.PROFILE_COMMON}
            style={{ display: 'block', width: '100%', padding: '16px' }}
          >
            <Group gap={12}>
              <Avatar color="teal" variant="filled" radius="xl" size={40}>
                {initials}
              </Avatar>
              <Box>
                <Text fw={600} size="sm">
                  Мой профиль
                </Text>
                <Text size="xs" c="dimmed">
                  Перейти в профиль
                </Text>
              </Box>
            </Group>
          </UnstyledButton>

          <Divider />

          {/* Workspace */}
          <Box px={16} py={12}>
            <Text
              size="xs"
              c="dimmed"
              fw={600}
              mb={8}
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Пространство
            </Text>
            <Menu position="bottom" width={240} withinPortal>
              <Menu.Target>
                <UnstyledButton style={{ width: '100%' }}>
                  <Group justify="space-between" align="center">
                    <Group gap={8}>
                      <Avatar
                        size={24}
                        radius="sm"
                        color="teal"
                        variant="light"
                      >
                        <HugeiconsIcon icon={Building01Icon} size={12} />
                      </Avatar>
                      <Text size="sm">{activeWorkspace?.name ?? '—'}</Text>
                    </Group>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Выберите пространство</Menu.Label>
                {workspaceList.map((ws) => (
                  <Menu.Item
                    key={ws.id}
                    onClick={() => setActiveWorkspaceId(ws.id ?? null)}
                  >
                    {ws.name}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Box>

          <Divider />

          {/* Navigation */}
          <Box px={16} py={12}>
            <Text
              size="xs"
              c="dimmed"
              fw={600}
              mb={8}
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Навигация
            </Text>
            <Stack gap={2}>
              {NAV_ITEMS.map(({ label, icon, route, chevron }) => (
                <NavLink
                  key={route}
                  component={Link}
                  to={route}
                  label={label}
                  leftSection={<HugeiconsIcon icon={icon} size={18} />}
                  rightSection={
                    chevron ? (
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    ) : undefined
                  }
                  active={location.pathname.startsWith(route)}
                  style={{ borderRadius: 6 }}
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Help */}
          <Box px={16} py={12}>
            <Text
              size="xs"
              c="dimmed"
              fw={600}
              mb={8}
              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Помощь
            </Text>
            <NavLink
              label="О сервисе"
              leftSection={<HugeiconsIcon icon={HelpCircleIcon} size={18} />}
              style={{ borderRadius: 6 }}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

const ProtectedLayout = () => {
  const location = useLocation();
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

  return (
    <WorkspaceProvider workspaces={workspaceList}>
      <ProtectedShell user={user} />
    </WorkspaceProvider>
  );
};

export default ProtectedLayout;
