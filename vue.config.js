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
  chainWebpack: config => {
    // webpack 不支持 Vite 的 `?raw` 语法，默认会把 `xxx.js?raw` 当普通 JS 编译，
    // 导致 import("echarts/dist/echarts.min.js?raw") 拿到的是模块对象而不是源码字符串，
    // HTML 报告内联 echarts 失败（页面一直显示"图表加载中…"）。
    // 这里补一条 asset/source 规则让它返回文件源码，并让 babel 跳过这类请求。
    config.module
      .rule("raw-source")
      .resourceQuery(/^\?raw/)
      .type("asset/source");
    config.module.rule("js").resourceQuery(/^(?!\?raw)/);
  },
});
