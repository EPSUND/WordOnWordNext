import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Projektsajt på https://epsund.github.io/WordOnWordNext/ → base måste matcha repo-namnet.
export default defineConfig({
  base: "/WordOnWordNext/",
  plugins: [react()],
});
