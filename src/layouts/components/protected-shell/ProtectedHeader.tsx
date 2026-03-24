import { Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { usePrimaryColor } from '../../../providers/PrimaryColorProvider';

import type { WorkspacesWorkspaceResponse } from '../../../shared/api/generated/schemas';
import { buildRoute, ROUTES } from '../../../shared/constants/routes';
import WorkspaceMenu from './WorkspaceMenu';

type ProtectedHeaderProps = {
  email: string;
  initials: string;
  activeWorkspace?: WorkspacesWorkspaceResponse;
  workspaceList: WorkspacesWorkspaceResponse[];
  onOpenMobileMenu: () => void;
  onWorkspaceSelect: (id: string | null) => void;
  onGoToProfile: () => void;
  onLogout: () => void;
};

const ProtectedHeader = ({
  email,
  initials,
  activeWorkspace,
  workspaceList,
  onOpenMobileMenu,
  onWorkspaceSelect,
  onGoToProfile,
  onLogout,
}: ProtectedHeaderProps) => {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';
  const { primaryColor } = usePrimaryColor();
  const projectsRoute = activeWorkspace?.id
    ? buildRoute(ROUTES.PROJECTS, { workspaceId: activeWorkspace.id })
    : ROUTES.ROOT;

  return (
    <AppShell.Header
      style={{
        background: 'var(--app-header-bg)',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      <Group h="100%" px={16} justify="space-between" wrap="nowrap">
        <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Link
            to={projectsRoute}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={isDark ? '/logo_dark.svg' : '/logo_light.svg'}
              alt="СМЕТЧИК ПРО"
              width={187}
              height={19}
            />
          </Link>

          <WorkspaceMenu
            activeWorkspace={activeWorkspace}
            workspaceList={workspaceList}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        </Group>

        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            hiddenFrom="sm"
            onClick={onOpenMobileMenu}
            aria-label="Открыть меню"
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </ActionIcon>

          <Box visibleFrom="sm">
            <Menu
              position="bottom-end"
              width={200}
              withinPortal
              styles={{
                dropdown: {
                  padding: 4,
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 4,
                },
                item: {
                  padding: '4px 12px',
                  fontSize: 12,
                  gap: 8,
                  borderRadius: 4,
                },
                divider: { margin: '4px 0' },
              }}
            >
              <Menu.Target>
                <UnstyledButton aria-label="Профиль" style={{ marginLeft: 4 }}>
                  <Avatar
                    color={primaryColor}
                    variant="filled"
                    radius="xl"
                    size={34}
                  >
                    {initials}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                {/* User info header */}
                <Box px={12} pt={8} pb={4}>
                  <Text fw={700} fz={12} lh="16px">
                    {email}
                  </Text>
                </Box>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconUser size={12} />}
                  onClick={onGoToProfile}
                >
                  Профиль
                </Menu.Item>
                <Menu.Item leftSection={<IconInfoCircle size={12} />}>
                  Справочник
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    isDark ? <IconSun size={12} /> : <IconMoon size={12} />
                  }
                  onClick={() => toggleColorScheme()}
                >
                  {isDark ? 'Светлая тема' : 'Темная тема'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={12} />}
                  color="red"
                  onClick={onLogout}
                >
                  Выйти
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        </Group>
      </Group>
    </AppShell.Header>
  );
};

export default ProtectedHeader;
