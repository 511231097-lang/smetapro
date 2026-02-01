import { Text, Title } from '@mantine/core';

const DashboardHomePage = () => {
  return (
    <>
      <Title order={2}>Главная</Title>
      <Text c='dimmed' mt={6}>
        Контент личного кабинета появится здесь.
      </Text>
    </>
  );
};

export default DashboardHomePage;
