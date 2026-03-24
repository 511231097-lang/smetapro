import { useEffect } from 'react';
import {
  Avatar,
  Button,
  Drawer,
  Group,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import {
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  useGetWorkspacesWorkspaceIdRoles,
  usePatchWorkspacesWorkspaceIdMembersMemberId,
  usePatchWorkspacesWorkspaceIdMembersMemberIdRole,
} from '../../shared/api/generated/smetchik';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type { WorkspacesMemberResponse } from '../../shared/api/generated/schemas';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import { getInitials } from '../../shared/utils/getInitials';

type Props = {
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

const MemberDrawer = ({ member, workspaceId, onClose, onDelete }: Props) => {
  const { primaryColor } = usePrimaryColor();
  const { data: rolesData } = useGetWorkspacesWorkspaceIdRoles(workspaceId, {
    query: { enabled: !!workspaceId },
  });

  const roleOptions =
    rolesData?.roles?.map((r) => ({
      value: r.code ?? '',
      label: r.name ?? r.code ?? '',
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

  // Sync form when member changes
  useEffect(() => {
    if (member) {
      form.setValues({
        name: member.name ?? '',
        surname: member.surname ?? '',
        phone: member.phone ?? '',
        email: member.email ?? '',
        telegram: member.telegram ?? '',
        position: member.position ?? '',
        role_code: member.role?.code ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

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

    const profileChanged =
      values.name !== (member.name ?? '') ||
      values.surname !== (member.surname ?? '') ||
      values.phone !== (member.phone ?? '') ||
      values.email !== (member.email ?? '') ||
      values.telegram !== (member.telegram ?? '') ||
      values.position !== (member.position ?? '');

    const roleChanged = values.role_code !== (member.role?.code ?? '');

    const patches: Promise<unknown>[] = [];

    if (profileChanged) {
      patches.push(
        patchMember.mutateAsync({
          workspaceId,
          memberId: member.id,
          data: {
            name: values.name || undefined,
            surname: values.surname || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            telegram: values.telegram || undefined,
            position: values.position || undefined,
          },
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
        scrollAreaComponent={ScrollArea.Autosize}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: 0,
          },
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            paddingBottom: 12,
          },
        }}
      >
        <form
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <Stack gap="md" p={20} style={{ flex: 1 }}>
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
              {...form.getInputProps('role_code')}
            />

            {/* Delete button */}
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size={16} />}
              style={{ alignSelf: 'flex-start' }}
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
              borderTop: '1px solid var(--mantine-color-gray-2)',
              gap: 12,
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
