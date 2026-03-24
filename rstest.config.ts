import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  testEnvironment: 'happy-dom',
  setupFiles: ['./tests/rstest.setup.ts'],
  coverage: {
    reportOnFailure: true,
    thresholds: {
      statements: 34,
      branches: 14,
      functions: 13,
      lines: 30,
    },
  },
});
