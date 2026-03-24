import { Box, Text, Title } from '@mantine/core';

export const FinancesPage = () => {
  return (
    <Box p={20}>
      <Title order={2}>Финансы</Title>
      <Text c="dimmed" mt={6}>
        Финансовая информация появится здесь.
      </Text>
    </Box>
  );
};

export default FinancesPage;
