import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: false },
  },
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
  vite: {
    plugins: [
      TanStackRouterVite(),
    ],
  },
});
