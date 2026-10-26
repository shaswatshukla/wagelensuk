import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    coverage: {
      include: ["src/engine/**/*.ts"],
      exclude: ["src/engine/**/*.test.ts"],
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 100,
      },
    },
  },
});
