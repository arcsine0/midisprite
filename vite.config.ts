import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { localRenderPlugin } from "./src/features/export/viteRenderPlugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), localRenderPlugin()],
});
