import {
  Button,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Navigate, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../providers/WorkspaceProvider";
import { usePostWorkspaces } from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES, buildRoute } from "../../shared/constants/routes";
import { queryClient } from "../../shared/api/queryClient";

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось создать проект";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось создать проект. Попробуйте еще раз.";
};

const CreateProjectPage = () => {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
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

  const createMutation = usePostWorkspaces({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: "teal",
          title: "Проект создан",
          message: "Можно приступать к работе.",
        });

        if (activeWorkspace?.id) {
          queryClient.removeQueries({
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] ===
                `/api/v1/workspaces/${activeWorkspace.id}/projects`,
          });
        }

        navigate(
          buildRoute(ROUTES.PROJECTS, {
            workspaceId: activeWorkspace?.id ?? "",
          }),
          { replace: true },
        );
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

  if (!activeWorkspace?.id) {
    return <Navigate to={ROUTES.WORKSPACE_CREATE} replace />;
  }

  const handleSubmit = form.onSubmit((values) => {
    createMutation.mutate({
      // id: activeWorkspace.id,
      data: {
        name: values.name.trim(),
        // address: values.address.trim() || undefined,
        // comment: values.comment.trim() || undefined,
      },
    });
  });

  return (
    <div className="auth-page">
      <Container size={520} my="xl">
        <Title order={2} ta="center" className="auth-title">
          Новый проект
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={6}>
          Заполните информацию о проекте.
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
              <Button type="submit" loading={createMutation.isPending}>
                Создать проект
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default CreateProjectPage;
