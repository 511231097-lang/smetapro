import {
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useComputedColorScheme,
} from "@mantine/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePrimaryColor } from "../../../providers/PrimaryColorProvider";
import ChevronIcon from "./assets/ChevronIcon.svg?react";
import type { WorkspacesWorkspaceResponse } from "../../../shared/api/generated/schemas";
import { ROUTES, buildRoute } from "../../../shared/constants/routes";
import { wsInitials } from "./constants";
import { IconCube3dSphere } from "@tabler/icons-react";

type WorkspaceMenuProps = {
  activeWorkspace?: WorkspacesWorkspaceResponse;
  workspaceList: WorkspacesWorkspaceResponse[];
  onWorkspaceSelect: (id: string | null) => void;
};

const WorkspaceMenu = ({
  activeWorkspace,
  workspaceList,
  onWorkspaceSelect,
}: WorkspaceMenuProps) => {
  const { primaryColor } = usePrimaryColor();
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const [opened, setOpened] = useState(false);
  const otherWorkspaces = workspaceList.filter(
    (workspace) => workspace.id !== activeWorkspace?.id,
  );

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      withinPortal
      withArrow
      arrowOffset={12}
      offset={-6}
    >
      <Menu.Target>
        <UnstyledButton
          visibleFrom="sm"
          p="0 12px 0 0"
          bdrs={4}
          ml={63}
          miw={176}
        >
          <Group gap={8} wrap="nowrap">
            <Avatar
              size={24}
              radius={4}
              color={primaryColor}
              variant="filled"
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              {wsInitials(activeWorkspace?.name)}
            </Avatar>
            <Title size="xs" fw={400} w="100%">
              {activeWorkspace?.name ?? "—"}
            </Title>
            <ChevronIcon width={12} height={12} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown p={4}>
        <Stack p="6px 8px 8px">
          <Group gap={"8px"} wrap="nowrap">
            <Avatar
              size={32}
              radius={4}
              color={primaryColor}
              variant="filled"
              style={{ fontSize: 20, fontWeight: 700, flexShrink: 0 }}
            >
              {wsInitials(activeWorkspace?.name)}
            </Avatar>
            <Box>
              <Text fz={12} fw={700} lh={"16px"}>
                {activeWorkspace?.name ?? "—"}
              </Text>
              <Text fz="10px" lh="12.5px" c="dimmed" truncate mt={4}>
                Владелец • 5 участников
              </Text>
            </Box>
          </Group>

          <Button
            component={Link}
            to={buildRoute(ROUTES.WORKSPACE_GENERAL, {
              workspaceId: activeWorkspace?.id ?? "",
            })}
            color="gray"
            size="xs"
            onClick={() => setOpened(false)}
            leftSection={<IconCube3dSphere size="12px" />}
            variant="outline"
            style={{
              border: "1px solid var(--app-border)",
            }}
          >
            Профиль пространства
          </Button>
        </Stack>

        {otherWorkspaces.length > 0 && (
          <>
            <Divider my={4} />
            <Box display="block">
              {otherWorkspaces.map((workspace) => (
                <UnstyledButton
                  key={workspace.id}
                  onClick={() => {
                    setOpened(false);
                    onWorkspaceSelect(workspace.id ?? null);
                  }}
                  p="8px"
                  display="block"
                >
                  <Group gap={12} wrap="nowrap">
                    <Avatar
                      size={24}
                      radius={4}
                      color={primaryColor}
                      variant="filled"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {wsInitials(workspace.name)}
                    </Avatar>

                    <Box>
                      <Text fw={400} size="12px" lh="16px" truncate>
                        {workspace.name}
                      </Text>
                      <Text fz="10px" lh="12.5px" c="dimmed" truncate>
                        Клиент
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              ))}
            </Box>
          </>
        )}

        <Divider my={4} />

        <UnstyledButton
          component={Link}
          to={ROUTES.WORKSPACE_CREATE}
          p="8px"
          display="block"
        >
          <Group gap={12} wrap="nowrap">
            <Avatar
              size={24}
              radius={4}
              bg={
                colorScheme === "dark"
                  ? "var(--mantine-color-gray-8)"
                  : "var(--mantine-color-gray-4)"
              }
              variant="filled"
              style={{ flexShrink: 0 }}
            >
              <Text c="white">+</Text>
            </Avatar>
            <Text size="sm">Новое пространство</Text>
          </Group>
        </UnstyledButton>
      </Menu.Dropdown>
    </Menu>
  );
};

export default WorkspaceMenu;
