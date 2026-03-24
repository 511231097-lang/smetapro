import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Popover,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsSort,
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconFilter,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  getGetWorkspacesWorkspaceIdInviteQueryKey,
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  useDeleteWorkspacesWorkspaceIdMembersMemberId,
  useGetAuthMe,
  useGetWorkspacesWorkspaceIdInvite,
  useGetWorkspacesWorkspaceIdMembers,
  useGetWorkspacesWorkspaceIdRoles,
  usePostWorkspacesWorkspaceIdInvite,
} from '../../shared/api/generated/smetchik';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type {
  WorkspacesMemberResponse,
  WorkspacesSingleInviteResponse,
} from '../../shared/api/generated/schemas';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { getInitials } from '../../shared/utils/getInitials';
import MemberDrawer from './MemberDrawer';
import WorkspaceInviteWidget from './WorkspaceInviteWidget';

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
  { key: 'full_name', label: 'Сотрудник' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Почта' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'position', label: 'Должность' },
  { key: 'role', label: 'Роль' },
];

const WorkspaceMembersPage = () => {
  const { primaryColor } = usePrimaryColor();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const didAutoExpand = useRef(false);

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedMember, setSelectedMember] =
    useState<WorkspacesMemberResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    member: WorkspacesMemberResponse;
    isLeave: boolean;
  } | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftRoleCodes, setDraftRoleCodes] = useState<string[]>([]);
  const [filterRoleCodes, setFilterRoleCodes] = useState<string[]>([]);

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
          color: 'red',
          message: 'Не удалось выполнить действие',
        });
      },
    },
  });

  const { data: inviteData, status: inviteStatus } =
    useGetWorkspacesWorkspaceIdInvite(workspaceId ?? '', {
      query: { enabled: !!workspaceId },
    });

  const { data: rolesData } = useGetWorkspacesWorkspaceIdRoles(
    workspaceId ?? '',
    { query: { enabled: !!workspaceId } },
  );

  const { data: membersData, isLoading: membersLoading } =
    useGetWorkspacesWorkspaceIdMembers(
      workspaceId ?? '',
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
              'Не удалось создать ссылку-приглашение')
            : 'Не удалось создать ссылку-приглашение';
        notifications.show({ color: 'red', message: msg });
      },
    },
  });

  const invite = inviteData?.invite;
  const isActive =
    !!invite?.expires_at && new Date(invite.expires_at) > new Date();
  const remaining = useCountdown(invite?.expires_at);

  // Auto-expand on first successful load when invite is active
  useEffect(() => {
    if (inviteStatus === 'success' && !didAutoExpand.current) {
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
      value: r.code ?? '',
      label: `Роль: ${r.name ?? r.code}`,
      name: r.name ?? r.code ?? '',
    })) ?? [];

  const allRoles = rolesData?.roles ?? [];
  const isFilterActive = filterRoleCodes.length > 0;
  const filteredMembers = (membersData?.members ?? []).filter(
    (m) =>
      filterRoleCodes.length === 0 ||
      (m.role?.code != null && filterRoleCodes.includes(m.role.code)),
  );

  const inviteUrl = invite?.token
    ? `${window.location.origin}/invite/${invite.token}`
    : '';

  const handleCreateOrRefresh = () => {
    if (!workspaceId || !selectedRole) return;
    createMutation.mutate({ workspaceId, data: { role_code: selectedRole } });
  };

  const handleRoleChange = (roleCode: string | null) => {
    setSelectedRole(roleCode);

    // If invite widget is visible, regenerate link immediately for new role.
    if (!workspaceId || !roleCode || roleCode === selectedRole || !invite)
      return;

    createMutation.mutate({ workspaceId, data: { role_code: roleCode } });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    notifications.show({ color: 'teal', message: 'Ссылка скопирована' });
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey)
      return <IconArrowsSort size={14} color="var(--mantine-color-gray-5)" />;
    return sortDir === 'asc' ? (
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
      <Paper withBorder={false} radius="md" p={12} mb={8}>
        <Group justify="space-between">
          <Button
            size="sm"
            leftSection={panelLeftIcon}
            onClick={panelOnClick}
            loading={createMutation.isPending && !isActive}
            disabled={!isActive && selectedRole === null}
          >
            Добавить сотрудника
          </Button>

          <Popover
            opened={filterOpen}
            onClose={() => setFilterOpen(false)}
            position="bottom-end"
            shadow="md"
            withinPortal
            withArrow={false}
          >
            <Popover.Target>
              <ActionIcon
                variant={isFilterActive ? 'filled' : 'outline'}
                size={32}
                onClick={() => {
                  if (!filterOpen) {
                    const allCodes = allRoles
                      .map((r) => r.code ?? '')
                      .filter(Boolean);
                    setDraftRoleCodes(
                      filterRoleCodes.length === 0 ? allCodes : filterRoleCodes,
                    );
                  }
                  setFilterOpen((o) => !o);
                }}
              >
                <IconFilter size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p={0} style={{ minWidth: 280 }}>
              {/* Header */}
              <Group
                justify="space-between"
                px={16}
                style={{
                  height: 44,
                  borderBottom: '1px solid var(--mantine-color-gray-2)',
                }}
              >
                <Group gap={8}>
                  <IconFilter size={16} />
                  <Text fw={700} size="md">
                    Фильтры
                  </Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setFilterOpen(false)}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
              {/* Body */}
              <Stack gap={0} px={16} pt={12} pb={4}>
                <Text
                  size="xs"
                  fw={600}
                  c="dimmed"
                  tt="uppercase"
                  mb={8}
                  style={{ letterSpacing: '0.04em' }}
                >
                  Роль
                </Text>
                <Stack gap={0}>
                  <Checkbox
                    py={4}
                    label={
                      <Text size="sm" fw={600}>
                        Все роли
                      </Text>
                    }
                    checked={
                      draftRoleCodes.length === allRoles.length &&
                      allRoles.length > 0
                    }
                    indeterminate={
                      draftRoleCodes.length > 0 &&
                      draftRoleCodes.length < allRoles.length
                    }
                    onChange={(e) => {
                      if (e.currentTarget.checked)
                        setDraftRoleCodes(
                          allRoles.map((r) => r.code ?? '').filter(Boolean),
                        );
                      else setDraftRoleCodes([]);
                    }}
                  />
                  {allRoles.map((role) => (
                    <Checkbox
                      key={role.id}
                      py={4}
                      label={role.name ?? role.code}
                      checked={draftRoleCodes.includes(role.code ?? '')}
                      onChange={(e) => {
                        const code = role.code ?? '';
                        if (e.currentTarget.checked)
                          setDraftRoleCodes((prev) => [...prev, code]);
                        else
                          setDraftRoleCodes((prev) =>
                            prev.filter((c) => c !== code),
                          );
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
              {/* Footer */}
              <Group px={16} pb={16} pt={8} gap={8}>
                <Button
                  style={{ flex: 1 }}
                  onClick={() => {
                    setFilterRoleCodes(
                      draftRoleCodes.length === allRoles.length
                        ? []
                        : draftRoleCodes,
                    );
                    setFilterOpen(false);
                  }}
                >
                  Применить
                </Button>
                <Button
                  variant="default"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setDraftRoleCodes([]);
                    setFilterRoleCodes([]);
                    setFilterOpen(false);
                  }}
                >
                  Сбросить
                </Button>
              </Group>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Paper>

      {/* Invite section — visible when expanded and invite exists */}
      {isExpanded && invite && (
        <WorkspaceInviteWidget
          invite={invite}
          inviteUrl={inviteUrl}
          selectedRole={selectedRole}
          roleOptions={roleOptions}
          remaining={remaining}
          isPending={createMutation.isPending}
          onRoleChange={handleRoleChange}
          onCreateOrRefresh={handleCreateOrRefresh}
          onCopy={handleCopy}
        />
      )}

      {/* Members table — desktop */}
      <Box visibleFrom="sm">
        <Paper withBorder={false} radius="md" style={{ overflow: 'hidden' }}>
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
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                {filteredMembers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={COLUMNS.length + 1}>
                      <Center py={32}>
                        <Text c="dimmed" size="sm">
                          Сотрудников нет
                        </Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredMembers.map((m) => (
                    <Table.Tr
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar size={32} radius="xl" color={primaryColor}>
                            {getInitials(m.name, m.surname)}
                          </Avatar>
                          <Text size="sm">
                            <Text
                              component="span"
                              style={{
                                textDecoration: 'underline',
                                textDecorationColor: '#ced4da',
                              }}
                            >
                              {[m.name, m.surname].filter(Boolean).join(' ') ||
                                m.email ||
                                '—'}
                            </Text>
                            {isMe(m) && (
                              <Text component="span" c="dimmed">
                                {' '}
                                (Вы)
                              </Text>
                            )}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.phone || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.email || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.telegram || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.position || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.role?.name || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu
                          withinPortal
                          position="bottom-end"
                          shadow="sm"
                          styles={{
                            item: {
                              padding: '8px 12px',
                              fontSize: '12px',
                              lineHeight: '16px',
                            },
                          }}
                        >
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size={28}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown p={4}>
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
        ) : filteredMembers.length === 0 ? (
          <Center py={32}>
            <Text c="dimmed" size="sm">
              Сотрудников пока нет
            </Text>
          </Center>
        ) : (
          <Stack gap={8}>
            {filteredMembers.map((m) => {
              const fullName =
                [m.name, m.surname].filter(Boolean).join(' ') || m.email || '—';
              const subtitle = [m.position, m.role?.name]
                .filter(Boolean)
                .join(' · ');
              return (
                <Paper
                  key={m.id}
                  withBorder
                  radius="md"
                  p={12}
                  onClick={() => setSelectedMember(m)}
                  style={{ cursor: 'pointer' }}
                >
                  <Stack gap={10}>
                    {/* Header row: avatar + name + menu */}
                    <Group gap={8} wrap="nowrap" align="center">
                      <Avatar
                        size={36}
                        radius="xl"
                        color={primaryColor}
                        style={{ flexShrink: 0 }}
                      >
                        {getInitials(m.name, m.surname)}
                      </Avatar>
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" truncate>
                          <Text
                            component="span"
                            style={{
                              textDecoration: 'underline',
                              textDecorationColor: '#ced4da',
                            }}
                          >
                            {fullName}
                          </Text>
                          {isMe(m) && (
                            <Text component="span" c="dimmed">
                              {' '}
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
                      <Menu
                        withinPortal
                        position="bottom-end"
                        shadow="sm"
                        styles={{
                          item: {
                            padding: '8px 12px',
                            fontSize: '12px',
                            lineHeight: '16px',
                          },
                        }}
                      >
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={28}
                            style={{ flexShrink: 0 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown p={4}>
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

                    <Divider />
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
                        <Text size="xs">{m.phone || '—'}</Text>
                        <Text size="xs">{m.email || '—'}</Text>
                        <Text size="xs">{m.telegram || '—'}</Text>
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
            ? 'Покинуть пространство'
            : 'Удаление сотрудника'
        }
        centered
        size="sm"
      >
        <Stack gap={16}>
          <Text size="sm">
            {confirmAction?.isLeave
              ? 'Вы уверены, что хотите покинуть это пространство? Вы потеряете доступ ко всем его данным.'
              : `Вы уверены, что хотите удалить сотрудника ${
                  [confirmAction?.member.name, confirmAction?.member.surname]
                    .filter(Boolean)
                    .join(' ') ||
                  confirmAction?.member.email ||
                  ''
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
                  memberId: confirmAction.member.id ?? '',
                });
              }}
            >
              {confirmAction?.isLeave ? 'Покинуть' : 'Удалить'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Member detail drawer */}
      <MemberDrawer
        member={selectedMember}
        workspaceId={workspaceId ?? ''}
        onClose={() => setSelectedMember(null)}
        onDelete={(m) => {
          setSelectedMember(null);
          setConfirmAction({ member: m, isLeave: false });
        }}
      />
    </Stack>
  );
};

export default WorkspaceMembersPage;
