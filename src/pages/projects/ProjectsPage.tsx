import { Box, Text, Title } from "@mantine/core";

export const ProjectsPage = () => {
  return (
    <Box p={20}>
      <Title order={2}>Проекты</Title>
      <Text c="dimmed" mt={6}>
        Информация о проектах появится здесь.
      </Text>
    </Box>
  );
};

export default ProjectsPage;
