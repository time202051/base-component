const { defineConfig } = require("@vue/cli-service");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    output: {
      // filename: "my-library.js", // 输出文件名
      library: "MyComponentLibrary", // 库名称
      libraryTarget: "umd", // 输出格式
      globalObject: "this", // 适应不同环境
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "my-component-library": path.resolve(__dirname, "src/package/index.js"), // 指向你的组件入口
      },
    },
  },
});
