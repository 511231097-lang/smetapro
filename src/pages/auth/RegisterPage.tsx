import {
  Alert,
  Anchor,
  Button,
  Group,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconChevronLeft,
  IconLock,
  IconMail,
  IconPhone,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import {
  usePostAuthRegister,
  usePostAuthRegisterVerify,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES } from '../../shared/constants/routes';
import {
  AuthFormWrapper,
  AuthPageLayout,
  authLayoutClasses as classes,
} from './shared/AuthLayout';

const RESEND_TIMEOUT = 60;

const ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: 'Пользователь с таким e-mail уже зарегистрирован',
  INVALID_PHONE: 'Неверный формат номера телефона',
  TOO_MANY_REQUESTS:
    'Слишком много попыток. Подождите немного и попробуйте снова',
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof HttpClientError) {
    const data = error.data as { code?: string; error?: string } | undefined;
    if (data?.code && data.code in ERROR_MESSAGES) {
      return ERROR_MESSAGES[data.code];
    }
    return data?.error ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const inputStyles = {
  label: { marginBottom: 'var(--mantine-spacing-xxs)' },
  input: { paddingLeft: '36px' },
  section: { '--left-section-start': '5px' },
};

const passwordInputStyles = {
  label: { marginBottom: 'var(--mantine-spacing-xxs)' },
  section: {
    '--left-section-start': '5px',
    '--right-section-end': '5px',
  },
  innerInput: { paddingLeft: '36px' },
};

const backLinkStyle = {
  display: 'inline-flex' as const,
  alignItems: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

// ── Шаг 1: Данные ────────────────────────────────────────────────────────────

interface RegisterData {
  phone: string;
  email: string;
  password: string;
}

interface FormStepProps {
  onSuccess: (data: RegisterData) => void;
}

const FormStep = ({ onSuccess }: FormStepProps) => {
  const form = useForm({
    initialValues: { phone: '', email: '', password: '' },
    validate: {
      phone: (v) => (v.trim().length === 0 ? 'Введите телефон' : null),
      email: (v) => {
        if (v.trim().length === 0) return 'Введите e-mail';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? null
          : 'Некорректный e-mail';
      },
      password: (v) => (v.length < 8 ? 'Минимум 8 символов' : null),
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const mutation = usePostAuthRegister({
    mutation: {
      onSuccess: (_, variables) =>
        onSuccess({
          phone: variables.data.phone,
          email: variables.data.email,
          password: variables.data.password,
        }),
      onError: (error) =>
        setFormError(getErrorMessage(error, 'Не удалось зарегистрироваться')),
    },
  });

  return (
    <AuthFormWrapper>
      {formError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setFormError(null)}
        >
          {formError}
        </Alert>
      )}
      <Paper
        component="form"
        onSubmit={form.onSubmit((v) => {
          setFormError(null);
          mutation.mutate({
            data: {
              phone: v.phone.trim(),
              email: v.email.trim(),
              password: v.password,
            },
          });
        })}
        noValidate
        className={classes.formCard}
      >
        <Stack gap="lg">
          <Title order={3}>Регистрация в&nbsp;Сметчик&nbsp;ПРО</Title>

          <TextInput
            size="sm"
            label="Телефон"
            placeholder="+7 (495) 000-00-00"
            leftSection={<IconPhone size={16} />}
            type="tel"
            autoComplete="tel"
            styles={inputStyles}
            {...form.getInputProps('phone')}
          />

          <TextInput
            size="sm"
            label="E-mail"
            placeholder="ivan@example.ru"
            leftSection={<IconMail size={16} />}
            type="email"
            autoComplete="email"
            styles={inputStyles}
            {...form.getInputProps('email')}
          />

          <PasswordInput
            size="sm"
            label="Пароль"
            placeholder="••••••••"
            leftSection={<IconLock size={16} />}
            autoComplete="new-password"
            styles={passwordInputStyles}
            {...form.getInputProps('password')}
          />

          <Button
            type="submit"
            loading={mutation.isPending}
            size="sm"
            fullWidth
          >
            Зарегистрироваться
          </Button>

          <Group gap={4} justify="center">
            <Text size="sm">Уже есть аккаунт?</Text>
            <Anchor component={Link} size="sm" to={ROUTES.LOGIN}>
              Войти
            </Anchor>
          </Group>

          <Text size="xs" ta="center" c="dimmed">
            Нажимая «Зарегистрироваться», вы соглашаетесь с&nbsp;
            <Anchor size="xs" href="#">
              Условиями&nbsp;использования
            </Anchor>{' '}
            и&nbsp;
            <Anchor size="xs" href="#">
              Политикой&nbsp;конфиденциальности
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </AuthFormWrapper>
  );
};

// ── Шаг 2: Подтверждение кода ────────────────────────────────────────────────

interface VerifyStepProps {
  email: string;
  onBack: () => void;
}

const VerifyStep = ({ email, onBack }: VerifyStepProps) => {
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();
  const [seconds, setSeconds] = useState(RESEND_TIMEOUT);
  const [pinValue, setPinValue] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const resendMutation = usePostAuthRegister();

  const verifyMutation = usePostAuthRegisterVerify({
    mutation: {
      onSuccess: () => {
        notifications.show({
          color: primaryColor,
          title: 'Регистрация завершена',
          message: 'Добро пожаловать в личный кабинет.',
        });
        navigate(ROUTES.ROOT, { replace: true });
      },
      onError: (error) => {
        setPinValue('');
        setVerifyError(getErrorMessage(error, 'Неверный или истёкший код'));
      },
    },
  });

  const handleComplete = (code: string) => {
    setVerifyError(null);
    verifyMutation.mutate({ data: { email, code } });
  };

  const handleResend = () => {
    resendMutation.mutate(
      { data: { email, phone: '', password: '' } },
      {
        onSuccess: () => {
          setSeconds(RESEND_TIMEOUT);
          setPinValue('');
          notifications.show({
            color: primaryColor,
            title: 'Код отправлен',
            message: `На адрес ${email} отправлен новый код.`,
          });
        },
        onError: (error) =>
          notifications.show({
            color: 'red',
            title: 'Ошибка',
            message: getErrorMessage(error, 'Не удалось отправить код'),
          }),
      },
    );
  };

  return (
    <AuthFormWrapper>
      {verifyError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setVerifyError(null)}
        >
          {verifyError}
        </Alert>
      )}
      <Paper className={classes.formCard}>
        <Stack gap="lg">
          <Anchor
            component="button"
            type="button"
            size="sm"
            c={primaryColor}
            style={backLinkStyle}
            onClick={onBack}
          >
            <IconChevronLeft size={16} />
            Вернуться назад
          </Anchor>

          <div>
            <Title order={3} mb={6}>
              Подтверждение e-mail
            </Title>
            <Text size="sm" c="dimmed">
              На ваш e-mail был отправлен код. Введите его для завершения
              регистрации.
            </Text>
          </div>

          <PinInput
            length={6}
            type="number"
            size="xl"
            value={pinValue}
            onChange={setPinValue}
            onComplete={handleComplete}
            disabled={verifyMutation.isPending}
            placeholder="○"
            oneTimeCode
          />

          {seconds > 0 ? (
            <Text size="sm" c="dimmed">
              Отправить код повторно. Осталось {seconds} секунд.
            </Text>
          ) : (
            <Anchor
              component="button"
              type="button"
              size="sm"
              style={backLinkStyle}
              onClick={handleResend}
              disabled={resendMutation.isPending}
            >
              Отправить код повторно
            </Anchor>
          )}
        </Stack>
      </Paper>
    </AuthFormWrapper>
  );
};

// ── Страница ─────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');

  const handleFormSuccess = (data: RegisterData) => {
    setEmail(data.email);
    setStep('verify');
  };

  return (
    <AuthPageLayout>
      {step === 'form' && <FormStep onSuccess={handleFormSuccess} />}
      {step === 'verify' && (
        <VerifyStep email={email} onBack={() => setStep('form')} />
      )}
    </AuthPageLayout>
  );
};

export default RegisterPage;
