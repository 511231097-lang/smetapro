import {
  Alert,
  Anchor,
  Button,
  Flex,
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
import {
  IconAlertCircle,
  IconChevronLeft,
  IconLock,
  IconMail,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';
import {
  usePostAuthForgotPassword,
  usePostAuthResetPassword,
} from '../../shared/api/generated/smetchik';
import { HttpClientError } from '../../shared/api/httpClient';
import { ROUTES } from '../../shared/constants/routes';
import {
  AuthFormWrapper,
  AuthPageLayout,
  authLayoutClasses as classes,
} from './shared/AuthLayout';

type Step = 'email' | 'code' | 'password';

const RESEND_TIMEOUT = 60;

const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'Пользователь с таким e-mail не найден',
  CODE_INVALID: 'Код неверный или устарел. Запросите новый код',
  CODE_EXPIRED: 'Код устарел. Запросите новый код',
  TOO_MANY_REQUESTS:
    'Слишком много попыток. Подождите немного и попробуйте снова',
};

const CODE_INVALID_CODES = new Set(['CODE_INVALID', 'CODE_EXPIRED']);

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

const isCodeInvalidError = (error: unknown): boolean => {
  if (error instanceof HttpClientError) {
    const data = error.data as { code?: string } | undefined;
    return !!data?.code && CODE_INVALID_CODES.has(data.code);
  }
  return false;
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

// ── Шаг 1: Email ─────────────────────────────────────────────────────────────

interface EmailStepProps {
  initialEmail: string;
  onSuccess: (email: string) => void;
  externalError?: string | null;
  onExternalErrorClose?: () => void;
}

const EmailStep = ({
  initialEmail,
  onSuccess,
  externalError,
  onExternalErrorClose,
}: EmailStepProps) => {
  const { primaryColor } = usePrimaryColor();
  const form = useForm({
    initialValues: { email: initialEmail },
    validate: {
      email: (v) =>
        v.trim().length === 0
          ? 'Введите e-mail'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
            ? null
            : 'Некорректный e-mail',
    },
  });

  const [emailError, setEmailError] = useState<string | null>(null);
  const mutation = usePostAuthForgotPassword({
    mutation: {
      onSuccess: () => onSuccess(form.values.email.trim()),
      onError: (error) =>
        setEmailError(getErrorMessage(error, 'Не удалось отправить код')),
    },
  });

  return (
    <AuthFormWrapper>
      {externalError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={onExternalErrorClose}
        >
          {externalError}
        </Alert>
      )}
      {emailError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setEmailError(null)}
        >
          {emailError}
        </Alert>
      )}
      <Paper
        component="form"
        onSubmit={form.onSubmit((v) => {
          setEmailError(null);
          mutation.mutate({ data: { email: v.email.trim() } });
        })}
        noValidate
        className={classes.formCard}
      >
        <Stack gap="lg">
          <Anchor
            component={Link}
            to={ROUTES.LOGIN}
            size="sm"
            c={primaryColor}
            style={backLinkStyle}
          >
            <IconChevronLeft size={16} />
            Вернуться назад
          </Anchor>

          <div>
            <Title order={3} mb={6}>
              Восстановление пароля
            </Title>
            <Text size="sm" c="dimmed">
              Введите e-mail, указанный при регистрации. Мы отправим на него
              верификационный код.
            </Text>
          </div>

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

          <Button
            type="submit"
            loading={mutation.isPending}
            size="sm"
            fullWidth
          >
            Отправить код
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

// ── Шаг 2: Код из письма ──────────────────────────────────────────────────────

interface CodeStepProps {
  email: string;
  onSuccess: (code: string) => void;
  onBack: () => void;
}

const CodeStep = ({ email, onSuccess, onBack }: CodeStepProps) => {
  const { primaryColor } = usePrimaryColor();
  const [seconds, setSeconds] = useState(RESEND_TIMEOUT);
  const [pinValue, setPinValue] = useState('');
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const resendMutation = usePostAuthForgotPassword();

  const handleResend = () => {
    resendMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setSeconds(RESEND_TIMEOUT);
          setPinValue('');
          setResendError(null);
          setResendSuccess(`На адрес ${email} отправлен новый код.`);
        },
        onError: (error) => {
          setResendSuccess(null);
          setResendError(getErrorMessage(error, 'Не удалось отправить код'));
        },
      },
    );
  };

  return (
    <AuthFormWrapper>
      {resendError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setResendError(null)}
        >
          {resendError}
        </Alert>
      )}
      {resendSuccess && (
        <Alert
          color={primaryColor}
          withCloseButton
          onClose={() => setResendSuccess(null)}
        >
          {resendSuccess}
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
              Восстановление пароля
            </Title>
            <Text size="sm" c="dimmed">
              На ваш e-mail был отправлен код. Введите его для восстановления
              пароля.
            </Text>
          </div>

          <Flex align="center" justify="center">
            <PinInput
              length={6}
              type="number"
              size="xl"
              value={pinValue}
              onChange={setPinValue}
              onComplete={onSuccess}
              placeholder="○"
              oneTimeCode
            />
          </Flex>

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

// ── Шаг 3: Новый пароль ───────────────────────────────────────────────────────

interface PasswordStepProps {
  email: string;
  code: string;
  onBack: () => void;
  onCodeInvalid: () => void;
}

const PasswordStep = ({
  email,
  code,
  onBack,
  onCodeInvalid,
}: PasswordStepProps) => {
  const navigate = useNavigate();
  const { primaryColor } = usePrimaryColor();

  const form = useForm({
    initialValues: { password: '' },
    validate: {
      password: (v) =>
        v.length === 0
          ? 'Введите пароль'
          : v.length < 8
            ? 'Минимум 8 символов'
            : null,
    },
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const mutation = usePostAuthResetPassword({
    request: { skipRefresh: true },
    mutation: {
      onSuccess: () =>
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: { passwordChanged: true },
        }),
      onError: (error) => {
        if (isCodeInvalidError(error)) {
          onCodeInvalid();
        } else {
          setPasswordError(
            getErrorMessage(error, 'Не удалось изменить пароль'),
          );
        }
      },
    },
  });

  return (
    <AuthFormWrapper>
      {passwordError && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={() => setPasswordError(null)}
        >
          {passwordError}
        </Alert>
      )}
      <Paper
        component="form"
        onSubmit={form.onSubmit((v) => {
          setPasswordError(null);
          mutation.mutate({ data: { email, code, new_password: v.password } });
        })}
        noValidate
        className={classes.formCard}
      >
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
              Восстановление пароля
            </Title>
            <Text size="sm" c="dimmed">
              Укажите новый пароль
            </Text>
          </div>

          <PasswordInput
            size="sm"
            label="Новый пароль"
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
            Изменить пароль
          </Button>
        </Stack>
      </Paper>{' '}
    </AuthFormWrapper>
  );
};

// ── Страница ──────────────────────────────────────────────────────────────────

const ForgotPasswordPage = () => {
  const location = useLocation();
  const prefillEmail =
    (location.state as { email?: string } | null)?.email ?? '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState('');
  const [codeInvalidMessage, setCodeInvalidMessage] = useState<string | null>(
    null,
  );

  const handleEmailSuccess = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setCodeInvalidMessage(null);
    setStep('code');
  };

  const handleCodeInvalid = () => {
    setCode('');
    setCodeInvalidMessage(ERROR_MESSAGES.CODE_INVALID);
    setStep('email');
  };

  const handleCodeSuccess = (enteredCode: string) => {
    setCode(enteredCode);
    setStep('password');
  };

  return (
    <AuthPageLayout>
      {step === 'email' && (
        <EmailStep
          initialEmail={email}
          onSuccess={handleEmailSuccess}
          externalError={codeInvalidMessage}
          onExternalErrorClose={() => setCodeInvalidMessage(null)}
        />
      )}
      {step === 'code' && (
        <CodeStep
          email={email}
          onSuccess={handleCodeSuccess}
          onBack={() => setStep('email')}
        />
      )}
      {step === 'password' && (
        <PasswordStep
          email={email}
          code={code}
          onBack={() => setStep('code')}
          onCodeInvalid={handleCodeInvalid}
        />
      )}
    </AuthPageLayout>
  );
};

export default ForgotPasswordPage;
