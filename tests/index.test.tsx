import { MantineProvider } from '@mantine/core';
import { expect, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { PrimaryColorProvider } from '../src/providers/PrimaryColorProvider';

test('renders login page route', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.includes('/api/v1/profile')) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      });
    }

    throw new Error(`Unexpected fetch in unit test: ${url} (${init?.method})`);
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  try {
    render(
      <MantineProvider>
        <PrimaryColorProvider>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/login']}>
              <App />
            </MemoryRouter>
          </QueryClientProvider>
        </PrimaryColorProvider>
      </MantineProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Вход в Сметчик ПРО' }),
    ).toBeInTheDocument();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
