import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActionIcon,
  AppShell,
  Box,
  Group,
  NavLink,
  Stack,
  Text,
} from "@mantine/core";
import { cloneElement, isValidElement } from "react";
import { Link } from "react-router-dom";

import { useWorkspace } from "../../../providers/WorkspaceProvider";
import { getNavItems } from "./constants";
import {
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";

type ProtectedSidebarProps = {
  pathname: string;
  collapsed: boolean;
  onToggleSidebar: () => void;
};

const ProtectedSidebar = ({
  pathname,
  collapsed,
  onToggleSidebar,
}: ProtectedSidebarProps) => {
  const { activeWorkspaceId } = useWorkspace();
  const navItems = getNavItems(activeWorkspaceId ?? "");
  return (
    <AppShell.Navbar
      style={{
        background: "var(--app-sidebar-bg)",
        borderRight: "1px solid var(--app-border)",
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Stack style={{ flex: 1 }} pt="16px">
          <Stack gap={0}>
            {navItems.map(({ label, icon, route, chevron }) => {
              const iconNode =
                collapsed && isValidElement(icon)
                  ? cloneElement(icon, {
                      size: 20,
                    } as Record<string, unknown>)
                  : icon;

              return (
                <NavLink
                  p={collapsed ? "7px" : "6px 10px"}
                  key={route}
                  component={Link}
                  to={route}
                  label={
                    collapsed ? (
                      <Box
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {iconNode}
                      </Box>
                    ) : (
                      <Text pl={"4px"} fz="16px">
                        {label}
                      </Text>
                    )
                  }
                  leftSection={collapsed ? undefined : iconNode}
                  rightSection={
                    !collapsed && chevron ? (
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    ) : undefined
                  }
                  style={collapsed ? { justifyContent: "center" } : undefined}
                  active={pathname.startsWith(route)}
                />
              );
            })}
          </Stack>
        </Stack>

        <Group justify={collapsed ? "center" : "end"} p="12px">
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
      </Box>
    </AppShell.Navbar>
  );
};

export default ProtectedSidebar;
