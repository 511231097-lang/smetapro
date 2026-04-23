import {
  Avatar,
  Box,
  Button,
  Drawer,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import type {
  WorkspacesMemberResponse,
  WorkspacesUpdateMemberProfileRequest,
} from '../../shared/api/generated/schemas';
import {
  deleteWorkspacesWorkspaceIdMembersMemberIdAvatar,
  getGetWorkspacesWorkspaceIdMembersQueryKey,
  postWorkspacesWorkspaceIdMembersMemberIdAvatar,
  useGetWorkspacesWorkspaceIdRoles,
  usePatchWorkspacesWorkspaceIdMembersMemberId,
  usePatchWorkspacesWorkspaceIdMembersMemberIdRole,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';
import ImageEditorModal, {
  type EditorSource,
} from '../../shared/components/ImageEditorModal';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberId = member?.id ?? '';
  const memberName = member?.name ?? '';
  const memberSurname = member?.surname ?? '';
  const memberPhone = member?.phone ?? '';
  const memberEmail = member?.email ?? '';
  const memberTelegram = member?.telegram ?? '';
  const memberPosition = member?.position ?? '';
  const memberRoleCode = member?.role?.code ?? '';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    member?.avatar_url ?? null,
  );
  const [editorSource, setEditorSource] = useState<EditorSource | null>(null);
  const [avatarPreviewOpened, setAvatarPreviewOpened] = useState(false);
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

  useEffect(() => {
    if (!memberId) {
      setAvatarUrl(null);
      setAvatarPreviewOpened(false);
      return;
    }

    setAvatarUrl(member?.avatar_url ?? null);
    setAvatarPreviewOpened(false);
  }, [memberId, member?.avatar_url]);

  useEffect(() => {
    return () => {
      if (editorSource?.url) {
        URL.revokeObjectURL(editorSource.url);
      }
    };
  }, [editorSource?.url]);

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

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!workspaceId || !memberId) {
        throw new Error('Не удалось определить сотрудника');
      }

      const formData = new FormData();
      formData.append('file', file);

      return postWorkspacesWorkspaceIdMembersMemberIdAvatar(
        workspaceId,
        memberId,
        {
          data: formData,
        },
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      setAvatarUrl(response.avatar_url ?? null);
      setEditorSource(null);

      notifications.show({
        color: 'teal',
        message: 'Фото сотрудника обновлено',
      });
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        message: getErrorMessage(error),
      });
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !memberId) {
        throw new Error('Не удалось определить сотрудника');
      }

      return deleteWorkspacesWorkspaceIdMembersMemberIdAvatar(
        workspaceId,
        memberId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      setAvatarPreviewOpened(false);
      setAvatarUrl(null);

      notifications.show({
        color: 'teal',
        message: 'Фото сотрудника удалено',
      });
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        message: getErrorMessage(error),
      });
    },
  });

  const closeEditor = () => {
    if (uploadAvatarMutation.isPending) return;
    setEditorSource(null);
  };

  const handleAvatarFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png']);
    const maxSize = 3 * 1024 * 1024;

    if (!allowedTypes.has(file.type.toLowerCase())) {
      notifications.show({
        color: 'red',
        title: 'Неверный формат',
        message: 'Поддерживаются файлы *.jpeg, *.jpg, *.png',
      });
      return;
    }

    if (file.size > maxSize) {
      notifications.show({
        color: 'red',
        title: 'Файл слишком большой',
        message: 'Максимальный размер изображения — 3.0 MB',
      });
      return;
    }

    setEditorSource({
      file,
      url: URL.createObjectURL(file),
    });
  };

  const handleSave = form.onSubmit(async (values) => {
    if (!member?.id) return;

    const profileData: WorkspacesUpdateMemberProfileRequest = {};
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

  const isPending =
    patchMember.isPending ||
    patchRole.isPending ||
    uploadAvatarMutation.isPending ||
    deleteAvatarMutation.isPending;

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
              <Box
                component={avatarUrl ? 'button' : 'div'}
                type={avatarUrl ? 'button' : undefined}
                aria-label={avatarUrl ? 'Открыть фото сотрудника' : undefined}
                onClick={
                  avatarUrl ? () => setAvatarPreviewOpened(true) : undefined
                }
                title={avatarUrl ? 'Открыть фото сотрудника' : undefined}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: avatarUrl ? 'zoom-in' : 'default',
                  padding: 0,
                }}
              >
                <Avatar
                  size={56}
                  radius={9999}
                  color={primaryColor}
                  src={avatarUrl ?? undefined}
                >
                  {initials}
                </Avatar>
              </Box>
              <Button
                variant="outline"
                color="gray"
                size="xs"
                leftSection={<IconUpload size={14} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
              >
                Загрузить фото
              </Button>
              {avatarUrl && (
                <Button
                  variant="default"
                  color="gray"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => deleteAvatarMutation.mutate()}
                  disabled={deleteAvatarMutation.isPending}
                >
                  Удалить фото
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.png"
                style={{ display: 'none' }}
                onChange={handleAvatarFileSelect}
              />
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
      <Modal
        opened={avatarPreviewOpened}
        onClose={() => setAvatarPreviewOpened(false)}
        centered
        size="auto"
        title={fullName}
      >
        <Stack align="center" p="md">
          <Avatar
            size={240}
            radius={9999}
            color={primaryColor}
            src={avatarUrl ?? undefined}
          >
            {initials}
          </Avatar>
        </Stack>
      </Modal>
      <ImageEditorModal
        opened={!!editorSource}
        source={editorSource}
        shape="circle"
        loading={uploadAvatarMutation.isPending}
        onClose={closeEditor}
        onSave={async (file) => {
          await uploadAvatarMutation.mutateAsync(file);
        }}
      />
    </>
  );
};

export default MemberDrawer;
