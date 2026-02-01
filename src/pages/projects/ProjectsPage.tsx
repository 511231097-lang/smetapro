import {
  Button,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../../providers/WorkspaceProvider";
import { useGetApiV1WorkspacesWorkspaceIdProjects } from "../../shared/api/generated/smetchik";
import { ROUTES } from "../../shared/constants/routes";

const PAGE_SIZE = 8;

const ProjectsPage = () => {
  const { activeWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [page],
  );

  useEffect(() => {
    setPage(1);
  }, [activeWorkspace?.id]);

  const { data, isLoading, isError } =
    useGetApiV1WorkspacesWorkspaceIdProjects(
      activeWorkspace?.id ?? "",
      params,
      {
        query: {
          enabled: !!activeWorkspace?.id,
        },
      },
    );

  const projects = data?.projects ?? [];
  const total = data?.total ?? projects.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Stack>
        <Title order={2}>Проекты</Title>
        <Text c="red">Не удалось загрузить проекты.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Проекты</Title>
          {activeWorkspace?.name && (
            <Text c="dimmed" mt={4}>
              {activeWorkspace.name}
            </Text>
          )}
        </div>
        <Button component={Link} to={ROUTES.PROJECT_CREATE}>
          Новый проект
        </Button>
      </Group>

      {projects.length === 0 ? (
        <Text c="dimmed">Проектов пока нет.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {projects.map((project, index) => (
            <Card
              key={project.id ?? `${project.name ?? "project"}-${index}`}
              withBorder
              radius="md"
              p="md"
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Text fw={600}>{project.name ?? "Без названия"}</Text>
                  {project.address && (
                    <Text size="sm" c="dimmed">
                      {project.address}
                    </Text>
                  )}
                </Stack>
                {project.id && (
                  <Button
                    component={Link}
                    to={ROUTES.PROJECT_EDIT.replace(
                      ":projectId",
                      project.id,
                    )}
                    variant="light"
                    size="xs"
                  >
                    Редактировать
                  </Button>
                )}
              </Group>
              {project.comment && (
                <Text size="sm" mt="sm">
                  {project.comment}
                </Text>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      {totalPages > 1 && (
        <Pagination value={page} onChange={setPage} total={totalPages} />
      )}
    </Stack>
  );
};

export default ProjectsPage;
