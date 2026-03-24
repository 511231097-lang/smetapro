import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './App.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AuthProvider from './providers/AuthProvider';
import {
  PrimaryColorProvider,
  usePrimaryColor,
} from './providers/PrimaryColorProvider';
import { queryClient } from './shared/api/queryClient';
import { createAppTheme, cssVariablesResolver } from './theme';

const ThemedApp = () => {
  const { primaryColor } = usePrimaryColor();
  const mergedTheme = useMemo(() => createAppTheme(primaryColor), [primaryColor]);

  return (
    <MantineProvider
      defaultColorScheme="auto"
      theme={mergedTheme}
      cssVariablesResolver={cssVariablesResolver}
    >
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <PrimaryColorProvider>
        <ThemedApp />
      </PrimaryColorProvider>
    </React.StrictMode>,
  );
}
