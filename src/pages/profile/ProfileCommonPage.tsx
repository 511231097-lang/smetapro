import {
  Alert,
  Avatar,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconPhone,
  IconTrash,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import {
  getGetAuthMeQueryKey,
  getGetProfileQueryKey,
  useGetAuthMe,
  usePatchProfile,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { queryClient } from '../../shared/api/queryClient';

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось сохранить профиль';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось сохранить профиль';
};

const ProfileCommonPage = () => {
  const { data: userResp, isLoading, isError } = useGetAuthMe({});
  const user = userResp?.user;
  const userId = user?.id;
  const userName = user?.name ?? '';
  const userSurname = user?.surname ?? '';
  const userEmail = user?.email ?? '';
  const userPhone = user?.phone ?? '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const { primaryColor } = usePrimaryColor();

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  const form = useForm({
    initialValues: {
      name: '',
      surname: '',
      email: '',
      phone: '',
    },
    validate: {
      phone: (value) => (value.trim().length === 0 ? 'Введите телефон' : null),
    },
  });
  const { setValues } = form;

  useEffect(() => {
    if (!userId) return;
    setValues({
      name: userName,
      surname: userSurname,
      email: userEmail,
      phone: userPhone,
    });
  }, [setValues, userId, userName, userSurname, userEmail, userPhone]);

  const updateProfileMutation = usePatchProfile({
    mutation: {
      onSuccess: (response) => {
        const updatedUser = response.user;
        if (!updatedUser) {
          queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          return;
        }

        queryClient.setQueryData(getGetAuthMeQueryKey(), { user: updatedUser });
        queryClient.setQueryData(getGetProfileQueryKey(), {
          user: updatedUser,
        });

        setValues({
          name: updatedUser.name ?? '',
          surname: updatedUser.surname ?? '',
          email: updatedUser.email ?? '',
          phone: updatedUser.phone ?? '',
        });
        form.resetDirty();

        notifications.show({
          color: 'teal',
          title: 'Профиль обновлён',
          message: 'Изменения сохранены.',
        });
      },
      onError: (error) => {
        notifications.show({
          color: 'red',
          title: 'Ошибка',
          message: getErrorMessage(error),
        });
      },
    },
  });

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !user) {
    return <Text c="red">Не удалось загрузить профиль.</Text>;
  }

  const handleSubmit = form.onSubmit((values) => {
    if (!form.isDirty()) return;

    updateProfileMutation.mutate({
      data: {
        name: values.name.trim(),
        surname: values.surname.trim(),
        phone: values.phone.trim(),
      },
    });
  });

  return (
    <>
      <Stack gap={16} maw={672}>
        {/* Личные данные */}
        <Paper radius="md" p={24}>
          <Stack gap={16}>
            <Box>
              <Title order={4}>Личные данные</Title>
              {user.id && (
                <Text fz={12} c="dimmed" mt={2}>
                  ID: {user.id}
                </Text>
              )}
            </Box>

            {/* Аватар */}
            <Group gap={16} align="center">
              <Avatar
                variant="filled"
                radius={9999}
                size={56}
                color={primaryColor}
              >
                {initials}
              </Avatar>
              <Button
                variant="outline"
                color="gray"
                size="xs"
                leftSection={<IconUpload size={12} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Загрузить фото
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.png,.gif"
                style={{ display: 'none' }}
              />
            </Group>

            <form onSubmit={handleSubmit} noValidate>
              <Stack gap={12}>
                <SimpleGrid cols={2} spacing={12}>
                  <TextInput
                    label="Имя"
                    placeholder="Иван"
                    leftSection={<IconUser size={14} />}
                    {...form.getInputProps('name')}
                  />
                  <TextInput
                    label="Фамилия"
                    placeholder="Петров"
                    leftSection={<IconUser size={14} />}
                    {...form.getInputProps('surname')}
                  />
                </SimpleGrid>

                <SimpleGrid cols={2} spacing={12}>
                  <TextInput
                    label="Почта"
                    placeholder="ivan@example.com"
                    type="email"
                    readOnly
                    leftSection={
                      <Text fz={12} c="dimmed">
                        @
                      </Text>
                    }
                    {...form.getInputProps('email')}
                  />
                  <TextInput
                    label="Телефон"
                    withAsterisk
                    placeholder="+7 (000) 000-00-00"
                    type="tel"
                    leftSection={<IconPhone size={14} />}
                    {...form.getInputProps('phone')}
                  />
                </SimpleGrid>

                <Group justify="flex-end" mt={4}>
                  <Button
                    type="submit"
                    loading={updateProfileMutation.isPending}
                    disabled={!form.isDirty()}
                  >
                    Сохранить
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Paper>

        {/* Удаление аккаунта */}
        <Paper
          radius="md"
          p={24}
          style={{ border: '1px solid var(--mantine-color-red-5)' }}
        >
          <Stack gap={8}>
            <Title order={4} c="red">
              Удаление аккаунта
            </Title>
            <Text fz={14} c="dimmed">
              Это действие навсегда удалит все ваши данные
            </Text>
            <Box mt={4}>
              <Button
                variant="outline"
                color="red"
                size="sm"
                leftSection={<IconTrash size={16} />}
                onClick={openDelete}
              >
                Удалить аккаунт
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {/* Модалка удаления */}
      <Modal
        opened={deleteOpen}
        onClose={closeDelete}
        title="Удаление аккаунта"
        size="md"
        centered
      >
        <Stack gap={16}>
          <Alert
            color="red"
            variant="outline"
            icon={<IconAlertTriangle size={16} />}
          >
            <Text fw={600} fz={14} c="red" mb={8}>
              Внимание! Это действие приведёт к следующему:
            </Text>
            <Stack gap={4} component="ul" pl={20} m={0}>
              <Text component="li" fz={14}>
                Аккаунт и все его данные будут удалены без возможности
                восстановления
              </Text>
              <Text component="li" fz={14}>
                Вы потеряете доступ ко всем рабочим пространствам
              </Text>
              <Text component="li" fz={14}>
                Рабочие пространства, где вы единственный участник, будут
                удалены
              </Text>
            </Stack>
          </Alert>

          <TextInput
            label="Для подтверждения введите слово Удалить"
            placeholder="Удалить"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.currentTarget.value)}
          />

          <Group justify="flex-end" gap={8}>
            <Button variant="default" onClick={closeDelete}>
              Отменить
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              disabled={deleteConfirm.toLowerCase().trim() !== 'удалить'}
              onClick={() => {
                // API delete будет добавлен позже
                closeDelete();
              }}
            >
              Удалить аккаунт
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default ProfileCommonPage;
