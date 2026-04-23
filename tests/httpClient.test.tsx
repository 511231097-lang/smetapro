import {
  afterEach,
  beforeEach,
  describe,
  expect,
  rstest,
  test,
} from '@rstest/core';
import {
  HttpClientError,
  httpClient,
  setAuthHandlers,
} from '../src/shared/api/httpClient';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });

const getUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const getFetchCalls = () =>
  (
    globalThis.fetch as unknown as {
      mock: { calls: Array<[RequestInfo | URL, RequestInit | undefined]> };
    }
  ).mock.calls;

describe('httpClient', () => {
  const originalFetch = globalThis.fetch;
  const originalBaseApiUrl = process.env.BASE_API_URL;

  beforeEach(() => {
    process.env.BASE_API_URL = 'https://api.example.com';
    setAuthHandlers({
      refresh: async () => {},
      logout: () => {},
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;

    if (originalBaseApiUrl === undefined) {
      delete process.env.BASE_API_URL;
    } else {
      process.env.BASE_API_URL = originalBaseApiUrl;
    }
  });

  test('throws when BASE_API_URL is not defined', async () => {
    delete process.env.BASE_API_URL;

    await expect(
      httpClient({
        url: '/api/v1/projects',
        method: 'GET',
      }),
    ).rejects.toThrow('BASE_API_URL is not defined');
  });

  test('builds url from params and ignores nullish values', async () => {
    globalThis.fetch = rstest.fn(async () => jsonResponse(200, { ok: true }));

    await httpClient({
      url: '/api/v1/projects',
      method: 'GET',
      params: {
        page: 2,
        tags: ['frontend', null, undefined, 'backend'],
        empty: undefined,
      },
    });

    const calls = getFetchCalls();
    const requestedUrl = new URL(getUrl(calls[0][0]));

    expect(requestedUrl.pathname).toBe('/api/v1/projects');
    expect(requestedUrl.searchParams.get('page')).toBe('2');
    expect(requestedUrl.searchParams.getAll('tags')).toEqual([
      'frontend',
      'backend',
    ]);
    expect(requestedUrl.searchParams.has('empty')).toBe(false);
  });

  test('serializes object body and sets JSON content type', async () => {
    globalThis.fetch = rstest.fn(async () => jsonResponse(200, { ok: true }));

    await httpClient({
      url: '/api/v1/projects',
      method: 'POST',
      data: { name: 'Project A' },
    });

    const calls = getFetchCalls();
    const requestInit = calls[0][1];
    const headers = new Headers(requestInit?.headers);

    expect(requestInit?.body).toBe('{"name":"Project A"}');
    expect(headers.get('content-type')).toBe('application/json');
  });

  test('keeps BodyInit as is and preserves provided headers', async () => {
    globalThis.fetch = rstest.fn(async () => jsonResponse(200, { ok: true }));

    const data = new URLSearchParams([['a', '1']]);

    await httpClient({
      url: '/api/v1/auth/login',
      method: 'POST',
      data,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    const calls = getFetchCalls();
    const requestInit = calls[0][1];
    const headers = new Headers(requestInit?.headers);

    expect(requestInit?.body).toBe(data);
    expect(headers.get('content-type')).toBe(
      'application/x-www-form-urlencoded',
    );
  });

  test('parses text responses', async () => {
    globalThis.fetch = rstest.fn(async () => {
      return new Response('plain-text-response', {
        status: 200,
        headers: {
          'content-type': 'text/plain',
        },
      });
    });

    const result = await httpClient<string>({
      url: '/api/v1/text',
      method: 'GET',
    });

    expect(result).toBe('plain-text-response');
  });

  test('parses binary responses', async () => {
    globalThis.fetch = rstest.fn(async () => {
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
        },
      });
    });

    const result = await httpClient<ArrayBuffer>({
      url: '/api/v1/file',
      method: 'GET',
    });

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(3);
  });

  test('returns undefined for 204 and zero content-length', async () => {
    globalThis.fetch = rstest
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 204,
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: {
            'content-length': '0',
          },
        }),
      );

    const noContent = await httpClient<undefined>({
      url: '/api/v1/empty-1',
      method: 'GET',
    });
    const zeroLength = await httpClient<undefined>({
      url: '/api/v1/empty-2',
      method: 'GET',
    });

    expect(noContent).toBeUndefined();
    expect(zeroLength).toBeUndefined();
  });

  test('throws HttpClientError with status and parsed data', async () => {
    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(400, { message: 'Bad request' }),
    );

    try {
      await httpClient({
        url: '/api/v1/projects',
        method: 'GET',
      });
      throw new Error('Expected error was not thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpClientError);
      const httpError = error as HttpClientError<{ message: string }>;
      expect(httpError.status).toBe(400);
      expect(httpError.data.message).toBe('Bad request');
    }
  });

  test('refreshes once and retries business request after 401', async () => {
    const refresh = rstest.fn(async () => {});
    const logout = rstest.fn();
    setAuthHandlers({ refresh, logout });

    globalThis.fetch = rstest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await httpClient<{ ok: boolean }>({
      url: '/api/v1/workspaces',
      method: 'GET',
    });

    expect(result.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(0);
    expect(getFetchCalls()).toHaveLength(2);
  });

  test('does not refresh when skipRefresh is true', async () => {
    const refresh = rstest.fn(async () => {});
    setAuthHandlers({ refresh, logout: () => {} });
    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(
      httpClient(
        {
          url: '/api/v1/workspaces',
          method: 'GET',
        },
        { skipRefresh: true },
      ),
    ).rejects.toBeInstanceOf(HttpClientError);

    expect(refresh).toHaveBeenCalledTimes(0);
    expect(getFetchCalls()).toHaveLength(1);
  });

  test('does not refresh auth endpoints', async () => {
    const refresh = rstest.fn(async () => {});
    setAuthHandlers({ refresh, logout: () => {} });
    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(
      httpClient({
        url: '/api/v1/auth/login',
        method: 'POST',
      }),
    ).rejects.toBeInstanceOf(HttpClientError);

    expect(refresh).toHaveBeenCalledTimes(0);
  });

  test('logs out when refresh fails for non-/profile endpoint', async () => {
    const refresh = rstest.fn(async () => {
      throw new Error('refresh failed');
    });
    const logout = rstest.fn();
    setAuthHandlers({ refresh, logout });

    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(
      httpClient({
        url: '/api/v1/workspaces',
        method: 'GET',
      }),
    ).rejects.toThrow('refresh failed');

    expect(logout).toHaveBeenCalledTimes(1);
  });
  test('does not logout when refresh fails for /profile', async () => {
    const refresh = rstest.fn(async () => {
      throw new Error('refresh failed');
    });
    const logout = rstest.fn();
    setAuthHandlers({ refresh, logout });

    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(
      httpClient({
        url: '/api/v1/profile',
        method: 'GET',
      }),
    ).rejects.toThrow('refresh failed');

    expect(logout).toHaveBeenCalledTimes(0);
  });

  test('does not logout when refresh fails for /profile', async () => {
    const refresh = rstest.fn(async () => {
      throw new Error('refresh failed');
    });
    const logout = rstest.fn();
    setAuthHandlers({ refresh, logout });

    globalThis.fetch = rstest.fn(async () =>
      jsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(
      httpClient({
        url: '/api/v1/profile',
        method: 'GET',
      }),
    ).rejects.toThrow('refresh failed');

    expect(logout).toHaveBeenCalledTimes(0);
  });

  test('uses single-flight refresh for concurrent 401 requests', async () => {
    let resolveRefresh: (() => void) | undefined;
    const refresh = rstest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    setAuthHandlers({ refresh, logout: () => {} });

    globalThis.fetch = rstest.fn(async (input: RequestInfo | URL) => {
      const callsCount = getFetchCalls().length;
      if (callsCount <= 2) {
        return jsonResponse(401, { message: 'Unauthorized' });
      }

      return jsonResponse(200, { url: getUrl(input) });
    });

    const requestA = httpClient<{ url: string }>({
      url: '/api/v1/workspaces',
      method: 'GET',
    });
    const requestB = httpClient<{ url: string }>({
      url: '/api/v1/projects',
      method: 'GET',
    });

    for (let attempt = 0; attempt < 10 && !resolveRefresh; attempt += 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    expect(resolveRefresh).toBeDefined();

    resolveRefresh?.();
    const [responseA, responseB] = await Promise.all([requestA, requestB]);

    expect(responseA.url).toContain('/api/v1/workspaces');
    expect(responseB.url).toContain('/api/v1/projects');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getFetchCalls()).toHaveLength(4);
  });
});
