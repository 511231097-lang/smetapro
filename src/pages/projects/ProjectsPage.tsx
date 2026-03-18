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
// import { useGetApiV1WorkspacesWorkspaceIdProjects } from "../../shared/api/generated/smetchik";
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

  // const { data, isLoading, isError } =
  //   useGetApiV1WorkspacesWorkspaceIdProjects(
  //     activeWorkspace?.id ?? "",
  //     params,
  //     {
  //       query: {
  //         enabled: !!activeWorkspace?.id,
  //       },
  //     },
  //   );

  // const projects = data?.projects ?? [];
  // const total = data?.total ?? projects.length;
  // const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // if (isLoading) {
  //   return (
  //     <Center h="60vh">
  //       <Loader />
  //     </Center>
  //   );
  // }

  // if (isError) {
  //   return (
  //     <Stack>
  //       <Title order={2}>Проекты</Title>
  //       <Text c="red">Не удалось загрузить проекты.</Text>
  //     </Stack>
  //   );
  // }

  return <div>Projects</div>;
};

export default ProjectsPage;
