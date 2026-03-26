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
} from '@mantine/core';
import { IconCube3dSphere } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrimaryColor } from '../../../providers/PrimaryColorProvider';
import type { WorkspacesWorkspaceResponse } from '../../../shared/api/generated/schemas';
import { buildRoute, ROUTES } from '../../../shared/constants/routes';
import ChevronIcon from './assets/ChevronIcon.svg?react';
import { wsInitials } from './constants';

type WorkspaceMenuProps = {
  activeWorkspace?: WorkspacesWorkspaceResponse;
  workspaceList: WorkspacesWorkspaceResponse[];
  onWorkspaceSelect: (id: string | null) => void;
  mobile?: boolean;
};

const WorkspaceMenu = ({
  activeWorkspace,
  workspaceList,
  onWorkspaceSelect,
  mobile = false,
}: WorkspaceMenuProps) => {
  const { primaryColor } = usePrimaryColor();
  const [opened, setOpened] = useState(false);
  const otherWorkspaces = workspaceList.filter(
    (workspace) => workspace.id !== activeWorkspace?.id,
  );

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position={mobile ? 'bottom-start' : 'bottom-end'}
      withinPortal
      withArrow
      arrowOffset={12}
      offset={-6}
    >
      <Menu.Target>
        <UnstyledButton
          visibleFrom={mobile ? undefined : 'sm'}
          p={mobile ? '0' : '0 12px 0 0'}
          bdrs={4}
          ml={mobile ? 0 : 63}
          miw={mobile ? undefined : 176}
          style={mobile ? { width: '100%' } : undefined}
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
              {activeWorkspace?.name ?? '—'}
            </Title>
            <ChevronIcon
              width={12}
              height={12}
              style={{ minWidth: 12, minHeight: 12, flexShrink: 0 }}
              aria-hidden="true"
              focusable="false"
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown p={4}>
        <Stack p="6px 8px 8px">
          <Group gap={'8px'} wrap="nowrap">
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
              <Text fz={12} fw={700} lh={'16px'}>
                {activeWorkspace?.name ?? '—'}
              </Text>
              <Text fz="10px" lh="12.5px" c="dimmed" truncate mt={4}>
                Владелец • 5 участников
              </Text>
            </Box>
          </Group>

          <Button
            component={Link}
            to={buildRoute(ROUTES.WORKSPACE_GENERAL, {
              workspaceId: activeWorkspace?.id ?? '',
            })}
            color="gray"
            size="xs"
            onClick={() => setOpened(false)}
            leftSection={<IconCube3dSphere size="12px" />}
            variant="outline"
            style={{
              border: '1px solid var(--app-border)',
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
              bg="var(--mantine-color-default-border)"
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
