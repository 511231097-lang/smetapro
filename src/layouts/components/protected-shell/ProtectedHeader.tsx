import {
  Cancel01Icon,
  Menu01Icon,
  Notification01FreeIcons,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Group,
  Menu,
  Text,
  TextInput,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { usePrimaryColor } from "../../../providers/PrimaryColorProvider";
import {
  IconInfoCircle,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { WorkspacesWorkspaceResponse } from "../../../shared/api/generated/schemas";
import { ROUTES } from "../../../shared/constants/routes";
import WorkspaceMenu from "./WorkspaceMenu";

type ProtectedHeaderProps = {
  email: string;
  initials: string;
  searchOpen: boolean;
  activeWorkspace?: WorkspacesWorkspaceResponse;
  workspaceList: WorkspacesWorkspaceResponse[];
  onOpenMobileMenu: () => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  onWorkspaceSelect: (id: string | null) => void;
  onGoToProfile: () => void;
  onLogout: () => void;
};

const ProtectedHeader = ({
  email,
  initials,
  searchOpen,
  activeWorkspace,
  workspaceList,
  onOpenMobileMenu,
  onToggleSearch,
  onCloseSearch,
  onWorkspaceSelect,
  onGoToProfile,
  onLogout,
}: ProtectedHeaderProps) => {
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const { primaryColor } = usePrimaryColor();
  return (
    <AppShell.Header
      style={{
        background: "var(--app-header-bg)",
        borderBottom: "1px solid var(--app-border)",
      }}
    >
      <Group h="100%" px={16} justify="space-between" wrap="nowrap">
        <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Link
            to={ROUTES.PROJECTS}
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={isDark ? "/logo_dark.svg" : "/logo_light.svg"}
              alt="СМЕТЧИК ПРО"
              height={19}
            />
          </Link>

          <WorkspaceMenu
            activeWorkspace={activeWorkspace}
            workspaceList={workspaceList}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        </Group>

        {searchOpen && (
          <Box visibleFrom="sm" style={{ flex: 1, margin: "0 16px" }}>
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
                  onClick={onCloseSearch}
                  aria-label="Закрыть поиск"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </ActionIcon>
              }
            />
          </Box>
        )}

        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            hiddenFrom="sm"
            aria-label="Поиск"
          >
            <HugeiconsIcon icon={Search01Icon} size={20} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            hiddenFrom="sm"
            onClick={onOpenMobileMenu}
            aria-label="Открыть меню"
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            color="gray"
            visibleFrom="sm"
            onClick={onToggleSearch}
            aria-label="Поиск"
          >
            <HugeiconsIcon icon={Search01Icon} size={20} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            color="gray"
            visibleFrom="sm"
            aria-label="Уведомления"
          >
            <HugeiconsIcon icon={Notification01FreeIcons} size={20} />
          </ActionIcon>

          <Menu
            position="bottom-end"
            width={200}
            withinPortal
            styles={{
              dropdown: {
                padding: 4,
                border: "1px solid var(--mantine-color-default-border)",
                borderRadius: 4,
              },
              item: {
                padding: "4px 12px",
                fontSize: 12,
                gap: 8,
                borderRadius: 4,
              },
              divider: { margin: "4px 0" },
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
                {isDark ? "Светлая тема" : "Темная тема"}
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
        </Group>
      </Group>
    </AppShell.Header>
  );
};

export default ProtectedHeader;
