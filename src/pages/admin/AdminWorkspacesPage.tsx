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
import { useGetApiV1AdminWorkspaces } from '../../shared/api/generated/smetchik';
import { ROUTES } from '../../shared/constants/routes';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE = 300;

const AdminWorkspacesPage = () => {
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
    useGetApiV1AdminWorkspaces(params);
  const workspaces = data?.workspaces ?? [];
  const total = data?.total ?? workspaces.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Пространства</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Управление пространствами системы.
          </Text>
        </div>
      </Group>

      <TextInput
        placeholder="Поиск по названию"
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
        <Text c="red">Не удалось загрузить пространства.</Text>
      ) : workspaces.length === 0 ? (
        <Text c="dimmed">Пространства не найдены.</Text>
      ) : (
        <Table withTableBorder striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Создатель</Table.Th>
              <Table.Th>Создано</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workspaces.map((workspace) => (
              <Table.Tr key={workspace.id ?? workspace.name}>
                <Table.Td>
                  {workspace.id ? (
                    <Anchor
                      component={Link}
                      to={ROUTES.ADMIN_WORKSPACE.replace(
                        ':workspaceId',
                        workspace.id,
                      )}
                    >
                      {workspace.name ?? '—'}
                    </Anchor>
                  ) : (
                    (workspace.name ?? '—')
                  )}
                </Table.Td>
                <Table.Td>{workspace.created_by ?? '—'}</Table.Td>
                <Table.Td>{workspace.created_at ?? '—'}</Table.Td>
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

export default AdminWorkspacesPage;
