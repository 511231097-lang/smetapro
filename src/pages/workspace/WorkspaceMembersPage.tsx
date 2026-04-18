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
  TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
  IconSearch,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type {
  WorkspacesMemberResponse,
  WorkspacesSingleInviteResponse,
} from '../../shared/api/generated/schemas';
import {
  getGetWorkspacesWorkspaceIdInviteQueryKey,
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  useDeleteWorkspacesWorkspaceIdMembersMemberId,
  useGetProfile,
  useGetWorkspacesWorkspaceIdInvite,
  useGetWorkspacesWorkspaceIdMembers,
  useGetWorkspacesWorkspaceIdRoles,
  usePostWorkspacesWorkspaceIdInvite,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { isOwnerRoleCode } from '../../shared/constants/roles';
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
  const isMobile = useMediaQuery('(max-width: 48em)');
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
  const [searchValue, setSearchValue] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const membersParams = useMemo(() => {
    const params: {
      role_code?: string;
      sort_by?: string;
      sort_dir?: 'asc' | 'desc';
    } = {};

    if (sortBy) {
      params.sort_by = sortBy;
      params.sort_dir = sortDir;
    }

    if (filterRoleCodes.length > 0) {
      params.role_code = filterRoleCodes.join(',');
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }, [sortBy, sortDir, filterRoleCodes]);

  const inviteQueryKey = getGetWorkspacesWorkspaceIdInviteQueryKey(workspaceId);
  const membersQueryKey =
    getGetWorkspacesWorkspaceIdMembersQueryKey(workspaceId);

  const { data: me } = useGetProfile({});
  const isMe = (m: WorkspacesMemberResponse) =>
    !!me?.user?.id && m.user_id === me.user.id;
  const isOwner = (m: WorkspacesMemberResponse) =>
    isOwnerRoleCode(m.role?.code);
  const canLeaveWorkspace = (m: WorkspacesMemberResponse) =>
    isMe(m) && !isOwner(m);
  const canDeleteMember = (m: WorkspacesMemberResponse) => !isOwner(m);

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
  const inviteRoles = useMemo(
    () =>
      (rolesData?.roles ?? []).filter((role) => !isOwnerRoleCode(role.code)),
    [rolesData?.roles],
  );

  const { data: membersData, isLoading: membersLoading } =
    useGetWorkspacesWorkspaceIdMembers(workspaceId ?? '', membersParams, {
      query: { enabled: !!workspaceId },
    });

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

  useEffect(() => {
    if (isMobile == null) return;
    setFilterOpen(false);
  }, [isMobile]);

  // Keep selected role aligned with available non-owner roles for invites.
  useEffect(() => {
    if (selectedRole !== null) {
      const isAvailable = inviteRoles.some(
        (role) => role.code === selectedRole,
      );
      if (!isAvailable) setSelectedRole(inviteRoles[0]?.code ?? null);
      return;
    }

    const fromInvite = invite?.role?.code;
    const isInviteRoleAvailable =
      fromInvite != null &&
      inviteRoles.some((role) => role.code === fromInvite);

    if (isInviteRoleAvailable) {
      setSelectedRole(fromInvite);
      return;
    }

    setSelectedRole(inviteRoles[0]?.code ?? null);
  }, [invite, inviteRoles, selectedRole]);

  const roleOptions = inviteRoles.map((r) => ({
    value: r.code ?? '',
    label: `Роль: ${r.name ?? r.code}`,
    name: r.name ?? r.code ?? '',
  }));

  const allRoles = rolesData?.roles ?? [];
  const allRoleCodes = useMemo(
    () => allRoles.map((role) => role.code ?? '').filter(Boolean),
    [allRoles],
  );
  const normalizedSearch = searchValue.trim().toLowerCase();
  const isFilterActive = filterRoleCodes.length > 0;
  const activeRoleCountLabel =
    filterRoleCodes.length > 9 ? '9+' : String(filterRoleCodes.length);
  const isAllRolesSelected =
    allRoleCodes.length > 0 && draftRoleCodes.length === allRoleCodes.length;
  const filteredMembers = (membersData?.members ?? []).filter((m) => {
    if (!normalizedSearch) return true;

    const fullName = [m.name, m.surname].filter(Boolean).join(' ');
    const searchable = [
      fullName,
      m.phone,
      m.email,
      m.telegram,
      m.position,
      m.role?.name,
      m.role?.code,
    ]
      .filter(
        (value): value is string => value != null && value.trim().length > 0,
      )
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedSearch);
  });
  const emptyMembersText =
    (membersData?.members?.length ?? 0) > 0
      ? 'По вашему запросу ничего не найдено'
      : 'Сотрудников пока нет';

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

  const openRoleFilter = () => {
    setDraftRoleCodes(
      filterRoleCodes.length === 0 ? allRoleCodes : filterRoleCodes,
    );
    setFilterOpen(true);
  };

  const applyRoleFilter = () => {
    setFilterRoleCodes(isAllRolesSelected ? [] : draftRoleCodes);
    setFilterOpen(false);
  };

  const resetRoleFilter = () => {
    setDraftRoleCodes(allRoleCodes);
    setFilterRoleCodes([]);
    setFilterOpen(false);
  };

  const SortIcon = ({
    colKey,
    colLabel,
  }: {
    colKey: string;
    colLabel: string;
  }) => {
    const nextSortDirection =
      sortBy === colKey && sortDir === 'asc' ? 'desc' : 'asc';
    const sortActionLabel = `Сортировать столбец «${colLabel}» ${
      nextSortDirection === 'asc' ? 'по возрастанию' : 'по убыванию'
    }`;

    const icon =
      sortBy !== colKey ? (
        <IconArrowsSort size={14} color="var(--mantine-color-gray-5)" />
      ) : sortDir === 'asc' ? (
        <IconSortAscendingLetters
          size={14}
          color="var(--mantine-color-teal-6)"
        />
      ) : (
        <IconSortDescendingLetters
          size={14}
          color="var(--mantine-color-teal-6)"
        />
      );

    return (
      <ActionIcon
        variant="transparent"
        color="gray"
        size={16}
        aria-label={sortActionLabel}
        title={sortActionLabel}
        onClick={(event) => {
          event.stopPropagation();
          handleSort(colKey);
        }}
      >
        {icon}
      </ActionIcon>
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
  const isSearchExpandedOnMobile = isSearchExpanded && !!isMobile;

  return (
    <Stack gap={0}>
      {/* Action bar */}
      <Paper withBorder={false} radius="md" p={12} mb={8}>
        <Group
          justify="space-between"
          gap={8}
          wrap={isSearchExpandedOnMobile ? 'wrap' : 'nowrap'}
        >
          <Button
            size="sm"
            leftSection={panelLeftIcon}
            onClick={panelOnClick}
            loading={createMutation.isPending && !isActive}
            disabled={!isActive && selectedRole === null}
            style={{
              flexShrink: 0,
              width: isSearchExpandedOnMobile ? '100%' : undefined,
            }}
          >
            Добавить сотрудника
          </Button>

          {isSearchExpanded ? (
            <TextInput
              value={searchValue}
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              placeholder="Поиск по сотрудникам..."
              aria-label="Поиск по сотрудникам"
              leftSection={<IconSearch size={16} />}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={22}
                  aria-label="Очистить поиск"
                  title="Очистить поиск"
                  onClick={() => {
                    setSearchValue('');
                    setIsSearchExpanded(false);
                  }}
                >
                  <IconX size={14} />
                </ActionIcon>
              }
              rightSectionPointerEvents="all"
              size="sm"
              style={{
                maxWidth: isSearchExpandedOnMobile ? '100%' : 458,
                width: '100%',
              }}
            />
          ) : (
            <Group gap={8} wrap="nowrap">
              <ActionIcon
                variant="outline"
                color="teal"
                size={32}
                aria-label="Открыть поиск сотрудников"
                title="Открыть поиск сотрудников"
                onClick={() => setIsSearchExpanded(true)}
              >
                <IconSearch size={16} />
              </ActionIcon>

              {isMobile && (
                <Popover
                  opened={filterOpen}
                  onClose={() => setFilterOpen(false)}
                  position="bottom-end"
                  shadow="md"
                  withinPortal
                  withArrow
                >
                  <Popover.Target>
                    <ActionIcon
                      variant={isFilterActive ? 'filled' : 'outline'}
                      color="teal"
                      size={32}
                      aria-label="Фильтр по ролям"
                      title="Фильтр по ролям"
                      onClick={openRoleFilter}
                    >
                      <IconFilter size={16} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown
                    p={0}
                    style={{ minWidth: 332 }}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Group
                      justify="space-between"
                      px={16}
                      style={{
                        height: 45,
                        borderBottom:
                          '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <Group gap={8}>
                        <IconFilter size={16} />
                        <Text fw={700} size="md">
                          Фильтр
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
                    <Stack gap={0} px={16} pt={12} pb={4}>
                      <Checkbox
                        py={4}
                        label={
                          <Text size="sm" fw={600}>
                            Все роли
                          </Text>
                        }
                        checked={isAllRolesSelected}
                        indeterminate={
                          draftRoleCodes.length > 0 &&
                          draftRoleCodes.length < allRoleCodes.length
                        }
                        onChange={(e) => {
                          if (e.currentTarget.checked)
                            setDraftRoleCodes(allRoleCodes);
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
                              setDraftRoleCodes((prev) =>
                                prev.includes(code) ? prev : [...prev, code],
                              );
                            else
                              setDraftRoleCodes((prev) =>
                                prev.filter((c) => c !== code),
                              );
                          }}
                        />
                      ))}
                    </Stack>
                    <Group
                      px={16}
                      pb={12}
                      pt={12}
                      gap={8}
                      style={{
                        borderTop:
                          '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <Button style={{ flex: 1 }} onClick={applyRoleFilter}>
                        Применить
                      </Button>
                      <Button
                        variant="default"
                        style={{ flex: 1 }}
                        disabled={!isFilterActive && isAllRolesSelected}
                        onClick={resetRoleFilter}
                      >
                        Сбросить
                      </Button>
                    </Group>
                  </Popover.Dropdown>
                </Popover>
              )}
            </Group>
          )}
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
                    <Table.Th key={col.key} style={{ whiteSpace: 'nowrap' }}>
                      <Group
                        justify="space-between"
                        gap={8}
                        wrap="nowrap"
                        style={{ width: '100%' }}
                      >
                        <Text fw={700} size="xs">
                          {col.label}
                        </Text>
                        <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
                          {col.key === 'role' && !isMobile && (
                            <Popover
                              opened={filterOpen}
                              onClose={() => setFilterOpen(false)}
                              position="bottom-end"
                              shadow="md"
                              withinPortal
                              withArrow
                            >
                              <Popover.Target>
                                <Group gap={0} wrap="nowrap">
                                  <ActionIcon
                                    variant="transparent"
                                    color={isFilterActive ? 'teal' : 'gray'}
                                    size={16}
                                    aria-label="Фильтр по ролям"
                                    title="Фильтр по ролям"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openRoleFilter();
                                    }}
                                  >
                                    <IconFilter size={14} />
                                  </ActionIcon>
                                  {isFilterActive && (
                                    <Box
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openRoleFilter();
                                      }}
                                      style={{
                                        alignItems: 'center',
                                        background:
                                          'var(--mantine-color-teal-filled)',
                                        borderRadius: 8,
                                        color: 'var(--mantine-color-white)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        fontSize: 10,
                                        height: 12,
                                        justifyContent: 'center',
                                        lineHeight: '12.5px',
                                        minWidth: 12,
                                        padding: '0 2px',
                                      }}
                                    >
                                      {activeRoleCountLabel}
                                    </Box>
                                  )}
                                </Group>
                              </Popover.Target>
                              <Popover.Dropdown
                                p={0}
                                style={{ minWidth: 332 }}
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Group
                                  justify="space-between"
                                  px={16}
                                  style={{
                                    height: 45,
                                    borderBottom:
                                      '1px solid var(--mantine-color-default-border)',
                                  }}
                                >
                                  <Group gap={8}>
                                    <IconFilter size={16} />
                                    <Text fw={700} size="md">
                                      Фильтр
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
                                <Stack gap={0} px={16} pt={12} pb={4}>
                                  <Checkbox
                                    py={4}
                                    label={
                                      <Text size="sm" fw={600}>
                                        Все роли
                                      </Text>
                                    }
                                    checked={isAllRolesSelected}
                                    indeterminate={
                                      draftRoleCodes.length > 0 &&
                                      draftRoleCodes.length <
                                        allRoleCodes.length
                                    }
                                    onChange={(e) => {
                                      if (e.currentTarget.checked)
                                        setDraftRoleCodes(allRoleCodes);
                                      else setDraftRoleCodes([]);
                                    }}
                                  />
                                  {allRoles.map((role) => (
                                    <Checkbox
                                      key={role.id}
                                      py={4}
                                      label={role.name ?? role.code}
                                      checked={draftRoleCodes.includes(
                                        role.code ?? '',
                                      )}
                                      onChange={(e) => {
                                        const code = role.code ?? '';
                                        if (e.currentTarget.checked)
                                          setDraftRoleCodes((prev) =>
                                            prev.includes(code)
                                              ? prev
                                              : [...prev, code],
                                          );
                                        else
                                          setDraftRoleCodes((prev) =>
                                            prev.filter((c) => c !== code),
                                          );
                                      }}
                                    />
                                  ))}
                                </Stack>
                                <Group
                                  px={16}
                                  pb={12}
                                  pt={12}
                                  gap={8}
                                  style={{
                                    borderTop:
                                      '1px solid var(--mantine-color-default-border)',
                                  }}
                                >
                                  <Button
                                    style={{ flex: 1 }}
                                    onClick={applyRoleFilter}
                                  >
                                    Применить
                                  </Button>
                                  <Button
                                    variant="default"
                                    style={{ flex: 1 }}
                                    disabled={
                                      !isFilterActive && isAllRolesSelected
                                    }
                                    onClick={resetRoleFilter}
                                  >
                                    Сбросить
                                  </Button>
                                </Group>
                              </Popover.Dropdown>
                            </Popover>
                          )}
                          <SortIcon colKey={col.key} colLabel={col.label} />
                        </Group>
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
                          {emptyMembersText}
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
                                textDecorationColor:
                                  'var(--mantine-color-default-border)',
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
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedMember(m);
                              }}
                            >
                              Редактировать
                            </Menu.Item>
                            {isMe(m) ? (
                              <Menu.Item
                                leftSection={<IconLogout size={12} />}
                                color="red"
                                disabled={!canLeaveWorkspace(m)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setConfirmAction({
                                    member: m,
                                    isLeave: true,
                                  });
                                }}
                              >
                                Покинуть пространство
                              </Menu.Item>
                            ) : (
                              <Menu.Item
                                leftSection={<IconTrash size={12} />}
                                color="red"
                                disabled={!canDeleteMember(m)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setConfirmAction({
                                    member: m,
                                    isLeave: false,
                                  });
                                }}
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
              {emptyMembersText}
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
                              textDecorationColor:
                                'var(--mantine-color-default-border)',
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
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedMember(m);
                            }}
                          >
                            Редактировать
                          </Menu.Item>
                          {isMe(m) ? (
                            <Menu.Item
                              leftSection={<IconLogout size={12} />}
                              color="red"
                              disabled={!canLeaveWorkspace(m)}
                              onClick={(event) => {
                                event.stopPropagation();
                                setConfirmAction({ member: m, isLeave: true });
                              }}
                            >
                              Покинуть пространство
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              leftSection={<IconTrash size={12} />}
                              color="red"
                              disabled={!canDeleteMember(m)}
                              onClick={(event) => {
                                event.stopPropagation();
                                setConfirmAction({ member: m, isLeave: false });
                              }}
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

                if (
                  confirmAction.isLeave &&
                  isOwnerRoleCode(confirmAction.member.role?.code)
                ) {
                  notifications.show({
                    color: 'red',
                    message: 'Владелец не может покинуть пространство',
                  });
                  setConfirmAction(null);
                  return;
                }

                if (
                  !confirmAction.isLeave &&
                  isOwnerRoleCode(confirmAction.member.role?.code)
                ) {
                  notifications.show({
                    color: 'red',
                    message: 'Нельзя удалить владельца пространства',
                  });
                  setConfirmAction(null);
                  return;
                }

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
        canDelete={selectedMember ? canDeleteMember(selectedMember) : false}
        onClose={() => setSelectedMember(null)}
        onDelete={(m) => {
          if (!canDeleteMember(m)) {
            notifications.show({
              color: 'red',
              message: 'Нельзя удалить владельца пространства',
            });
            return;
          }
          setSelectedMember(null);
          setConfirmAction({ member: m, isLeave: false });
        }}
      />
    </Stack>
  );
};

export default WorkspaceMembersPage;
