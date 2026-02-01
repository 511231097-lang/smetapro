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
  getGetApiV1WorkspacesIdQueryKey,
  getGetApiV1WorkspacesQueryKey,
  useDeleteApiV1WorkspacesId,
  useGetApiV1WorkspacesId,
  usePutApiV1WorkspacesId,
} from "../../shared/api/generated/smetchik";
import type { GetApiV1WorkspacesId200 } from "../../shared/api/generated/schemas";
import type { WorkspacesListResponse } from "../../shared/api/generated/schemas/workspacesListResponse";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES } from "../../shared/constants/routes";
import { queryClient } from "../../shared/api/queryClient";
import {
  getStoredWorkspaceId,
  setStoredWorkspaceId,
} from "../../providers/WorkspaceProvider";

const WorkspaceProfilePage = () => {
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

  const { data, isLoading, isError } = useGetApiV1WorkspacesId(
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

  const updateMutation = usePutApiV1WorkspacesId({
    mutation: {
      onSuccess: (response) => {
        const updated = response.workspace;
        notifications.show({
          color: "teal",
          title: "Пространство обновлено",
          message: "Изменения сохранены.",
        });

        if (updated && workspaceId) {
          const listKey = getGetApiV1WorkspacesQueryKey();
          const detailKey = getGetApiV1WorkspacesIdQueryKey(workspaceId);
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
            detailKey,
            { workspace: updated },
          );
        }
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

  const deleteMutation = useDeleteApiV1WorkspacesId({
    mutation: {
      onSuccess: () => {
        const listKey = getGetApiV1WorkspacesQueryKey();
        const current = queryClient.getQueryData<
          WorkspacesListResponse | undefined
        >(listKey);
        const remaining =
          current?.workspaces?.filter((item) => item.id !== workspaceId) ?? [];
        if (current) {
          const nextTotal =
            current.total === undefined
              ? remaining.length
              : Math.max(current.total - 1, remaining.length);
          queryClient.setQueryData<WorkspacesListResponse | undefined>(listKey, {
            ...current,
            workspaces: remaining,
            total: nextTotal,
          });
        }

        if (workspaceId) {
          queryClient.removeQueries({
            queryKey: getGetApiV1WorkspacesIdQueryKey(workspaceId),
          });
        }

        const storedId = getStoredWorkspaceId();
        if (storedId && storedId === workspaceId) {
          const nextId = remaining[0]?.id ?? null;
          setStoredWorkspaceId(nextId);
        }

        notifications.show({
          color: "teal",
          title: "Пространство удалено",
          message: "Пространство больше недоступно.",
        });

        if (remaining.length === 0) {
          navigate(ROUTES.WORKSPACE_CREATE, { replace: true });
          return;
        }
        navigate(ROUTES.PROJECTS, { replace: true });
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
    return <Navigate to={ROUTES.PROJECTS} replace />;
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

export default WorkspaceProfilePage;
