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
    rolldownOptions: {
      output: {
        // three.js in a chunk of its own: it changes only on upgrade, so a change to the gallery scene re-downloads a
        // few kB of scene code, not the whole engine. Both load only when the gallery nears the viewport.
        codeSplitting: {
          groups: [{ name: "three", test: /node_modules[\\/]three[\\/]/ }],
        },
      },
    },
    // The three chunk is ~550 kB minified (~140 kB gzip) by itself and lazy; the entry bundle stays well under this
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
