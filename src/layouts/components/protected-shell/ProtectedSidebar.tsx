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
} from '@mantine/core';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { useWorkspace } from '../../../providers/WorkspaceProvider';
import { getNavItems } from './constants';
import {
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';

type ProtectedSidebarProps = {
  pathname: string;
  collapsed: boolean;
  lockCollapsed?: boolean;
  onToggleSidebar: () => void;
};

const HOVER_COLLAPSE_DELAY_MS = 300;

const ProtectedSidebar = ({
  pathname,
  collapsed,
  lockCollapsed = false,
  onToggleSidebar,
}: ProtectedSidebarProps) => {
  const [hovered, setHovered] = useState(false);
  const collapseTimeoutRef = useRef<number | null>(null);
  const { activeWorkspaceId } = useWorkspace();
  const navItems = getNavItems(activeWorkspaceId ?? '');
  const isHoverExpanded = collapsed && hovered;
  const isExpandedView = !collapsed || isHoverExpanded;

  useEffect(() => {
    if (collapsed) {
      setHovered(false);
    }
  }, [pathname, collapsed]);

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current !== null) {
        window.clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AppShell.Navbar
      onMouseEnter={() => {
        if (collapseTimeoutRef.current !== null) {
          window.clearTimeout(collapseTimeoutRef.current);
          collapseTimeoutRef.current = null;
        }
        if (collapsed) setHovered(true);
      }}
      onMouseLeave={() => {
        if (collapseTimeoutRef.current !== null) {
          window.clearTimeout(collapseTimeoutRef.current);
        }
        collapseTimeoutRef.current = window.setTimeout(() => {
          setHovered(false);
          collapseTimeoutRef.current = null;
        }, HOVER_COLLAPSE_DELAY_MS);
      }}
      style={{
        background: collapsed ? 'transparent' : 'var(--app-sidebar-bg)',
        borderRight: collapsed ? 'none' : '1px solid var(--app-border)',
        overflow: 'visible',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: isExpandedView ? 248 : 64,
          position: collapsed ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          background: 'var(--app-sidebar-bg)',
          borderRight: '1px solid var(--app-border)',
          boxShadow: isHoverExpanded
            ? '0 12px 30px rgba(0, 0, 0, 0.12)'
            : 'none',
          zIndex: isHoverExpanded ? 50 : 1,
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

              return (
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
