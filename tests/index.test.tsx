import { MantineProvider } from '@mantine/core';
import { expect, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { PrimaryColorProvider } from '../src/providers/PrimaryColorProvider';

test('renders login page route', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

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
});
