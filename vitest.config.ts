import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // IndexedDB falso (Dexie) e crypto.randomUUID para os testes de repo e sync.
    setupFiles: ["./src/test/setup.ts"],
  },
});
