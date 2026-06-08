import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { resolve } from "path";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tanstackStart({
      prerender: { enabled: false },
    }),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    viteReact(),
    nitro({ preset: "vercel" }),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
