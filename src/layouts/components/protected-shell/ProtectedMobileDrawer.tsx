import {
  ArrowRight01Icon,
  Building01Icon,
  Cancel01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActionIcon,
  Avatar,
  Box,
  Divider,
  Drawer,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Link } from "react-router-dom";

import type { WorkspacesWorkspaceResponse } from "../../../shared/api/generated/schemas";
import { ROUTES, buildRoute } from "../../../shared/constants/routes";
import { getNavItems } from "./constants";

type ProtectedMobileDrawerProps = {
  opened: boolean;
  pathname: string;
  initials: string;
  activeWorkspace?: WorkspacesWorkspaceResponse;
  workspaceList: WorkspacesWorkspaceResponse[];
  onWorkspaceSelect: (id: string | null) => void;
  onClose: () => void;
};

const ProtectedMobileDrawer = ({
  opened,
  pathname,
  initials,
  activeWorkspace,
  workspaceList,
  onWorkspaceSelect,
  onClose,
}: ProtectedMobileDrawerProps) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={300}
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
    >
      <Group
        justify="space-between"
        align="center"
        px={16}
        py={14}
        style={{ borderBottom: "1px solid var(--app-border)" }}
      >
        <Text fw={600} size="md">
          Меню
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </ActionIcon>
      </Group>

      <Box style={{ overflowY: "auto", height: "calc(100% - 53px)" }}>
        <UnstyledButton
          component={Link}
          to={buildRoute(ROUTES.PROFILE_COMMON, {
            workspaceId: activeWorkspace?.id ?? "",
          })}
          style={{ display: "block", width: "100%", padding: "16px" }}
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

        <Box px={16} py={12}>
          <Text
            size="xs"
            c="dimmed"
            fw={600}
            mb={8}
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Пространство
          </Text>
          <Menu position="bottom" width={240} withinPortal>
            <Menu.Target>
              <UnstyledButton style={{ width: "100%" }}>
                <Group justify="space-between" align="center">
                  <Group gap={8}>
                    <Avatar size={24} radius="sm" color="teal" variant="light">
                      <HugeiconsIcon icon={Building01Icon} size={12} />
                    </Avatar>
                    <Text size="sm">{activeWorkspace?.name ?? "—"}</Text>
                  </Group>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Выберите пространство</Menu.Label>
              {workspaceList.map((workspace) => (
                <Menu.Item
                  key={workspace.id}
                  onClick={() => onWorkspaceSelect(workspace.id ?? null)}
                >
                  {workspace.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Box>

        <Divider />

        <Box px={16} py={12}>
          <Text
            size="xs"
            c="dimmed"
            fw={600}
            mb={8}
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Навигация
          </Text>
          <Stack gap={2}>
            {getNavItems(activeWorkspace?.id ?? '').map(({ label, icon, route, chevron }) => (
              <NavLink
                key={route}
                component={Link}
                to={route}
                label={label}
                leftSection={icon}
                rightSection={
                  chevron ? (
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  ) : undefined
                }
                active={pathname.startsWith(route)}
                style={{ borderRadius: 6 }}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        <Box px={16} py={12}>
          <Text
            size="xs"
            c="dimmed"
            fw={600}
            mb={8}
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
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
  );
};

export default ProtectedMobileDrawer;
