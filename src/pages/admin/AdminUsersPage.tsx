import {
  Anchor,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetApiV1AdminUsers } from '../../shared/api/generated/smetchik';
import { ROUTES } from '../../shared/constants/routes';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE = 300;

const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch, page],
  );

  const { data, isLoading, isError, isFetching } =
    useGetApiV1AdminUsers(params);
  const users = data?.users ?? [];
  const total = data?.total ?? users.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Пользователи</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Управление пользователями системы.
          </Text>
        </div>
      </Group>

      <TextInput
        placeholder="Поиск по телефону, имени или фамилии"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      {isFetching && data && (
        <Text size="sm" c="dimmed">
          Обновляем список…
        </Text>
      )}

      {isLoading && !data ? (
        <Center h="40vh">
          <Loader />
        </Center>
      ) : isError ? (
        <Text c="red">Не удалось загрузить пользователей.</Text>
      ) : users.length === 0 ? (
        <Text c="dimmed">Пользователи не найдены.</Text>
      ) : (
        <Table withTableBorder striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Телефон</Table.Th>
              <Table.Th>Имя</Table.Th>
              <Table.Th>Фамилия</Table.Th>
              <Table.Th>Email</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id ?? user.phone}>
                <Table.Td>
                  {user.id ? (
                    <Anchor
                      component={Link}
                      to={ROUTES.ADMIN_USER.replace(':userId', user.id)}
                    >
                      {user.phone ?? '—'}
                    </Anchor>
                  ) : (
                    (user.phone ?? '—')
                  )}
                </Table.Td>
                <Table.Td>{user.name ?? '—'}</Table.Td>
                <Table.Td>{user.surname ?? '—'}</Table.Td>
                <Table.Td>{user.email ?? '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {totalPages > 1 && (
        <Pagination value={page} onChange={setPage} total={totalPages} />
      )}
    </Stack>
  );
};

export default AdminUsersPage;
