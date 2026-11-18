import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  // Workspace packages ship TypeScript source, and their dependencies are not
  // declared here, so bundle everything. Native add-ons added later (if any)
  // should be listed in `external` and in this package's dependencies.
  noExternal: [/.*/],
  // Bundled CommonJS dependencies (pino) call require() on Node built-ins.
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
});
