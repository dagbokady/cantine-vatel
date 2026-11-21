import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Écoute sur toutes les interfaces : accessible depuis un téléphone du même Wi-Fi.
  server: { host: true },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
});
