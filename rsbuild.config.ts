import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginBasicSsl } from "@rsbuild/plugin-basic-ssl";
import { pluginReact } from "@rsbuild/plugin-react";
import fs from "fs";

const { publicVars } = loadEnv({ prefixes: ["BASE_", "PUBLIC_"] });
const isTest = process.env.PW_TEST === "1";
const isDev = process.env.NODE_ENV === "development" && !isTest;

const user = process.env.BASE_USER ?? "";
const pass = process.env.BASE_PASS ?? "";
const basic = Buffer.from(`${user}:${pass}`).toString("base64");

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), ...(isDev ? [pluginBasicSsl()] : [])],
  html: {
    title: "Сметчик ПРО",
    favicon: "./public/favicon.ico",
    tags: [
      {
        tag: "link",
        attrs: {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
        head: true,
        append: true,
      },
      {
        tag: "link",
        attrs: {
          rel: "mask-icon",
          href: "/safari-pinned-tab.svg",
          color: "#12B886",
        },
        head: true,
        append: true,
      },
    ],
    appIcon: {
      name: "Сметчик ПРО",
      icons: [
        {
          src: "./src/assets/app-icons/apple-touch-icon.png",
          size: 180,
          target: "apple-touch-icon",
        },
        {
          src: "./src/assets/app-icons/icon-192.png",
          size: 192,
          target: "web-app-manifest",
        },
        {
          src: "./src/assets/app-icons/icon-512.png",
          size: 512,
          target: "web-app-manifest",
        },
      ],
    },
  },
  server: {
    host: "local.dev.smetchik.pro",
    port: 4000,
    https: {
      key: fs.readFileSync("./cert/cert.key"),
      cert: fs.readFileSync("./cert/cert.pem"),
    },
    cors: false,
    headers: { "Access-Control-Allow-Origin": "*" },
    printUrls: true,
    proxy: {
      "/api": {
        target: "https://dev.smetchik.pro",
        changeOrigin: true,
        headers: {
          Authorization: `Basic ${basic}`,
        },
        secure: true,
      },
    },
  },
  // server
  source: {
    define: publicVars,
  },
});
