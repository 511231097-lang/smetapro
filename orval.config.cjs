const path = require("node:path");
const { defineConfig } = require("orval");

const resolveFromRoot = (...segments) => path.resolve(__dirname, ...segments);

module.exports = defineConfig({
  smetchik: {
    input: resolveFromRoot("schema.yaml"),
    output: {
      baseUrl: "/api/v1",
      target: resolveFromRoot("src/shared/api/generated/smetchik.ts"),
      schemas: resolveFromRoot("src/shared/api/generated/schemas"),
      client: "react-query",
      mode: "split",
      clean: true,
      prettier: true,
      index: true,
      override: {
        mutator: {
          path: resolveFromRoot("src/shared/api/httpClient.ts"),
          name: "httpClient",
        },
      },
    },
  },
});
