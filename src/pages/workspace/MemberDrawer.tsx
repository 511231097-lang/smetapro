import {
  Avatar,
  Button,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect } from 'react';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type { WorkspacesMemberResponse } from '../../shared/api/generated/schemas';
import {
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  useGetWorkspacesWorkspaceIdRoles,
  usePatchWorkspacesWorkspaceIdMembersMemberId,
  usePatchWorkspacesWorkspaceIdMembersMemberIdRole,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { isOwnerRoleCode } from '../../shared/constants/roles';
import { getInitials } from '../../shared/utils/getInitials';

type Props = {
  canDelete: boolean;
  member: WorkspacesMemberResponse | null;
  workspaceId: string;
  onClose: () => void;
  onDelete: (member: WorkspacesMemberResponse) => void;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось выполнить действие';
  }
  return 'Не удалось выполнить действие';
};

const MemberDrawer = ({
  canDelete,
  member,
  workspaceId,
  onClose,
  onDelete,
}: Props) => {
  const { primaryColor } = usePrimaryColor();
  const memberId = member?.id ?? '';
  const memberName = member?.name ?? '';
  const memberSurname = member?.surname ?? '';
  const memberPhone = member?.phone ?? '';
  const memberEmail = member?.email ?? '';
  const memberTelegram = member?.telegram ?? '';
  const memberPosition = member?.position ?? '';
  const memberRoleCode = member?.role?.code ?? '';
  const isOwnerMember = isOwnerRoleCode(memberRoleCode);
  const { data: rolesData } = useGetWorkspacesWorkspaceIdRoles(workspaceId, {
    query: { enabled: !!workspaceId },
  });

  const roleOptions =
    rolesData?.roles
      ?.filter((role) =>
        isOwnerMember
          ? isOwnerRoleCode(role.code)
          : !isOwnerRoleCode(role.code),
      )
      .map((role) => ({
        value: role.code ?? '',
        label: role.name ?? role.code ?? '',
      })) ?? [];

  const form = useForm({
    initialValues: {
      name: '',
      surname: '',
      phone: '',
      email: '',
      telegram: '',
      position: '',
      role_code: '',
    },
  });
  const { setValues } = form;

  // Sync form when member changes
  useEffect(() => {
    if (!memberId) return;

    setValues({
      name: memberName,
      surname: memberSurname,
      phone: memberPhone,
      email: memberEmail,
      telegram: memberTelegram,
      position: memberPosition,
      role_code: memberRoleCode,
    });
  }, [
    setValues,
    memberId,
    memberName,
    memberSurname,
    memberPhone,
    memberEmail,
    memberTelegram,
    memberPosition,
    memberRoleCode,
  ]);

  const membersQueryKey =
    getGetWorkspacesWorkspaceIdMembersQueryKey(workspaceId);

  const patchMember = usePatchWorkspacesWorkspaceIdMembersMemberId({
    mutation: {
      onError: (error) => {
        notifications.show({ color: 'red', message: getErrorMessage(error) });
      },
    },
  });

  const patchRole = usePatchWorkspacesWorkspaceIdMembersMemberIdRole({
    mutation: {
      onError: (error) => {
        notifications.show({ color: 'red', message: getErrorMessage(error) });
      },
    },
  });

  const handleSave = form.onSubmit(async (values) => {
    if (!member?.id) return;

    const profileData: {
      email?: string;
      name?: string;
      phone?: string;
      position?: string;
      surname?: string;
      telegram?: string;
    } = {};
    if (values.name !== (member.name ?? '')) {
      profileData.name = values.name;
    }
    if (values.surname !== (member.surname ?? '')) {
      profileData.surname = values.surname;
    }
    if (values.phone !== (member.phone ?? '')) {
      profileData.phone = values.phone;
    }
    if (values.email !== (member.email ?? '')) {
      profileData.email = values.email;
    }
    if (values.telegram !== (member.telegram ?? '')) {
      profileData.telegram = values.telegram;
    }
    if (values.position !== (member.position ?? '')) {
      profileData.position = values.position;
    }
    const profileChanged = Object.keys(profileData).length > 0;

    const roleChanged = values.role_code !== (member.role?.code ?? '');

    const patches: Promise<unknown>[] = [];

    if (profileChanged) {
      patches.push(
        patchMember.mutateAsync({
          workspaceId,
          memberId: member.id,
          data: profileData,
        }),
      );
    }

    if (roleChanged && values.role_code) {
      patches.push(
        patchRole.mutateAsync({
          workspaceId,
          memberId: member.id,
          data: { role_code: values.role_code },
        }),
      );
    }

    if (patches.length === 0) {
      onClose();
      return;
    }

    try {
      await Promise.all(patches);
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      notifications.show({
        color: 'teal',
        message: 'Данные сотрудника сохранены',
      });
      onClose();
    } catch {
      // errors already shown via onError above
    }
  });

  const isPending = patchMember.isPending || patchRole.isPending;

  const initials = getInitials(member?.name, member?.surname);
  const fullName =
    [member?.name, member?.surname].filter(Boolean).join(' ') || 'Сотрудник';
  const title = `Профиль ${fullName}`;

  return (
    <>
      {/* Member Drawer */}
      <Drawer
        opened={!!member}
        onClose={onClose}
        position="right"
        size={480}
        title={
          <Text fw={700} size="lg" truncate>
            {title}
          </Text>
        }
        styles={{
          content: {
            display: 'flex',
            flexDirection: 'column',
          },
          body: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            padding: 0,
          },
          header: {
            borderBottom: '1px solid var(--mantine-color-default-border)',
            paddingBottom: 12,
          },
        }}
      >
        <form
          onSubmit={handleSave}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Stack
            gap="md"
            p={20}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            {/* Avatar row */}
            <Group gap="md" align="center">
              <Avatar size={56} radius="xl" color={primaryColor}>
                {initials}
              </Avatar>
              <Button
                variant="outline"
                color="gray"
                size="xs"
                leftSection={<IconUpload size={14} />}
              >
                Загрузить фото
              </Button>
            </Group>

            <TextInput label="Имя" {...form.getInputProps('name')} />
            <TextInput label="Фамилия" {...form.getInputProps('surname')} />
            <TextInput label="Телефон" {...form.getInputProps('phone')} />
            <TextInput
              label="Почта"
              type="email"
              {...form.getInputProps('email')}
            />
            <TextInput label="Telegram" {...form.getInputProps('telegram')} />
            <TextInput label="Должность" {...form.getInputProps('position')} />

            <Select
              label="Роль"
              data={roleOptions}
              allowDeselect={false}
              disabled={isOwnerMember}
              {...form.getInputProps('role_code')}
            />

            {/* Delete button */}
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size={16} />}
              style={{ alignSelf: 'flex-start' }}
              disabled={!canDelete}
              onClick={() => member && onDelete(member)}
              type="button"
            >
              Удалить сотрудника
            </Button>
          </Stack>

          {/* Footer */}
          <Group
            p={20}
            justify="stretch"
            style={{
              borderTop: '1px solid var(--mantine-color-default-border)',
              gap: 12,
              marginTop: 'auto',
              flexShrink: 0,
            }}
          >
            <Button
              type="submit"
              color="teal"
              loading={isPending}
              style={{ flex: 1 }}
            >
              Сохранить
            </Button>
            <Button
              variant="outline"
              color="teal"
              onClick={onClose}
              type="button"
              style={{ flex: 1 }}
            >
              Отменить
            </Button>
          </Group>
        </form>
      </Drawer>
    </>
  );
};

export default MemberDrawer;
