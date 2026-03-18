import {
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  useDeleteWorkspacesWorkspaceId,
  useGetWorkspacesWorkspaceId,
  usePutWorkspacesWorkspaceId,
} from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES } from "../../shared/constants/routes";
import { queryClient } from "../../shared/api/queryClient";

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось сохранить проект";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось сохранить проект. Попробуйте еще раз.";
};

const EditProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const form = useForm({
    initialValues: {
      name: "",
      address: "",
      comment: "",
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? "Введите название" : null),
    },
  });

  const { data, isLoading, isError } = useGetWorkspacesWorkspaceId(
    projectId ?? "",
    {
      query: {
        enabled: !!projectId,
      },
    },
  );
  const project = data?.workspace;

  useEffect(() => {
    if (!project || initialized) {
      return;
    }
    form.setValues({
      name: project.name ?? "",
      // address: project.address ?? "",
      // comment: project.comment ?? "",
    });
    setInitialized(true);
  }, [form, initialized, project]);

  const workspaceId = useMemo(() => project?.id ?? null, [project]);

  const removeProjectQueries = (targetWorkspaceId?: string | null) => {
    if (targetWorkspaceId) {
      queryClient.removeQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] ===
            `/api/v1/workspaces/${targetWorkspaceId}/projects`,
      });
    }
    if (projectId) {
      queryClient.removeQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === `/api/v1/projects/${projectId}`,
      });
    }
  };

  const updateMutation = usePutWorkspacesWorkspaceId({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: "teal",
          title: "Проект обновлён",
          message: "Изменения сохранены.",
        });
        removeProjectQueries(workspaceId);
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

  const deleteMutation = useDeleteWorkspacesWorkspaceId({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: "teal",
          title: "Проект удалён",
          message: "Проект больше недоступен.",
        });
        removeProjectQueries(workspaceId);
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

  if (!projectId) {
    return <Navigate to={ROUTES.PROJECTS} replace />;
  }

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError || !project) {
    return (
      <Stack>
        <Title order={2}>Проект</Title>
        <Text c="red">Проект не найден.</Text>
      </Stack>
    );
  }

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate({
      workspaceId: projectId,
      data: {
        name: values.name.trim(),
        // address: values.address.trim() || undefined,
        // comment: values.comment.trim() || undefined,
      },
    });
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }
    const confirmed = window.confirm(
      "Удалить проект? Это действие нельзя отменить.",
    );
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate({ workspaceId: projectId });
  };

  return (
    <div className="auth-page">
      <Container size={520} my="xl">
        <Title order={2} ta="center" className="auth-title">
          Редактирование проекта
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={6}>
          Обновите данные проекта или удалите его.
        </Text>

        <Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                label="Название"
                placeholder="Строительство дома"
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Адрес"
                placeholder="ул. Примерная, д. 1"
                {...form.getInputProps("address")}
              />
              <Textarea
                label="Комментарий"
                placeholder="Заметки по проекту"
                minRows={4}
                autosize
                {...form.getInputProps("comment")}
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
                  Удалить проект
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default EditProjectPage;
