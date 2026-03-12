import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://esfalsa.github.io",
  base: "/founding-rates",
  vite: {
    plugins: [tailwindcss()],
  },
});
