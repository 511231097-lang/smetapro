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
  getGetWorkspacesWorkspaceIdQueryKey,
  getGetWorkspacesQueryKey,
  useDeleteWorkspacesWorkspaceId,
  useGetWorkspacesWorkspaceId,
  usePutWorkspacesWorkspaceId,
} from "../../shared/api/generated/smetchik";
import type { WorkspacesWorkspaceResponse } from "../../shared/api/generated/schemas";
import type { WorkspacesListResponse } from "../../shared/api/generated/schemas/workspacesListResponse";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES, buildRoute } from "../../shared/constants/routes";
import { queryClient } from "../../shared/api/queryClient";

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

  const { data, isLoading, isError } = useGetWorkspacesWorkspaceId(
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

  const updateMutation = usePutWorkspacesWorkspaceId({
    mutation: {
      onSuccess: (response) => {
        const updated = response.workspace;
        notifications.show({
          color: "teal",
          title: "Пространство обновлено",
          message: "Изменения сохранены.",
        });

        if (updated && workspaceId) {
          const listKey = getGetWorkspacesQueryKey();
          const detailKey = getGetWorkspacesWorkspaceIdQueryKey(workspaceId);
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

          queryClient.setQueryData<WorkspacesWorkspaceResponse | undefined>(
            detailKey,
            updated,
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

  const deleteMutation = useDeleteWorkspacesWorkspaceId({
    mutation: {
      onSuccess: () => {
        const listKey = getGetWorkspacesQueryKey();
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
          queryClient.setQueryData<WorkspacesListResponse | undefined>(
            listKey,
            {
              ...current,
              workspaces: remaining,
              total: nextTotal,
            },
          );
        }

        if (workspaceId) {
          queryClient.removeQueries({
            queryKey: getGetWorkspacesWorkspaceIdQueryKey(workspaceId),
          });
        }

        const storedId = workspaceId;
        if (storedId && storedId === workspaceId) {
          // активный воркспейс теперь из URL, не localStorage
        }

        if (remaining.length === 0) {
          navigate(ROUTES.WORKSPACE_CREATE, { replace: true });
          return;
        }
        navigate(
          buildRoute(ROUTES.PROJECTS, {
            workspaceId: remaining[0]?.id ?? '',
          }),
          { replace: true },
        );
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
    return <Navigate to={ROUTES.WORKSPACE_CREATE} replace />;
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
      workspaceId,
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
    deleteMutation.mutate({ workspaceId });
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
