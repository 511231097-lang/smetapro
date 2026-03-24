import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const { publicVars } = loadEnv({ prefixes: ['BASE_', 'PUBLIC_'] });

const user = process.env.BASE_USER ?? '';
const pass = process.env.BASE_PASS ?? '';
const basic = Buffer.from(`${user}:${pass}`).toString('base64');

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), pluginSvgr()],
  html: {
    title: 'Сметчик ПРО',
    favicon: './public/favicon.ico',
    tags: [
      {
        tag: 'link',
        attrs: {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        head: true,
        append: true,
      },
      {
        tag: 'link',
        attrs: {
          rel: 'mask-icon',
          href: '/safari-pinned-tab.svg',
          color: '#12B886',
        },
        head: true,
        append: true,
      },
    ],
    appIcon: {
      name: 'Сметчик ПРО',
      icons: [
        {
          src: './src/assets/app-icons/apple-touch-icon.png',
          size: 180,
          target: 'apple-touch-icon',
        },
        {
          src: './src/assets/app-icons/icon-192.png',
          size: 192,
          target: 'web-app-manifest',
        },
        {
          src: './src/assets/app-icons/icon-512.png',
          size: 512,
          target: 'web-app-manifest',
        },
      ],
    },
  },
  server: {
    host: 'localhost',
    port: 4000,
    cors: false,
    headers: { 'Access-Control-Allow-Origin': '*' },
    printUrls: true,
    proxy: {
      '/api': {
        target: 'https://dev.smetchik.pro',
        changeOrigin: true,
        cookieDomainRewrite: { '*': '' },
        headers: {
          Authorization: `Basic ${basic}`,
          Origin: 'https://local.dev.smetchik.pro:4000',
        },
        secure: true,
        on: {
          proxyRes: (proxyRes: {
            headers: Record<string, string | undefined>;
          }) => {
            if (proxyRes.headers['access-control-allow-origin']) {
              proxyRes.headers['access-control-allow-origin'] =
                'http://localhost:4000';
            }
          },
        },
      },
    },
  },
  // server
  source: {
    define: publicVars,
  },
});
