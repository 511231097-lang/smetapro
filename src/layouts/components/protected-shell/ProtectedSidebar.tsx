import { ArrowRight01Icon, LayoutLeftIcon } from "@hugeicons/core-free-icons";
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
import { Link } from "react-router-dom";

import { useWorkspace } from "../../../providers/WorkspaceProvider";
import { getNavItems } from "./constants";
import { IconLayoutSidebarRightExpand } from "@tabler/icons-react";

type ProtectedSidebarProps = {
  pathname: string;
  onToggleSidebar: () => void;
};

const ProtectedSidebar = ({
  pathname,
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
            {navItems.map(({ label, icon, route, chevron }) => (
              <NavLink
                p="6px 10px"
                key={route}
                component={Link}
                to={route}
                label={
                  <Text pl={"4px"} fz="16px">
                    {label}
                  </Text>
                }
                leftSection={icon}
                rightSection={
                  chevron ? (
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  ) : undefined
                }
                active={pathname.startsWith(route)}
              />
            ))}
          </Stack>
        </Stack>

        <Group justify="end" p="12px">
          <ActionIcon
            variant="subtle"
            color="gray"
            // onClick={onToggleSidebar}
            aria-label="Свернуть боковое меню"
          >
            <IconLayoutSidebarRightExpand size={20} />
          </ActionIcon>
        </Group>
      </Box>
    </AppShell.Navbar>
  );
};

export default ProtectedSidebar;
