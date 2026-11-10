import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// base "./" makes the build work at any GitHub Pages path
// (username.github.io/<repo>/ or a custom domain) without changes.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
})
