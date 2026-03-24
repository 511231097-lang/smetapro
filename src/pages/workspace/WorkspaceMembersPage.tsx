import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCopy,
  IconFilter,
  IconInfoCircle,
  IconLink,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import {
  getGetWorkspacesWorkspaceIdInviteQueryKey,
  useGetWorkspacesWorkspaceIdInvite,
  useGetWorkspacesWorkspaceIdRoles,
  usePostWorkspacesWorkspaceIdInvite,
} from "../../shared/api/generated/smetchik";
import type { WorkspacesSingleInviteResponse } from "../../shared/api/generated/schemas";
import { HttpClientError } from "../../shared/api/httpClient";
import { queryClient } from "../../shared/api/queryClient";

const formatDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const useCountdown = (expiresAt: string | undefined) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const tick = () =>
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
};

const WorkspaceMembersPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  const inviteQueryKey = getGetWorkspacesWorkspaceIdInviteQueryKey(workspaceId);

  const { data: inviteData, status: inviteStatus } =
    useGetWorkspacesWorkspaceIdInvite(workspaceId ?? "", {
      query: { enabled: !!workspaceId },
    });

  const { data: rolesData } = useGetWorkspacesWorkspaceIdRoles(
    workspaceId ?? "",
    { query: { enabled: !!workspaceId } },
  );

  const createMutation = usePostWorkspacesWorkspaceIdInvite({
    mutation: {
      onSuccess: (result) => {
        queryClient.setQueryData<WorkspacesSingleInviteResponse>(
          inviteQueryKey,
          result,
        );
        setIsExpanded(true);
      },
      onError: (error) => {
        const msg =
          error instanceof HttpClientError
            ? ((error.data as { error?: string })?.error ??
              "Не удалось создать ссылку-приглашение")
            : "Не удалось создать ссылку-приглашение";
        notifications.show({ color: "red", message: msg });
      },
    },
  });

  const invite = inviteData?.invite;
  const isActive =
    !!invite?.expires_at && new Date(invite.expires_at) > new Date();
  const remaining = useCountdown(invite?.expires_at);

  // Auto-expand on first successful load when invite is active
  useEffect(() => {
    if (inviteStatus === "success" && !didAutoExpand.current) {
      didAutoExpand.current = true;
      if (isActive) setIsExpanded(true);
    }
  }, [inviteStatus, isActive]);

  // Auto-collapse when invite expires
  useEffect(() => {
    if (remaining === 0) setIsExpanded(false);
  }, [remaining]);

  // Initialize selected role from existing invite or first available role
  useEffect(() => {
    if (selectedRole === null) {
      const fromInvite = invite?.role?.code;
      const fromRoles = rolesData?.roles?.[0]?.code;
      if (fromInvite) setSelectedRole(fromInvite);
      else if (fromRoles) setSelectedRole(fromRoles);
    }
  }, [invite, rolesData, selectedRole]);

  const roleOptions =
    rolesData?.roles?.map((r) => ({
      value: r.code ?? "",
      label: `Роль: ${r.name ?? r.code}`,
    })) ?? [];

  const inviteUrl = invite?.token
    ? `${window.location.origin}/invite/${invite.token}`
    : "";

  const handleCreateOrRefresh = () => {
    if (!workspaceId || !selectedRole) return;
    createMutation.mutate({ workspaceId, data: { role_code: selectedRole } });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    notifications.show({ color: "teal", message: "Ссылка скопирована" });
  };

  const panelLeftIcon = !isActive ? (
    <IconPlus size={16} />
  ) : isExpanded ? (
    <IconChevronUp size={16} />
  ) : (
    <IconChevronDown size={16} />
  );

  const panelOnClick = !isActive
    ? handleCreateOrRefresh
    : isExpanded
      ? () => setIsExpanded(false)
      : () => setIsExpanded(true);

  return (
    <Stack gap={0}>
      {/* Action bar */}
      <Paper p={12} mb={8}>
        <Group justify="space-between">
          <Button
            color="teal"
            size="sm"
            leftSection={panelLeftIcon}
            onClick={panelOnClick}
            loading={createMutation.isPending && !isActive}
            disabled={!isActive && selectedRole === null}
          >
            Добавить сотрудника
          </Button>

          <ActionIcon variant="outline" color="teal" size={32}>
            <IconFilter size={16} />
          </ActionIcon>
        </Group>
      </Paper>

      {/* Invite section — visible when expanded and invite exists */}
      {isExpanded && invite && (
        <Paper p={12} mb={8}>
          <Stack gap={10}>
            {/* Row 1: title + registered count */}
            <Group gap={16}>
              <Group gap={8}>
                <IconLink size={20} color="var(--mantine-color-teal-6)" />
                <Text fw={600} size="sm">
                  Ссылка-приглашение
                </Text>
              </Group>
              <Group gap={4}>
                <Text size="xs" c="dimmed">
                  Зарегистрировалось:
                </Text>
                <Badge size="sm" variant="filled" color="teal" radius="sm">
                  {invite.use_count ?? 0}
                </Badge>
              </Group>
            </Group>

            {/* Row 2: URL input + role select + refresh button + timer */}
            <Group gap={12} wrap="nowrap" align="center">
              <TextInput
                value={inviteUrl}
                readOnly
                style={{ flex: 1 }}
                rightSection={
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={28}
                    onClick={handleCopy}
                  >
                    <IconCopy size={16} />
                  </ActionIcon>
                }
              />
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                data={roleOptions}
                style={{ width: 184 }}
                size="sm"
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
                  color="teal"
                  size={32}
                  onClick={handleCreateOrRefresh}
                  loading={createMutation.isPending}
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
                <Group gap={4} style={{ cursor: "default" }}>
                  <IconClock size={16} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" c="dimmed" style={{ userSelect: "none" }}>
                    {remaining !== null ? formatDuration(remaining) : "—"}
                  </Text>
                </Group>
              </Tooltip>
            </Group>

            {/* Row 3: help text */}
            <Group gap={6}>
              <IconInfoCircle size={16} color="var(--mantine-color-gray-5)" />
              <Text size="xs" c="dimmed">
                Отправьте ссылку сотруднику, чтобы он вступил в пространство.
                Можно создать только одну активную ссылку.
              </Text>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Members table placeholder */}
      <Text c="dimmed" size="sm">
        Таблица сотрудников
      </Text>
    </Stack>
  );
};

export default WorkspaceMembersPage;
