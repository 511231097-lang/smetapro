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
  getGetApiV1AdminWorkspacesIdQueryKey,
  getGetApiV1AdminWorkspacesQueryKey,
  getGetApiV1WorkspacesIdQueryKey,
  getGetApiV1WorkspacesQueryKey,
  useDeleteApiV1AdminWorkspacesId,
  useGetApiV1AdminWorkspacesId,
  usePutApiV1AdminWorkspacesId,
} from "../../shared/api/generated/smetchik";
import type {
  AdminWorkspacesListResponse,
  GetApiV1AdminWorkspacesId200,
  GetApiV1WorkspacesId200,
} from "../../shared/api/generated/schemas";
import type { WorkspacesListResponse } from "../../shared/api/generated/schemas/workspacesListResponse";
import { HttpClientError } from "../../shared/api/httpClient";
import { queryClient } from "../../shared/api/queryClient";
import { ROUTES } from "../../shared/constants/routes";

const AdminWorkspaceDetailPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? "Введите название" : null),
    },
  });

  const { data, isLoading, isError } = useGetApiV1AdminWorkspacesId(
    workspaceId ?? "",
    {
      query: {
        enabled: !!workspaceId,
      },
    },
  );

  const workspace = data?.workspace;

  useEffect(() => {
    if (!workspace) {
      return;
    }
    form.setValues({ name: workspace.name ?? "" });
  }, [workspace?.id, workspace?.name]);

  const updateMutation = usePutApiV1AdminWorkspacesId({
    mutation: {
      onSuccess: (response) => {
        const updated = response.workspace;
        if (updated && workspaceId) {
          queryClient.setQueryData<GetApiV1AdminWorkspacesId200 | undefined>(
            getGetApiV1AdminWorkspacesIdQueryKey(workspaceId),
            { workspace: updated },
          );
          queryClient.setQueriesData<AdminWorkspacesListResponse | undefined>(
            { queryKey: getGetApiV1AdminWorkspacesQueryKey(), exact: false },
            (current) => {
              if (!current?.workspaces) {
                return current;
              }
              return {
                ...current,
                workspaces: current.workspaces.map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
              };
            },
          );

          const listKey = getGetApiV1WorkspacesQueryKey();
          const current = queryClient.getQueryData<
            WorkspacesListResponse | undefined
          >(listKey);
          if (current?.workspaces?.length) {
            queryClient.setQueryData<WorkspacesListResponse | undefined>(
              listKey,
              {
                ...current,
                workspaces: current.workspaces.map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
              },
            );
          }
          queryClient.setQueryData<GetApiV1WorkspacesId200 | undefined>(
            getGetApiV1WorkspacesIdQueryKey(workspaceId),
            { workspace: updated },
          );
        }

        notifications.show({
          color: "teal",
          title: "Пространство обновлено",
          message: "Изменения сохранены.",
        });
      },
      onError: (error: unknown) => {
        notifications.show({
          color: "red",
          title: "Ошибка",
          message: getErrorMessage(error),
        });
      },
    },
  });

  const deleteMutation = useDeleteApiV1AdminWorkspacesId({
    mutation: {
      onSuccess: () => {
        if (workspaceId) {
          queryClient.removeQueries({
            queryKey: getGetApiV1AdminWorkspacesIdQueryKey(workspaceId),
          });
        }
        queryClient.setQueriesData<AdminWorkspacesListResponse | undefined>(
          { queryKey: getGetApiV1AdminWorkspacesQueryKey(), exact: false },
          (current) => {
            if (!current?.workspaces) {
              return current;
            }
            return {
              ...current,
              workspaces: current.workspaces.filter(
                (item) => item.id !== workspaceId,
              ),
              total:
                current.total === undefined
                  ? current.workspaces.length - 1
                  : Math.max(current.total - 1, 0),
            };
          },
        );

        const listKey = getGetApiV1WorkspacesQueryKey();
        const current = queryClient.getQueryData<
          WorkspacesListResponse | undefined
        >(listKey);
        if (current?.workspaces?.length) {
          queryClient.setQueryData<WorkspacesListResponse | undefined>(
            listKey,
            {
              ...current,
              workspaces: current.workspaces.filter(
                (item) => item.id !== workspaceId,
              ),
              total:
                current.total === undefined
                  ? current.workspaces.length - 1
                  : Math.max(current.total - 1, 0),
            },
          );
        }
        if (workspaceId) {
          queryClient.removeQueries({
            queryKey: getGetApiV1WorkspacesIdQueryKey(workspaceId),
          });
        }

        notifications.show({
          color: "teal",
          title: "Пространство удалено",
          message: "Пространство больше недоступно.",
        });
        navigate(ROUTES.ADMIN_WORKSPACES, { replace: true });
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

  if (!workspaceId) {
    return <Navigate to={ROUTES.ADMIN_WORKSPACES} replace />;
  }

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !workspace) {
    return (
      <Stack>
        <Title order={2}>Пространство</Title>
        <Text c="red">Пространство не найдено.</Text>
      </Stack>
    );
  }

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate({
      id: workspaceId,
      data: {
        name: values.name.trim(),
      },
    });
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }
    const confirmed = window.confirm(
      "Удалить пространство? Это действие нельзя отменить.",
    );
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate({ id: workspaceId });
  };

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={3}>Профиль пространства</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Обновите название или удалите пространство.
          </Text>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <TextInput
              label="Название"
              placeholder="Моя компания"
              {...form.getInputProps("name")}
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
                Удалить пространство
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

export default AdminWorkspaceDetailPage;
