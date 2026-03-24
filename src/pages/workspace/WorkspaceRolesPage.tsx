import { Center, Loader, Paper, Table, Text } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useGetWorkspacesWorkspaceIdRoles } from "../../shared/api/generated/smetchik";

const WorkspaceRolesPage = () => {
  const { workspaceId } = useParams();

  const { data, isLoading, isError } = useGetWorkspacesWorkspaceIdRoles(
    workspaceId ?? "",
    {
      query: {
        enabled: !!workspaceId,
      },
    },
  );

  if (isLoading) {
    return (
      <Center h="40vh">
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return <Text c="red">Не удалось загрузить роли.</Text>;
  }

  const roles = data?.roles ?? [];

  return (
    <Paper withBorder={false} shadow="none" radius="md" p={8}>
      <Table
        styles={{
          th: {
            fontWeight: 600,
            fontSize: 14,
            lineHeight: "20px",
            padding: 12,
          },
          td: { fontSize: 14, lineHeight: "20px", padding: 12 },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={260}>Роль</Table.Th>
            <Table.Th>Описание</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {roles.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text c="dimmed" size="sm">
                  Роли не найдены.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            roles.map((role) => (
              <Table.Tr key={role.id}>
                <Table.Td w={260}>{role.name ?? "—"}</Table.Td>
                <Table.Td>{role.description ?? "—"}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

export default WorkspaceRolesPage;
