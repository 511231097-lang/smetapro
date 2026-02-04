import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./App.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthProvider from "./providers/AuthProvider";
import { queryClient } from "./shared/api/queryClient";

const fontFamily = '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif';

const theme = createTheme({
  primaryColor: "teal",
  fontFamily,
  headings: { fontFamily },
});

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <MantineProvider defaultColorScheme="light" theme={theme}>
        <Notifications position="top-right" />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </MantineProvider>
    </React.StrictMode>,
  );
}
