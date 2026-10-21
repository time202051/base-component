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
      type: "sqlserver",
      server: "220.179.227.4,60001",
      database: "WebWMS_CS",
      user: "sa",
      password: "oulide@123",
      // type: "kingbase",
      // // 与 SQL Server 统一：server 都写 "host,port"
      // server: "220.179.227.4,20036",
      // database: "OLD.WMS.HF2Q.UAT",
      // user: "sa",
      // password: "oulide@123",
      // 只展示 public schema 下的表
      schemas: ["public"],
      // 不在 list_tables 里显示的表（分区/备份表）
      hiddenTables: [
        "WMS_StockHistorys_2026*",
        "WMS_StockHistorys_Default",
        "WMS_StockHistorys_backup",
      ],
      // 拒绝查询/查看结构的表，按需添加，例如 'ID_Users'
      blockedTables: [],
      // 'wms' = 注入 WMS 指标口径；'generic' = 不注入业务指标
      profile: "wms",
      // 追加到系统提示的业务说明
      businessPrompt: `
        库存流水查 "WMS_StockHistorys" 父表；
        统计库存要加 "IsDeleted" = false；
        表名/列名必须使用双引号。
      `,
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
      recursionLimit: 80, // agent 最大工具循环次数
      commandTimeoutSec: 30, // 单次数据库查询超时（秒）
      maxRows: 200, // 单次返回行数上限
      maxSqlQueries: 10, // 单轮 SQL 次数上限
      maxSchemaCalls: 8, // 单轮表结构查询次数上限
    },
    encryptConfig: true,
    checkOnMount: true,
  },
});
swaggerInstall("http://220.179.249.140:20025/swagger/v1/swagger.json").then(() => {});
new Vue({
  render: h => h(App),
}).$mount("#app");
