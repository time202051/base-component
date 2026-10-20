import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
import OlCom, { swaggerInstall, Hiprint } from "@/package/index.js";
Vue.use(ElementUI);
Vue.use(Hiprint);

Vue.use(OlCom, {
  method: "post",
  smartPrintBtn: true,
  // AI 数据库查询助手配置（<ol-agent-chat/>）：数据库/模型由页面下发
  agentChat: {
    // 每台用户电脑本机跑 agent 时，指向本机（不要用 location.hostname）
    agentBaseUrl: "http://127.0.0.1:52310",
    // 用户电脑未安装服务时，组件顶部「下载本地查询服务」按钮指向的安装包地址
    downloadUrl: "/download/agent-local.zip",
    db: {
      server: "220.179.227.4,60001",
      database: "WebWMS_CS",
      user: "sa",
      password: "oulide@123",
    },
    llm: { provider: "", baseUrl: "", model: "" },
    // 报告生成步骤较多（多次查询 + 生成 HTML），放宽 agent 的最大循环次数
    limits: { recursionLimit: 80 },
  },
});
swaggerInstall("http://220.179.249.140:20025/swagger/v1/swagger.json").then(() => {});
new Vue({
  render: h => h(App),
}).$mount("#app");
