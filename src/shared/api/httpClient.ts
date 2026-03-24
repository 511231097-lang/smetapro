// httpClient.ts

type RefreshFn = () => Promise<void>;
type LogoutFn = () => void;

type QueryParams = Record<string, unknown> | undefined;

let refreshInFlight: Promise<void> | null = null;
let refreshFn: RefreshFn | null = null;
let logoutFn: LogoutFn | null = null;

export const setAuthHandlers = (handlers: {
  refresh: RefreshFn;
  logout: LogoutFn;
}) => {
  refreshFn = handlers.refresh;
  logoutFn = handlers.logout;
};

const isAuthEndpoint = (url: string) => {
  // важно: чтобы refresh запрос НЕ пытался сам себя рефрешить
  return (
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/register') ||
    url.includes('/api/v1/auth/logout') ||
    url.includes('/api/v1/auth/logout-all')
  );
};

const runSingleFlightRefresh = async () => {
  if (!refreshFn) {
    throw new Error('refresh handler is not set (setAuthHandlers).');
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        await refreshFn!();
      } finally {
        // важно: сбросить, даже если refresh упал
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
};

const readEnvBaseUrl = () => {
  console.log(import.meta.env.BASE_API_URL);
  if (
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env === 'object'
  ) {
    return import.meta.env.BASE_API_URL;
  }

  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    return process.env.BASE_API_URL;
  }

  return undefined;
};

const resolveBaseUrl = (baseUrl?: string) => {
  const resolved = baseUrl ?? readEnvBaseUrl();

  if (!resolved) {
    throw new Error(
      'BASE_API_URL is not defined. Please set it in your env file.',
    );
  }

  return resolved;
};

const buildUrl = (url: string, baseUrl?: string, params?: QueryParams) => {
  const target = new URL(url, resolveBaseUrl(baseUrl));
  if (!params) {
    return target.toString();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === undefined || entry === null) {
          return;
        }
        target.searchParams.append(key, String(entry));
      });
      return;
    }

    target.searchParams.set(key, String(value));
  });

  return target.toString();
};

const isBodyInit = (value: unknown): value is BodyInit => {
  if (value === undefined || value === null) {
    return false;
  }

  if (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams
  ) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return true;
    }
  }

  return value instanceof ReadableStream;
};

const parseBody = async (response: Response) => {
  if (response.status === 204) {
    return undefined;
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return undefined;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  if (contentType?.includes('text/')) {
    return response.text();
  }

  return response.arrayBuffer();
};

export class HttpClientError<TData = unknown> extends Error {
  readonly status: number;

  readonly data: TData;

  constructor(response: Response, data: TData) {
    super(`Request failed with status ${response.status}`);
    this.name = 'HttpClientError';
    this.status = response.status;
    this.data = data;
  }
}

export type HttpClientConfig<TBody> = {
  url: string;
  method: string;
  baseUrl?: string;
  params?: QueryParams;
  data?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type HttpClientOptions = {
  skipRefresh?: boolean;
};

// Вынесем "сырой" fetch, чтобы можно было повторять
const rawRequest = async <TResponse, TBody = unknown>(
  config: HttpClientConfig<TBody>,
): Promise<TResponse> => {
  const { url, method, baseUrl, params, data, headers, signal } = config;
  const requestUrl = buildUrl(url, baseUrl, params);

  const requestHeaders = new Headers(headers);
  const init: RequestInit = {
    method,
    signal,
    credentials: 'include',
    headers: requestHeaders,
  };

  if (data !== undefined && data !== null) {
    if (isBodyInit(data)) {
      init.body = data;
    } else {
      init.body = JSON.stringify(data);
      if (!requestHeaders.has('content-type')) {
        requestHeaders.set('content-type', 'application/json');
      }
    }
  }

  const response = await fetch(requestUrl, init);
  const parsed = await parseBody(response);

  if (!response.ok) {
    throw new HttpClientError(response, parsed);
  }

  return parsed as TResponse;
};

export const httpClient = async <TResponse, TBody = unknown>(
  config: HttpClientConfig<TBody>,
  options?: HttpClientOptions,
): Promise<TResponse> => {
  try {
    return await rawRequest<TResponse, TBody>(config);
  } catch (error) {
    // нас интересует только 401 от бизнес-ручек
    if (
      error instanceof HttpClientError &&
      error.status === 401 &&
      !options?.skipRefresh &&
      !isAuthEndpoint(config.url)
    ) {
      // 1) запускаем/ждем refresh (single-flight)
      try {
        await runSingleFlightRefresh();
      } catch (refreshError) {
        // 2) если refresh не удался — logout (кроме проверки /me), иначе пробрасываем ошибку
        if (!config.url.includes('/api/v1/auth/me')) {
          logoutFn?.();
        }
        throw refreshError;
      }

      // 3) refresh ок — повторяем исходный запрос ОДИН раз
      return await rawRequest<TResponse, TBody>(config);
    }

    throw error;
  }
};
