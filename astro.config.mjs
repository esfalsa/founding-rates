import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
// import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://esfalsa.github.io",

  // integrations: [tailwind({ applyBaseStyles: false })],
  base: "/founding-rates",

  vite: {
    plugins: [tailwindcss()],
  },
});