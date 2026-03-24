import { useState } from 'react';
import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCube3dSphere } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  getGetWorkspacesQueryKey,
  getGetWorkspacesQueryOptions,
  usePostWorkspaces,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES, buildRoute } from '../../shared/constants/routes';
import { queryClient } from '../../shared/api/queryClient';
import type { WorkspacesListResponse } from '../../shared/api/generated/schemas';
import {
  AuthFormWrapper,
  AuthPageLayout,
  authLayoutClasses as classes,
} from '../auth/shared/AuthLayout';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';

const MAX_NAME = 60;

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? 'Не удалось создать пространство';
  }
  if (error instanceof Error) return error.message;
  return 'Не удалось создать пространство. Попробуйте еще раз.';
};

const CreateWorkspacePage = () => {
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Введите название' : null),
    },
  });

  const nameLength = form.values.name.length;

  const createMutation = usePostWorkspaces({
    mutation: {
      onSuccess: async (response) => {
        const createdWorkspace = response.workspace;
        if (createdWorkspace) {
          const queryKey = getGetWorkspacesQueryKey();
          const current = queryClient.getQueryData<
            WorkspacesListResponse | undefined
          >(queryKey);
          if (current?.workspaces?.length) {
            const nextWorkspaces = [
              createdWorkspace,
              ...current.workspaces.filter(
                (workspace) => workspace.id !== createdWorkspace.id,
              ),
            ];
            queryClient.setQueryData<WorkspacesListResponse | undefined>(
              queryKey,
              {
                workspaces: nextWorkspaces,
                total: Math.max(current.total ?? 0, nextWorkspaces.length),
                limit: current.limit ?? 50,
                offset: current.offset ?? 0,
              },
            );
          } else {
            try {
              const { queryFn } = getGetWorkspacesQueryOptions();
              const fetched = await queryClient.fetchQuery({
                queryKey,
                queryFn,
              });
              if (fetched) {
                const nextWorkspaces = [
                  createdWorkspace,
                  ...(fetched?.workspaces?.filter(
                    (workspace) => workspace.id !== createdWorkspace.id,
                  ) || []),
                ];
                queryClient.setQueryData<WorkspacesListResponse | undefined>(
                  queryKey,
                  {
                    ...fetched,
                    workspaces: nextWorkspaces,
                    total: Math.max(fetched.total ?? 0, nextWorkspaces.length),
                  },
                );
              }
            } catch {
              queryClient.removeQueries({ queryKey });
            }
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: getGetWorkspacesQueryKey(),
          });
        }

        navigate(
          buildRoute(ROUTES.PROJECTS, {
            workspaceId: createdWorkspace?.id ?? '',
          }),
          { replace: true },
        );
      },
      onError: (error) => {
        setCreateError(getErrorMessage(error));
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setCreateError(null);
    createMutation.mutate({ data: { name: values.name.trim() } });
  });

  return (
    <AuthPageLayout>
      <AuthFormWrapper>
        {createError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            withCloseButton
            onClose={() => setCreateError(null)}
          >
            {createError}
          </Alert>
        )}
        <Paper
          component="form"
          onSubmit={handleSubmit}
          noValidate
          className={classes.formCard}
          bg={
            colorScheme === 'dark'
              ? 'var(--mantine-color-dark-6)'
              : 'var(--mantine-color-white)'
          }
        >
          <Stack gap="lg">
            <IconCube3dSphere
              size={32}
              color={`var(--mantine-color-${primaryColor}-6)`}
              stroke={1.5}
            />

            <div>
              <Title order={3} mb={6}>
                Добро пожаловать!
                <br />
                Давайте создадим первое пространство
              </Title>
              <Text size="sm" c="dimmed">
                Пространство — это как виртуальный офис: здесь ты будешь вести
                проекты, работать со сметами и приглашать коллег.
              </Text>
            </div>

            <Stack gap={4}>
              <TextInput
                size="sm"
                placeholder="Например: РемГрупп или СтройСила"
                autoComplete="off"
                maxLength={MAX_NAME}
                styles={{
                  input: {
                    borderColor:
                      nameLength > 0
                        ? `var(--mantine-color-${primaryColor}-6)`
                        : undefined,
                  },
                }}
                {...form.getInputProps('name')}
              />
              <Text size="xs" c="dimmed" ta="right">
                {nameLength}/{MAX_NAME}
              </Text>
            </Stack>

            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={nameLength === 0}
              size="sm"
              fullWidth
            >
              Создать пространство
            </Button>
          </Stack>
        </Paper>
      </AuthFormWrapper>
    </AuthPageLayout>
  );
};

export default CreateWorkspacePage;
