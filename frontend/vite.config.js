import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Génère /sw.js au build : version unique et liste des fichiers de la coquille à précharger.
function serviceWorker() {
  return {
    name: "cantine-vatel-sw",
    apply: "build",
    generateBundle(_, bundle) {
      const fichiers = Object.keys(bundle).filter((f) => !f.endsWith(".map"));
      const statiques = ["/manifest.webmanifest", "/logo.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];
      const precache = ["/index.html", ...fichiers.filter((f) => f !== "index.html").map((f) => `/${f}`), ...statiques];
      const source = readFileSync(new URL("./pwa/sw.js", import.meta.url), "utf8")
        .replace("__VERSION__", Date.now().toString(36))
        .replace("__PRECACHE__", JSON.stringify([...new Set(precache)]));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  // Écoute sur toutes les interfaces : accessible depuis un téléphone du même Wi-Fi.
  server: { host: true },
  preview: { host: true },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
});
