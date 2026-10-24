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

    // 当前使用人大金仓（PG 模式）
    db: {
      // type: "sqlserver",
      // server: "220.179.227.4,60001",
      // database: "WebWMS_CS",
      // user: "sa",
      // password: "oulide@123",
      type: "kingbase",
      // 与 SQL Server 统一：server 都写 "host,port"
      server: "220.179.227.4,20036",
      database: "OLD.WMS.HF2Q.UAT",
      user: "sa",
      password: "oulide@123",
      // 只展示 public schema 下的表（SQL Server 改成 ["dbo"] 或不传）
      schemas: ["public"],
      // 不在 list_tables 里显示的表（按实际库配置，知识包不负责这里）
      hiddenTables: [],
      // 拒绝查询/查看结构的表，按需添加，例如 'ID_Users'
      blockedTables: [],
    },

    // 切回 SQL Server 时改成下面这段（其余配置不用动）：
    // db: {
    //   type: "sqlserver",
    //   server: "220.179.227.4,60001",
    //   database: "WebWMS_CS",
    //   user: "sa",
    //   password: "oulide@123",
    // },

    llm: { provider: "", baseUrl: "", model: "" },
    // 报告生成步骤较多（多次查询 + 生成 HTML），放宽 agent 的最大循环次数
    limits: {
      recursionLimit: 80,
      commandTimeoutSec: 60,
      costLimit: 50,
      maxRows: 500,
      maxSqlQueries: 16,
      maxSchemaCalls: 12,
      turnTimeoutSec: 120,
      maxResultChars: 20000,
      maxTotalToolChars: 120000,
      maxOutputTokens: 20000,
      summaryTriggerTokens: 40000,
      summaryKeepMessages: 12,
    },
    encryptConfig: true,
    checkOnMount: true,
  },
});
swaggerInstall("http://220.179.249.140:20025/swagger/v1/swagger.json").then(() => {});
new Vue({
  render: h => h(App),
}).$mount("#app");
