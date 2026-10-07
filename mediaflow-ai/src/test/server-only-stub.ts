export {};
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path("./src"),
      "server-only": path("./src/test/server-only-stub.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});