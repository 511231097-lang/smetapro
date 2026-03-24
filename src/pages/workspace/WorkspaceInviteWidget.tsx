import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconClock,
  IconCopy,
  IconInfoCircle,
  IconLink,
  IconRefresh,
} from '@tabler/icons-react';
import type { WorkspacesInviteResponse } from '../../shared/api/generated/schemas/workspacesInviteResponse';

type RoleOption = {
  value: string;
  label: string;
  name: string;
};

type WorkspaceInviteWidgetProps = {
  invite: WorkspacesInviteResponse;
  inviteUrl: string;
  selectedRole: string | null;
  roleOptions: RoleOption[];
  remaining: number | null;
  isPending: boolean;
  onRoleChange: (value: string | null) => void;
  onCreateOrRefresh: () => void;
  onCopy: () => void | Promise<void>;
};

const formatDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const WorkspaceInviteWidget = ({
  invite,
  inviteUrl,
  selectedRole,
  roleOptions,
  remaining,
  isPending,
  onRoleChange,
  onCreateOrRefresh,
  onCopy,
}: WorkspaceInviteWidgetProps) => {
  return (
    <Paper withBorder={false} radius="md" p={12} mb={8}>
      <Stack gap={10}>
        <Group gap={16}>
          <Group gap={8}>
            <IconLink size={20} color={'var(--mantine-color-anchor)'} />
            <Text fw={600} size="sm">
              Ссылка-приглашение
            </Text>
          </Group>
          <Group gap={4}>
            <Text size="xs" c="dimmed">
              Зарегистрировалось:
            </Text>
            <Badge size="sm" variant="filled" radius="sm">
              {invite.use_count ?? 0}
            </Badge>
          </Group>
        </Group>

        <Box visibleFrom="sm">
          <Group gap={12} wrap="nowrap" align="center">
            <TextInput
              value={inviteUrl}
              readOnly
              variant="filled"
              style={{ flex: 1 }}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={28}
                  onClick={onCopy}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              }
            />
            <Select
              value={selectedRole}
              onChange={onRoleChange}
              data={roleOptions}
              miw={190}
              size="sm"
              variant="filled"
              allowDeselect={false}
              renderOption={({ option }) => (
                <span>{(option as RoleOption).name}</span>
              )}
            />
            <Tooltip
              label="При обновлении текущая ссылка перестанет работать"
              multiline
              w={220}
              position="top"
              withArrow
            >
              <ActionIcon
                variant="outline"
                color="gray"
                size={32}
                onClick={onCreateOrRefresh}
                loading={isPending}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              multiline
              w={220}
              label="По истечении времени регистрация по ссылке станет недоступна"
              position="top"
              withArrow
            >
              <Group gap={4} style={{ cursor: 'default', flexShrink: 0 }}>
                <IconClock size={16} />
                <Text size="sm" style={{ userSelect: 'none' }}>
                  {remaining !== null ? formatDuration(remaining) : '—'}
                </Text>
              </Group>
            </Tooltip>
          </Group>
        </Box>

        <Box hiddenFrom="sm">
          <Stack gap={8}>
            <TextInput
              value={inviteUrl}
              readOnly
              variant="filled"
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={28}
                  onClick={onCopy}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              }
            />
            <Group gap={8} wrap="nowrap" align="center">
              <Select
                value={selectedRole}
                onChange={onRoleChange}
                data={roleOptions}
                style={{ flex: 1 }}
                size="sm"
                variant="filled"
                allowDeselect={false}
              />
              <Tooltip
                label="При обновлении текущая ссылка перестанет работать"
                multiline
                w={220}
                position="top"
                withArrow
              >
                <ActionIcon
                  variant="outline"
                  color="gray"
                  size={32}
                  onClick={onCreateOrRefresh}
                  loading={isPending}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                multiline
                w={220}
                label="По истечении времени регистрация по ссылке станет недоступна"
                position="top"
                withArrow
              >
                <Group gap={4} style={{ cursor: 'default', flexShrink: 0 }}>
                  <IconClock size={16} />
                  <Text size="sm" style={{ userSelect: 'none' }}>
                    {remaining !== null ? formatDuration(remaining) : '—'}
                  </Text>
                </Group>
              </Tooltip>
            </Group>
          </Stack>
        </Box>

        <Group gap={6}>
          <IconInfoCircle size={16} color="var(--mantine-color-gray-5)" />
          <Text size="xs" c="dimmed">
            Отправьте ссылку сотруднику, чтобы он вступил в пространство. Можно
            создать только одну активную ссылку.
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
};

export default WorkspaceInviteWidget;
