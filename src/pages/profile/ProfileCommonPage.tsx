import {
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import {
  getGetAuthMeQueryKey,
  useGetAuthMe,
  // usePutAdminUsersId,
} from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { queryClient } from "../../shared/api/queryClient";

const ProfileCommonPage = () => {
  const { data: user, isLoading, isError } = useGetAuthMe({});
  const form = useForm({
    initialValues: {
      phone: "",
      name: "",
      surname: "",
      email: "",
    },
    validate: {
      phone: (value) => (value.trim().length === 0 ? "Введите телефон" : null),
      name: (value) => (value.trim().length === 0 ? "Введите имя" : null),
      email: (value) => {
        if (value.trim().length === 0) {
          return null;
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? null
          : "Некорректный email";
      },
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    form.setValues({
      phone: user.user?.phone ?? "",
      email: user.user?.email ?? "",
    });
  }, [user?.user?.id, user?.user?.email, user?.user?.phone]);

  // const updateMutation = usePutAdminUsersId({
  //   mutation: {
  //     onSuccess: (response) => {
  //       const updated = response.user;
  //       if (updated) {
  //         const queryKey = getGetAuthMeQueryKey();
  //         const current = queryClient.getQueryData<typeof user | undefined>(
  //           queryKey,
  //         );
  //         queryClient.setQueryData(queryKey, {
  //           ...current,
  //           ...updated,
  //         });
  //       }
  //       notifications.show({
  //         color: "teal",
  //         title: "Профиль обновлён",
  //         message: "Изменения сохранены.",
  //       });
  //     },
  //     onError: (error) => {
  //       notifications.show({
  //         color: "red",
  //         title: "Ошибка",
  //         message: getErrorMessage(error),
  //       });
  //     },
  //   },
  // });

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
    if (!user.user?.id) {
      notifications.show({
        color: "red",
        title: "Ошибка",
        message: "Не удалось определить пользователя.",
      });
      return;
    }
    // updateMutation.mutate({
    //   id: user.user.id,
    //   data: {
    //     phone: values.phone.trim(),
    //     name: values.name.trim(),
    //     surname: values.surname.trim() || undefined,
    //     email: values.email.trim() || undefined,
    //   },
    // });
  });

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={3}>Профиль</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Обновите контактные данные.
          </Text>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <TextInput
              label="Телефон"
              placeholder="79001234567"
              type="tel"
              autoComplete="tel"
              {...form.getInputProps("phone")}
            />
            <TextInput
              label="Имя"
              placeholder="Иван"
              autoComplete="given-name"
              {...form.getInputProps("name")}
            />
            <TextInput
              label="Фамилия"
              placeholder="Петров"
              autoComplete="family-name"
              {...form.getInputProps("surname")}
            />
            <TextInput
              label="Email"
              placeholder="ivan@example.com"
              type="email"
              autoComplete="email"
              {...form.getInputProps("email")}
            />
            {/* <Button type="submit" loading={updateMutation.isPending}> */}
            <Button type="submit">Сохранить</Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось сохранить профиль";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось сохранить профиль. Попробуйте еще раз.";
};

export default ProfileCommonPage;
