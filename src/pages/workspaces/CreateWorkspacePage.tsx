import {
  Button,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import {
  getGetApiV1WorkspacesQueryKey,
  getGetApiV1WorkspacesQueryOptions,
  usePostApiV1Workspaces,
} from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES } from "../../shared/constants/routes";
import { queryClient } from "../../shared/api/queryClient";
import type { WorkspacesListResponse } from "../../shared/api/generated/schemas";
import { setStoredWorkspaceId } from "../../providers/WorkspaceProvider";

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось создать пространство";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось создать пространство. Попробуйте еще раз.";
};

const CreateWorkspacePage = () => {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? "Введите название" : null),
    },
  });

  const createMutation = usePostApiV1Workspaces({
    mutation: {
      onSuccess: async (response) => {
        notifications.show({
          color: "teal",
          title: "Пространство создано",
          message: "Можно приступать к работе.",
        });

        const createdWorkspace = response.workspace;
        if (createdWorkspace) {
          setStoredWorkspaceId(createdWorkspace.id ?? null);
          const queryKey = getGetApiV1WorkspacesQueryKey();
          const current = queryClient.getQueryData<
            WorkspacesListResponse | undefined
          >(queryKey);
          if (current?.workspaces?.length) {
            const nextWorkspaces = [
              createdWorkspace,
              ...current.workspaces.filter(
                (workspace) => workspace.id !== createdWorkspace.id,
              ),
            ];
            queryClient.setQueryData<WorkspacesListResponse | undefined>(
              queryKey,
              {
                workspaces: nextWorkspaces,
                total: Math.max(current.total ?? 0, nextWorkspaces.length),
                limit: current.limit ?? 50,
                offset: current.offset ?? 0,
              },
            );
          } else {
            try {
              const { queryFn } = getGetApiV1WorkspacesQueryOptions();
              const fetched = await queryClient.fetchQuery({
                queryKey,
                queryFn,
              });
              if (fetched) {
                const nextWorkspaces = [
                  createdWorkspace,
                  ...(fetched?.workspaces?.filter(
                    (workspace) => workspace.id !== createdWorkspace.id,
                  ) || []),
                ];
                queryClient.setQueryData<WorkspacesListResponse | undefined>(
                  queryKey,
                  {
                    ...fetched,
                    workspaces: nextWorkspaces,
                    total: Math.max(fetched.total ?? 0, nextWorkspaces.length),
                  },
                );
              }
            } catch {
              queryClient.removeQueries({ queryKey });
            }
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1WorkspacesQueryKey(),
          });
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

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate({
      data: {
        name: values.name.trim(),
      },
    });
  });

  return (
    <div className="auth-page">
      <Container size={460} my="xl">
        <Title order={2} ta="center" className="auth-title">
          Создание пространства
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={6}>
          Укажите название, чтобы продолжить работу.
        </Text>

        <Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                label="Название"
                placeholder="Моя команда"
                autoComplete="off"
                {...form.getInputProps("name")}
              />
              <Button type="submit" loading={createMutation.isPending}>
                Создать пространство
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default CreateWorkspacePage;
