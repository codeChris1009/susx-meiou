import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Fonts always ship as files: Vite inlines small assets as data: URIs, which the CSP (public/_headers) rightly
    // blocks under font-src 'self'. Other small assets keep the default inlining.
    assetsInlineLimit: (file) =>
      /\.(woff2?|ttf|otf)$/.test(file) ? false : undefined,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
