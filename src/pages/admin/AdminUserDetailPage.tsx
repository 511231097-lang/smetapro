import {
  Button,
  Center,
  Group,
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
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  getGetApiV1AdminUsersIdQueryKey,
  getGetApiV1AdminUsersQueryKey,
  useDeleteApiV1AdminUsersId,
  useGetApiV1AdminUsersId,
  usePutApiV1AdminUsersId,
} from "../../shared/api/generated/smetchik";
import type {
  AdminUsersListResponse,
  GetApiV1AdminUsersId200,
} from "../../shared/api/generated/schemas";
import { HttpClientError } from "../../shared/api/httpClient";
import { queryClient } from "../../shared/api/queryClient";
import { ROUTES } from "../../shared/constants/routes";

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
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

  const { data, isLoading, isError } = useGetApiV1AdminUsersId(userId ?? "", {
    query: {
      enabled: !!userId,
    },
  });

  const user = data?.user;

  useEffect(() => {
    if (!user) {
      return;
    }
    form.setValues({
      phone: user.phone ?? "",
      name: user.name ?? "",
      surname: user.surname ?? "",
      email: user.email ?? "",
    });
  }, [user?.email, user?.id, user?.name, user?.phone, user?.surname]);

  const updateMutation = usePutApiV1AdminUsersId({
    mutation: {
      onSuccess: (response) => {
        const updated = response.user;
        if (updated && userId) {
          queryClient.setQueryData<GetApiV1AdminUsersId200 | undefined>(
            getGetApiV1AdminUsersIdQueryKey(userId),
            { user: updated },
          );
          queryClient.setQueriesData<AdminUsersListResponse | undefined>(
            { queryKey: getGetApiV1AdminUsersQueryKey(), exact: false },
            (current) => {
              if (!current?.users) {
                return current;
              }
              return {
                ...current,
                users: current.users.map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
              };
            },
          );
        }
        notifications.show({
          color: "teal",
          title: "Пользователь обновлён",
          message: "Изменения сохранены.",
        });
      },
      onError: (error) => {
        notifications.show({
          color: "red",
          title: "Ошибка",
          message: getErrorMessage(error),
        });
      },
    },
  });

  const deleteMutation = useDeleteApiV1AdminUsersId({
    mutation: {
      onSuccess: () => {
        if (userId) {
          queryClient.removeQueries({
            queryKey: getGetApiV1AdminUsersIdQueryKey(userId),
          });
        }
        queryClient.setQueriesData<AdminUsersListResponse | undefined>(
          { queryKey: getGetApiV1AdminUsersQueryKey(), exact: false },
          (current) => {
            if (!current?.users) {
              return current;
            }
            return {
              ...current,
              users: current.users.filter((item) => item.id !== userId),
              total:
                current.total === undefined
                  ? current.users.length - 1
                  : Math.max(current.total - 1, 0),
            };
          },
        );
        notifications.show({
          color: "teal",
          title: "Пользователь удалён",
          message: "Пользователь больше недоступен.",
        });
        navigate(ROUTES.ADMIN_USERS, { replace: true });
      },
      onError: (error) => {
        notifications.show({
          color: "red",
          title: "Ошибка",
          message: getErrorMessage(error),
        });
      },
    },
  });

  if (!userId) {
    return <Navigate to={ROUTES.ADMIN_USERS} replace />;
  }

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !user) {
    return (
      <Stack>
        <Title order={2}>Пользователь</Title>
        <Text c="red">Пользователь не найден.</Text>
      </Stack>
    );
  }

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate({
      id: userId,
      data: {
        phone: values.phone.trim(),
        name: values.name.trim(),
        surname: values.surname.trim() || undefined,
        email: values.email.trim() || undefined,
      },
    });
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }
    const confirmed = window.confirm(
      "Удалить пользователя? Это действие нельзя отменить.",
    );
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate({ id: userId });
  };

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={3}>Профиль пользователя</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Обновите контактные данные или удалите пользователя.
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
            <Group justify="space-between">
              <Button type="submit" loading={updateMutation.isPending}>
                Сохранить
              </Button>
              <Button
                color="red"
                variant="light"
                onClick={handleDelete}
                loading={deleteMutation.isPending}
              >
                Удалить пользователя
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось выполнить действие";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие. Попробуйте еще раз.";
};

export default AdminUserDetailPage;
