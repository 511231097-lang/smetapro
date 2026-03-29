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
          width: isExpandedView ? 248 : 60,
          background: 'var(--app-sidebar-bg)',
          transition: 'width 120ms ease',
        }}
      >
        <Stack style={{ flex: 1 }} pt="16px">
          <Stack gap={0}>
            {navItems.map(({ label, icon, route, chevron }) => {
              const isItemActive = pathname.startsWith(route);
              const iconNode =
                !isExpandedView && isValidElement(icon)
                  ? cloneElement(icon, {
                      size: 20,
                    } as Record<string, unknown>)
                  : icon;
              const navLink = (
                <NavLink
                  p={isExpandedView ? '6px 10px' : undefined}
                  mih={isExpandedView ? undefined : 36}
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
                  styles={
                    !isExpandedView
                      ? {
                          root: {
                            minHeight: 36,
                            padding: '8px 12px',
                            justifyContent: 'center',
                            borderRadius: 4,
                            color: isItemActive
                              ? 'var(--app-accent)'
                              : 'var(--mantine-color-text)',
                            backgroundColor: isItemActive
                              ? 'var(--app-accent-soft)'
                              : 'transparent',
                            transition:
                              'background-color 120ms ease, color 120ms ease',
                            '&:hover': {
                              color: 'var(--app-accent)',
                              backgroundColor: isItemActive
                                ? 'var(--app-accent-soft)'
                                : 'transparent',
                            },
                          },
                          section: {
                            margin: 0,
                          },
                        }
                      : undefined
                  }
                  aria-label={!isExpandedView ? label : undefined}
                  active={isExpandedView ? isItemActive : undefined}
                />
              );

              if (isExpandedView) return navLink;

              return (
                <Tooltip
                  key={route}
                  label={label}
                  position="right"
                  withArrow
                  arrowSize={4}
                  openDelay={120}
                  offset={2}
                  withinPortal
                  styles={{
                    tooltip: {
                      padding: 8,
                      fontSize: 12,
                      lineHeight: '16px',
                      fontWeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      background: '#212529',
                      color: '#ffffff',
                      borderRadius: 4,
                    },
                    arrow: {
                      background: '#212529',
                    },
                  }}
                >
                  {navLink}
                </Tooltip>
              );
            })}
          </Stack>
        </Stack>

        {!lockCollapsed && (
          <Group justify="flex-end" p="12px">
            <ActionIcon
              variant="transparent"
              color="gray"
              size={20}
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
