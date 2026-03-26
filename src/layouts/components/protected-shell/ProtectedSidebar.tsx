import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ActionIcon,
  AppShell,
  Box,
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';
import { cloneElement, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../../providers/WorkspaceProvider';
import { getNavItems } from './constants';

type ProtectedSidebarProps = {
  pathname: string;
  collapsed: boolean;
  lockCollapsed?: boolean;
  onToggleSidebar: () => void;
};

const ProtectedSidebar = ({
  pathname,
  collapsed,
  lockCollapsed = false,
  onToggleSidebar,
}: ProtectedSidebarProps) => {
  const { activeWorkspaceId } = useWorkspace();
  const navItems = getNavItems(activeWorkspaceId ?? '');
  const isExpandedView = !collapsed;
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <AppShell.Navbar
      style={{
        background: 'var(--app-sidebar-bg)',
        borderRight: '1px solid var(--app-border)',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: isExpandedView ? 248 : 64,
          background: 'var(--app-sidebar-bg)',
          transition: 'width 120ms ease',
        }}
      >
        <Stack style={{ flex: 1 }} pt="16px">
          <Stack gap={0}>
            {navItems.map(({ label, icon, route, chevron }) => {
              const iconNode =
                !isExpandedView && isValidElement(icon)
                  ? cloneElement(icon, {
                      size: 20,
                    } as Record<string, unknown>)
                  : icon;
              const navLink = (
                <NavLink
                  p={isExpandedView ? '6px 10px' : '7px'}
                  key={route}
                  component={Link}
                  to={route}
                  label={
                    !isExpandedView ? (
                      <Box
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {iconNode}
                      </Box>
                    ) : (
                      <Text pl={'4px'} fz="16px">
                        {label}
                      </Text>
                    )
                  }
                  leftSection={!isExpandedView ? undefined : iconNode}
                  rightSection={
                    isExpandedView && chevron ? (
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    ) : undefined
                  }
                  style={
                    !isExpandedView ? { justifyContent: 'center' } : undefined
                  }
                  active={pathname.startsWith(route)}
                />
              );

              if (isExpandedView) return navLink;

              return (
                <Tooltip
                  key={route}
                  label={label}
                  position="right"
                  withArrow={false}
                  openDelay={120}
                  offset={0}
                  withinPortal
                  styles={{
                    tooltip: {
                      height: 34,
                      padding: '0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--app-sidebar-bg)',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      borderRadius: 4,
                    },
                  }}
                >
                  <Box>{navLink}</Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Stack>

        {!lockCollapsed && (
          <Group justify={!isExpandedView ? 'center' : 'end'} p="12px">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onToggleSidebar}
              aria-label="Свернуть боковое меню"
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={18} />
              ) : (
                <IconLayoutSidebarRightExpand size={18} />
              )}
            </ActionIcon>
          </Group>
        )}
      </Box>
    </AppShell.Navbar>
  );
};

export default ProtectedSidebar;
