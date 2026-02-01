import {
  Button,
  Container,
  Anchor,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Link, useNavigate } from "react-router-dom";
import { usePostApiV1AuthLogin } from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES } from "../../shared/constants/routes";

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Неверный телефон или пароль";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось войти. Попробуйте еще раз.";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      phone: "",
      password: "",
    },
    validate: {
      phone: (value) => (value.trim().length === 0 ? "Введите телефон" : null),
      password: (value) =>
        value.trim().length === 0 ? "Введите пароль" : null,
    },
  });

  const loginMutation = usePostApiV1AuthLogin({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: "teal",
          title: "Успешный вход",
          message: "Добро пожаловать в личный кабинет.",
        });
        navigate(ROUTES.PROJECTS, { replace: true });
      },
      onError: (error) => {
        notifications.show({
          color: "red",
          title: "Ошибка входа",
          message: getErrorMessage(error),
        });
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    loginMutation.mutate({
      data: {
        phone: values.phone.trim(),
        password: values.password,
      },
    });
  });

  return (
    <div className="auth-page">
      <Container size={420} my="xl">
        <Title order={2} ta="center" className="auth-title">
          Вход в кабинет
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={6}>
          Используйте телефон и пароль для входа.
        </Text>

        <Paper withBorder shadow="md" p="lg" mt="lg" radius="md">
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                label="Телефон"
                placeholder="79001234567"
                type="tel"
                autoComplete="tel"
                {...form.getInputProps("phone")}
              />
              <PasswordInput
                label="Пароль"
                placeholder="••••••••"
                autoComplete="current-password"
                {...form.getInputProps("password")}
              />
              <Stack gap={6}>
                <Button type="submit" loading={loginMutation.isPending}>
                  Войти
                </Button>
                <Text size="sm" ta="center">
                  Нет аккаунта?{" "}
                  <Anchor component={Link} to={ROUTES.REGISTER}>
                    Зарегистрироваться
                  </Anchor>
                </Text>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default LoginPage;
