import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ActionIcon,
  Avatar,
  Box,
  Badge,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowsSort,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconFilter,
  IconInfoCircle,
  IconLink,
  IconLogout,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTrash,
} from "@tabler/icons-react";
import {
  getGetWorkspacesWorkspaceIdInviteQueryKey,
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  useDeleteWorkspacesWorkspaceIdMembersMemberId,
  useGetAuthMe,
  useGetWorkspacesWorkspaceIdInvite,
  useGetWorkspacesWorkspaceIdMembers,
  useGetWorkspacesWorkspaceIdRoles,
  usePostWorkspacesWorkspaceIdInvite,
} from "../../shared/api/generated/smetchik";
import type {
  WorkspacesMemberResponse,
  WorkspacesSingleInviteResponse,
} from "../../shared/api/generated/schemas";
import { HttpClientError } from "../../shared/api/httpClient";
import { queryClient } from "../../shared/api/queryClient";
import { getInitials } from "../../shared/utils/getInitials";
import MemberDrawer from "./MemberDrawer";

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

const COLUMNS: { key: string; label: string }[] = [
  { key: "full_name", label: "Сотрудник" },
  { key: "phone", label: "Телефон" },
  { key: "email", label: "Почта" },
  { key: "telegram", label: "Telegram" },
  { key: "position", label: "Должность" },
  { key: "role", label: "Роль" },
];

const WorkspaceMembersPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedMember, setSelectedMember] =
    useState<WorkspacesMemberResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    member: WorkspacesMemberResponse;
    isLeave: boolean;
  } | null>(null);

  const inviteQueryKey = getGetWorkspacesWorkspaceIdInviteQueryKey(workspaceId);
  const membersQueryKey =
    getGetWorkspacesWorkspaceIdMembersQueryKey(workspaceId);

  const { data: me } = useGetAuthMe({});
  const isMe = (m: WorkspacesMemberResponse) =>
    !!me?.user?.id && m.user_id === me.user.id;

  const deleteMutation = useDeleteWorkspacesWorkspaceIdMembersMemberId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: membersQueryKey });
        setConfirmAction(null);
      },
      onError: () => {
        notifications.show({
          color: "red",
          message: "Не удалось выполнить действие",
        });
      },
    },
  });

  const { data: inviteData, status: inviteStatus } =
    useGetWorkspacesWorkspaceIdInvite(workspaceId ?? "", {
      query: { enabled: !!workspaceId },
    });

  const { data: rolesData } = useGetWorkspacesWorkspaceIdRoles(
    workspaceId ?? "",
    { query: { enabled: !!workspaceId } },
  );

  const { data: membersData, isLoading: membersLoading } =
    useGetWorkspacesWorkspaceIdMembers(
      workspaceId ?? "",
      sortBy ? { sort_by: sortBy, sort_dir: sortDir } : undefined,
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

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey)
      return <IconArrowsSort size={14} color="var(--mantine-color-gray-5)" />;
    return sortDir === "asc" ? (
      <IconSortAscendingLetters size={14} color="var(--mantine-color-teal-6)" />
    ) : (
      <IconSortDescendingLetters
        size={14}
        color="var(--mantine-color-teal-6)"
      />
    );
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

            {/* Desktop: one row — URL input + Select + Refresh + Timer */}
            <Box visibleFrom="sm">
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
                  w={184}
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
                    color="gray"
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
                  <Group gap={4} style={{ cursor: "default", flexShrink: 0 }}>
                    <IconClock size={16} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c="dimmed" style={{ userSelect: "none" }}>
                      {remaining !== null ? formatDuration(remaining) : "—"}
                    </Text>
                  </Group>
                </Tooltip>
              </Group>
            </Box>

            {/* Mobile: URL input on own row, then Select + Refresh + Timer */}
            <Box hiddenFrom="sm">
              <Stack gap={8}>
                <TextInput
                  value={inviteUrl}
                  readOnly
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
                <Group gap={8} wrap="nowrap" align="center">
                  <Select
                    value={selectedRole}
                    onChange={setSelectedRole}
                    data={roleOptions}
                    style={{ flex: 1 }}
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
                      color="gray"
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
                    <Group gap={4} style={{ cursor: "default", flexShrink: 0 }}>
                      <IconClock
                        size={16}
                        color="var(--mantine-color-gray-6)"
                      />
                      <Text size="sm" c="dimmed" style={{ userSelect: "none" }}>
                        {remaining !== null ? formatDuration(remaining) : "—"}
                      </Text>
                    </Group>
                  </Tooltip>
                </Group>
              </Stack>
            </Box>

            {/* Row 4: help text */}
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

      {/* Members table — desktop */}
      <Box visibleFrom="sm">
        <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
          {membersLoading ? (
            <Center py={40}>
              <Loader size="sm" />
            </Center>
          ) : (
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  {COLUMNS.map((col) => (
                    <Table.Th
                      key={col.key}
                      style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                      onClick={() => handleSort(col.key)}
                    >
                      <Group gap={4} wrap="nowrap">
                        <Text fw={700} size="xs">
                          {col.label}
                        </Text>
                        <SortIcon colKey={col.key} />
                      </Group>
                    </Table.Th>
                  ))}
                  <Table.Th style={{ width: 40 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(membersData?.members ?? []).length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={COLUMNS.length + 1}>
                      <Center py={32}>
                        <Text c="dimmed" size="sm">
                          Сотрудников пока нет
                        </Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  (membersData?.members ?? []).map((m) => (
                    <Table.Tr key={m.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar size={32} radius="xl" color="teal">
                            {getInitials(m.name, m.surname)}
                          </Avatar>
                          <Text size="sm" fw={500}>
                            {[m.name, m.surname].filter(Boolean).join(" ") ||
                              m.email ||
                              "—"}
                            {isMe(m) && (
                              <Text component="span" c="dimmed">
                                {" "}
                                (Вы)
                              </Text>
                            )}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.phone || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.email || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.telegram || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.position || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.role?.name || "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu withinPortal position="bottom-end" shadow="sm">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size={28}>
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconPencil size={12} />}
                              onClick={() => setSelectedMember(m)}
                            >
                              Редактировать
                            </Menu.Item>
                            {isMe(m) ? (
                              <Menu.Item
                                leftSection={<IconLogout size={12} />}
                                color="red"
                                onClick={() =>
                                  setConfirmAction({ member: m, isLeave: true })
                                }
                              >
                                Покинуть пространство
                              </Menu.Item>
                            ) : (
                              <Menu.Item
                                leftSection={<IconTrash size={12} />}
                                color="red"
                                onClick={() =>
                                  setConfirmAction({
                                    member: m,
                                    isLeave: false,
                                  })
                                }
                              >
                                Удалить
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Box>

      {/* Members cards — mobile */}
      <Box hiddenFrom="sm">
        {membersLoading ? (
          <Center py={40}>
            <Loader size="sm" />
          </Center>
        ) : (membersData?.members ?? []).length === 0 ? (
          <Center py={32}>
            <Text c="dimmed" size="sm">
              Сотрудников пока нет
            </Text>
          </Center>
        ) : (
          <Stack gap={8}>
            {(membersData?.members ?? []).map((m) => {
              const fullName =
                [m.name, m.surname].filter(Boolean).join(" ") || m.email || "—";
              const subtitle = [m.position, m.role?.name]
                .filter(Boolean)
                .join(" · ");
              return (
                <Paper key={m.id} withBorder radius="md" p={12}>
                  <Stack gap={10}>
                    {/* Header row: avatar + name + menu */}
                    <Group gap={8} wrap="nowrap" align="center">
                      <Avatar
                        size={36}
                        radius="xl"
                        color="teal"
                        style={{ flexShrink: 0 }}
                      >
                        {getInitials(m.name, m.surname)}
                      </Avatar>
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>
                          {fullName}
                          {isMe(m) && (
                            <Text component="span" c="dimmed" fw={400}>
                              {" "}
                              (Вы)
                            </Text>
                          )}
                        </Text>
                        {subtitle && (
                          <Text size="xs" c="dimmed" truncate>
                            {subtitle}
                          </Text>
                        )}
                      </Stack>
                      <Menu withinPortal position="bottom-end" shadow="sm">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={28}
                            style={{ flexShrink: 0 }}
                          >
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconPencil size={12} />}
                            onClick={() => setSelectedMember(m)}
                          >
                            Редактировать
                          </Menu.Item>
                          {isMe(m) ? (
                            <Menu.Item
                              leftSection={<IconLogout size={12} />}
                              color="red"
                              onClick={() =>
                                setConfirmAction({ member: m, isLeave: true })
                              }
                            >
                              Покинуть пространство
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              leftSection={<IconTrash size={12} />}
                              color="red"
                              onClick={() =>
                                setConfirmAction({ member: m, isLeave: false })
                              }
                            >
                              Удалить
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Group gap={12} pl={44} align="flex-start">
                      <Stack gap={6}>
                        <Text size="xs" c="dimmed">
                          Телефон
                        </Text>
                        <Text size="xs" c="dimmed">
                          Email
                        </Text>
                        <Text size="xs" c="dimmed">
                          Telegram
                        </Text>
                      </Stack>
                      <Stack gap={6}>
                        <Text size="xs">{m.phone || "—"}</Text>
                        <Text size="xs">{m.email || "—"}</Text>
                        <Text size="xs">{m.telegram || "—"}</Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Confirm delete / leave modal */}
      <Modal
        opened={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.isLeave
            ? "Покинуть пространство"
            : "Удаление сотрудника"
        }
        centered
        size="sm"
      >
        <Stack gap={16}>
          <Text size="sm">
            {confirmAction?.isLeave
              ? "Вы уверены, что хотите покинуть это пространство? Вы потеряете доступ ко всем его данным."
              : `Вы уверены, что хотите удалить сотрудника ${
                  [confirmAction?.member.name, confirmAction?.member.surname]
                    .filter(Boolean)
                    .join(" ") ||
                  confirmAction?.member.email ||
                  ""
                }?`}
          </Text>
          <Group justify="flex-end" gap={8}>
            <Button
              variant="default"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Отмена
            </Button>
            <Button
              color="red"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (!confirmAction || !workspaceId) return;
                deleteMutation.mutate({
                  workspaceId,
                  memberId: confirmAction.member.id ?? "",
                });
              }}
            >
              {confirmAction?.isLeave ? "Покинуть" : "Удалить"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Member detail drawer */}
      <MemberDrawer
        member={selectedMember}
        workspaceId={workspaceId ?? ""}
        onClose={() => setSelectedMember(null)}
      />
    </Stack>
  );
};

export default WorkspaceMembersPage;
