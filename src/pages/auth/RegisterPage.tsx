import {
  Anchor,
  Button,
  Container,
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
import { usePostApiV1AuthRegister } from "../../shared/api/generated/smetchik";
import { HttpClientError } from "../../shared/api/httpClient";
import { ROUTES } from "../../shared/constants/routes";

const getErrorMessage = (error: unknown) => {
  if (error instanceof HttpClientError) {
    const data = error.data as { error?: string } | undefined;
    return data?.error ?? "Не удалось зарегистрироваться";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось зарегистрироваться. Попробуйте еще раз.";
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      phone: "",
      password: "",
      name: "",
      surname: "",
      email: "",
    },
    validate: {
      phone: (value) => (value.trim().length === 0 ? "Введите телефон" : null),
      password: (value) =>
        value.trim().length === 0 ? "Введите пароль" : null,
      name: (value) => (value.trim().length === 0 ? "Введите имя" : null),
      email: (value) => {
        if (value.trim().length === 0) {
          return null;
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? null
          : "Некорректный email";
      },
    },
  });

  const registerMutation = usePostApiV1AuthRegister({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: "teal",
          title: "Регистрация успешна",
          message: "Добро пожаловать в личный кабинет.",
        });
        navigate(ROUTES.PROJECTS, { replace: true });
      },
      onError: (error) => {
        notifications.show({
          color: "red",
          title: "Ошибка регистрации",
          message: getErrorMessage(error),
        });
      },
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    registerMutation.mutate({
      data: {
        phone: values.phone.trim(),
        password: values.password,
        name: values.name.trim(),
        surname: values.surname.trim() || undefined,
        email: values.email.trim() || undefined,
      },
    });
  });

  return (
    <div className="auth-page">
      <Container size={460} my="xl">
        <Title order={2} ta="center" className="auth-title">
          Регистрация
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={6}>
          Заполните данные, чтобы создать аккаунт.
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
              <TextInput
                label="Имя"
                placeholder="Иван"
                autoComplete="given-name"
                {...form.getInputProps("name")}
              />
              <TextInput
                label="Фамилия"
                placeholder="Петров"
                autoComplete="family-name"
                {...form.getInputProps("surname")}
              />
              <TextInput
                label="Email"
                placeholder="ivan@example.com"
                type="email"
                autoComplete="email"
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Пароль"
                placeholder="••••••••"
                autoComplete="new-password"
                {...form.getInputProps("password")}
              />
              <Stack gap={6}>
                <Button type="submit" loading={registerMutation.isPending}>
                  Зарегистрироваться
                </Button>
                <Text size="sm" ta="center">
                  Уже есть аккаунт?{" "}
                  <Anchor component={Link} to={ROUTES.LOGIN}>
                    Войти
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

export default RegisterPage;
