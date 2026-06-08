import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: false },
  },
  nitro: {
    preset: "vercel",
  },
  vite: {
    plugins: [
      TanStackRouterVite(),
    ],
  },
});
