import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Separa as dependências pesadas em chunks próprios para melhorar
        // cache de longo prazo e reduzir o bundle inicial. pdf/forge/
        // html2canvas só são baixados sob demanda (dynamic import nos
        // pontos de uso: geração de PDF e assinatura digital).
        manualChunks(id) {
          // Helper de preload do Vite + micro-utils de className são usados
          // tanto pelo load inicial quanto por libs pesadas (recharts/jspdf).
          // Fixá-los no chunk eager (vendor-react) evita que o entry crie um
          // import estático para vendor-pdf/vendor-charts (o que dispararia
          // modulepreload do bundle pesado já no boot).
          if (id.includes("vite/preload-helper")) return "vendor-react";
          if (
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/class-variance-authority")
          )
            return "vendor-react";
          if (!id.includes("node_modules")) return undefined;
          // Pacotes-folha pesados, carregados sob demanda (dynamic import nos
          // pontos de uso), ganham chunk próprio para sair do load inicial.
          if (id.includes("node-forge")) return "vendor-forge";
          if (
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("canvg") ||
            id.includes("dompurify")
          )
            return "vendor-pdf";
          if (id.includes("recharts") || id.includes("/d3-"))
            return "vendor-charts";
          // Vendors compartilhados do load inicial, separados para cache
          // estável entre deploys.
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("date-fns") || id.includes("react-day-picker"))
            return "vendor-date";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/scheduler/") ||
            id.includes("@tanstack")
          )
            return "vendor-react";
          return undefined;
        },
      },
    },
  },
});
