const { defineConfig } = require("vite");
const { createVuePlugin } = require("vite-plugin-vue2");
const path = require("path");

module.exports = defineConfig({
  plugins: [createVuePlugin({ jsx: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/package/index.js"),
      name: "ol-base-components",
      fileName: "index",
      formats: ["umd", "es"],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports: "auto",
    },
    rollupOptions: {
      external: ["vue", "element-ui", "swagger-client", "sortablejs"],
      output: {
        globals: {
          vue: "Vue",
          "element-ui": "ELEMENT",
          "swagger-client": "SwaggerClient",
          sortablejs: "Sortable",
        },
        exports: "named",
        inlineDynamicImports: true,
      },
    },
    minify: "terser",
  },
});
