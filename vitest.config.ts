import { defineConfig } from "vitest/config";

// Sviten testar ren logik (motor, reducer, lib) – ingen DOM behövs, alltså node-miljö.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
