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
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconPhone,
  IconTrash,
  IconUpload,
  IconUser,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useGetAuthMe } from "../../shared/api/generated/smetchik";

const TIMEZONE_OPTIONS = [
  { value: "UTC+0", label: "UTC+0 (Лондон)" },
  { value: "UTC+3", label: "+3 (Москва)" },
  { value: "UTC+4", label: "+4 (Самара)" },
  { value: "UTC+5", label: "+5 (Екатеринбург)" },
  { value: "UTC+6", label: "+6 (Омск)" },
  { value: "UTC+7", label: "+7 (Новосибирск)" },
  { value: "UTC+8", label: "+8 (Иркутск)" },
  { value: "UTC+9", label: "+9 (Якутск)" },
  { value: "UTC+10", label: "+10 (Владивосток)" },
  { value: "UTC+12", label: "+12 (Камчатка)" },
];

const ProfileCommonPage = () => {
  const { data: userResp, isLoading, isError } = useGetAuthMe({});
  const user = userResp?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "U";

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      timezone: "UTC+3",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.setValues({
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  const handleSubmit = form.onSubmit((_values) => {
    // API update будет добавлен позже
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
              <Avatar color="teal" variant="filled" radius="xl" size={56}>
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
                style={{ display: "none" }}
              />
            </Group>

            <form onSubmit={handleSubmit} noValidate>
              <Stack gap={12}>
                <SimpleGrid cols={2} spacing={12}>
                  <TextInput
                    label="Имя"
                    placeholder="Иван"
                    leftSection={<IconUser size={14} />}
                    {...form.getInputProps("name")}
                  />
                  <TextInput
                    label="Фамилия"
                    placeholder="Петров"
                    leftSection={<IconUser size={14} />}
                    {...form.getInputProps("surname")}
                  />
                </SimpleGrid>

                <SimpleGrid cols={2} spacing={12}>
                  <TextInput
                    label="Почта"
                    placeholder="ivan@example.com"
                    type="email"
                    leftSection={
                      <Text fz={12} c="dimmed">
                        @
                      </Text>
                    }
                    {...form.getInputProps("email")}
                  />
                  <TextInput
                    label="Телефон"
                    placeholder="+7 (000) 000-00-00"
                    type="tel"
                    leftSection={<IconPhone size={14} />}
                    {...form.getInputProps("phone")}
                  />
                </SimpleGrid>

                <Select
                  label="Часовой пояс"
                  data={TIMEZONE_OPTIONS}
                  allowDeselect={false}
                  style={{ maxWidth: "calc(50% - 6px)" }}
                  {...form.getInputProps("timezone")}
                />

                <Group justify="flex-end" mt={4}>
                  <Button type="submit" disabled={!form.isDirty()}>
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
          style={{ border: "1px solid var(--mantine-color-red-5)" }}
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
              disabled={deleteConfirm !== "Удалить"}
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
