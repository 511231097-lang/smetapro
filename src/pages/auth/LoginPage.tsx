import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconLock,
  IconMail,
} from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePostAuthLogin } from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES } from '../../shared/constants/routes';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import {
  AuthFormWrapper,
  AuthPageLayout,
  authLayoutClasses as classes,
} from './shared/AuthLayout';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Неверный e-mail или пароль',
  USER_NOT_FOUND: 'Пользователь с таким e-mail не найден',
  USER_BLOCKED: 'Аккаунт заблокирован. Обратитесь в поддержку',
  TOO_MANY_REQUESTS:
    'Слишком много попыток. Подождите немного и попробуйте снова',
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof HttpClientError) {
    const data = error.data as { code?: string; error?: string } | undefined;
    if (data?.code && data.code in ERROR_MESSAGES) {
      return ERROR_MESSAGES[data.code];
    }
    return data?.error ?? 'Не удалось войти. Попробуйте ещё раз.';
  }
  if (error instanceof Error) return error.message;
  return 'Не удалось войти. Попробуйте ещё раз.';
};

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryColor } = usePrimaryColor();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? ROUTES.ROOT;
  const passwordChanged =
    (location.state as { passwordChanged?: boolean } | null)?.passwordChanged ??
    false;

  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (value.trim().length === 0) return 'Введите e-mail';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? null
          : 'Некорректный e-mail';
      },
      password: (value) =>
        value.trim().length === 0 ? 'Введите пароль' : null,
    },
  });

  const loginMutation = usePostAuthLogin({
    mutation: {
      onSuccess: () => {
        navigate(from, { replace: true });
      },
      onError: (error) => {
        setLoginError(getErrorMessage(error));
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setLoginError(null);
    loginMutation.mutate({
      data: {
        email: values.email.trim(),
        password: values.password,
      },
    });
  });

  return (
    <AuthFormWrapper>
      {passwordChanged && (
        <Alert color={primaryColor} icon={<IconCircleCheck size={16} />}>
          Пароль изменён. Войдите с новым паролем.
        </Alert>
      )}
      {loginError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setLoginError(null)}
        >
          {loginError}
        </Alert>
      )}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        noValidate
        className={classes.formCard}
        data-testid="login-form-card"
      >
        <Stack gap="lg">
          <Title order={3}>Вход в Сметчик ПРО</Title>

          <TextInput
            size="sm"
            label="E-mail"
            placeholder="ivan@example.ru"
            leftSection={<IconMail size={16} />}
            type="email"
            autoComplete="email"
            styles={{
              label: {
                marginBottom: 'var(--mantine-spacing-xxs)',
              },
              input: { paddingLeft: '36px' },
              section: {
                '--left-section-start': '5px',
              },
            }}
            {...form.getInputProps('email')}
          />

          <PasswordInput
            size="sm"
            label={
              <Group justify="space-between" w="100%">
                Пароль
                <Anchor
                  component={Link}
                  size="sm"
                  to={ROUTES.FORGOT_PASSWORD}
                  state={
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.values.email.trim())
                      ? { email: form.values.email.trim() }
                      : undefined
                  }
                >
                  Забыли пароль?
                </Anchor>
              </Group>
            }
            placeholder="********"
            leftSection={<IconLock size={16} />}
            styles={{
              section: {
                '--left-section-start': '5px',
                '--right-section-end': '5px',
              },
              label: {
                marginBottom: 'var(--mantine-spacing-xxs)',
                width: '100%',
              },
              innerInput: { paddingLeft: '36px' },
            }}
            autoComplete="current-password"
            {...form.getInputProps('password')}
          />

          <Button
            type="submit"
            loading={loginMutation.isPending}
            size="sm"
            fullWidth
          >
            Войти
          </Button>

          <Group gap={4} justify="center">
            <Text size="sm">Нет аккаунта?</Text>
            <Anchor component={Link} size="sm" to={ROUTES.REGISTER}>
              Зарегистрироваться
            </Anchor>
          </Group>
        </Stack>
      </Paper>
    </AuthFormWrapper>
  );
};

const LoginPage = () => {
  return (
    <AuthPageLayout layoutTestId="login-layout">
      <LoginForm />
    </AuthPageLayout>
  );
};

export default LoginPage;
