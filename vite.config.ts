import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Polyfills para compatibilidad con draft-js
      stream: "stream-browserify",
      util: "util",
      zlib: "browserify-zlib",
      assert: "assert",
    },
  },
  define: {
    // Soluciona el problema "global is not defined"
    global: "window",
    "process.env": process.env,
    // Polyfill para Buffer
    "process.env.BUILD_ENV": JSON.stringify(
      process.env.BUILD_ENV || "development"
    ),
  },
  optimizeDeps: {
    // Incluye las dependencias necesarias para draft-js
    include: [
      "react-draft-wysiwyg",
      "draft-js",
      "draftjs-to-html",
      "html-to-draftjs",
      "stream-browserify",
      "util",
    ],
    esbuildOptions: {
      // Define global para esbuild
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // Incluye paquetes que necesitan transformación CommonJS
      include: [/node_modules/, /react-draft-wysiwyg/, /draft-js/],
    },
    rollupOptions: {
      plugins: [
        // Soluciona problemas con paquetes que usan process
        {
          name: "replace-process-env",
          transform(code) {
            return code.replace(/process\.env/g, "{}");
          },
        },
      ],
    },
  },
}));
