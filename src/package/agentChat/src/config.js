// 组件库的全局配置，通过 Vue.use(AgentChat, options) 或 mountAgentChat(el, options) 传入
export const globalConfig = {
  // agent 服务地址（本地/服务端）
  agentBaseUrl: 'http://localhost:52310',
  // 当前用户标识（用于本地历史按账号隔离）；宿主登录后传入
  userId: '',
  // 标题
  title: 'AI查询分析助手',
  // 输入框占位
  placeholder: '输入你的问题，Enter 发送，Shift+Enter 换行',
  // 默认展开查询 SQL（默认 false：执行过程/数据依据里折叠，用户可手动展开）
  showSql: false,
  // 空状态快捷问题，支持字符串数组或 { label, text, icon } 数组
  examples: [],
  // 是否显示“继续追问”推荐（规则兜底 + 模型异步生成）；false = 完全关闭
  suggestions: true,

  // ===== 由宿主页面下发的运行时配置（全部随 configEnc 加密传输）=====
  // db 数据库配置（SQL Server 与 Kingbase 通用）：
  //   type          'sqlserver'（默认）| 'kingbase'，决定驱动和 SQL 方言
  //   server        地址，统一写 'host,port'
  //                 例：'220.179.227.4,60001'（SQL Server）
  //                     '220.179.227.4,20036'（Kingbase）
  //   database      数据库名
  //   user          登录账号
  //   password      登录密码
  //
  //   ---- 仅 SQL Server ----
  //   connectionString  完整 ODBC 连接串（给了它则忽略 server/database/user/password）
  //   trusted           true = Windows 集成认证，不用填 user/password
  //   encrypt           ODBC Encrypt=Yes/No
  //   driver            ODBC 驱动名，默认 'ODBC Driver 17 for SQL Server'
  //
  //   ---- 仅 Kingbase ----
  //   host / port       兼容写法（推荐直接用 server）；port 默认 54321
  //   ssl               true = 启用 SSL，默认 false
  //
  //   ---- 两种数据库通用 ----
  //   schemas        只展示这些 schema 的表
  //                  SQL Server 默认 []（全部）；Kingbase 默认 ['public']
  //   hiddenTables   不在 list_tables 里显示的表，支持尾部 * 通配
  //                  例：['WMS_StockHistorys_2026*', 'WMS_StockHistorys_backup']
  //   blockedTables  拒绝查询/拒绝查看结构的表，默认 []
  //                  例：['ID_Users', 'AbpTenantConnectionStrings', 'WMS_ApiInterfaceConfigs']
  //   profile        'wms'（默认，注入 WMS 指标口径）| 'generic'（不注入业务指标）
  //   businessPrompt 追加到系统提示里的业务说明
  //                  例：'统计库存要加 "IsDeleted" = false；库存流水查 "WMS_StockHistorys" 父表'
  db: null,

  // 大模型：{ apiKey, baseUrl, model }
  llm: null,

  // 可选：覆盖 agent 端保护参数
  //   maxRows            单次返回行数上限，默认 200
  //   commandTimeoutSec  数据库查询超时（秒），默认 15；金仓报表建议 30
  //   costLimit          仅 SQL Server 的查询代价上限，默认 30
  //   llmTimeoutSec      大模型调用超时（秒），默认 60
  //   recursionLimit     agent 最大工具循环次数，默认 80
  //   turnTimeoutSec     单轮对话总时长（秒），默认 180
  //   maxConcurrent      并发会话上限，默认 3
  //   maxSqlQueries      单轮 SQL 次数上限，默认 6；报告轮次自动放宽
  //   maxSchemaCalls     单轮表结构查询次数上限，默认 6
  //   maxResultChars     单次工具结果字符上限，默认 8000
  //   maxTotalToolChars  单轮所有工具结果字符上限，默认 40000
  //   maxOutputTokens    单次模型输出 token 上限，默认 12000
  //   requireSqlApproval true = 每次执行 SQL 前由页面确认（LangChain HITL），默认 false
  limits: { recursionLimit: 80 },
  // 本地 agent 服务安装包下载地址（用户电脑未安装时，组件顶部显示"下载本地查询服务"按钮）
  downloadUrl: '',
  // 是否对下发的 config（含数据库密码/API Key）做传输加密（默认开）
  encryptConfig: true,
  // 打开组件时是否自动做一次连接自检（数据库 + 大模型）
  checkOnMount: true,
};

export function configure(options = {}) {
  Object.assign(globalConfig, options);
}

// 可选的大模型服务预设（用户在设置里选一个，可再手改地址/模型）
// models 只是常用候选，设置弹窗里允许直接输入新的模型名。
export const llmProviders = [
  {
    value: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    value: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  },
  {
    value: 'dashscope',
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
  },
  {
    value: 'moonshot',
    label: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  {
    value: 'xiaomi',
    label: '小米 MiMo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    model: 'mimo-v2.6-pro',
    models: ['mimo-v2.6-pro', 'mimo-v2.6-flash', 'mimo-v2.6-pro-ultraspeed'],
    hint: '小米 MiMo 开放平台；API Key 以 sk- 开头。',
  },
  {
    value: 'zhipu',
    label: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4.6',
    models: ['glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4.5-air', 'glm-4-flash'],
    hint: '智谱开放平台；模型名可直接输入，例如 glm-4.6。',
  },
  {
    value: 'siliconflow',
    label: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3.2',
    models: [
      'deepseek-ai/DeepSeek-V3.2',
      'Pro/zai-org/GLM-4.7',
      'Qwen/Qwen3.6-35B-A3B',
      'moonshotai/Kimi-K2.6',
    ],
    hint: '硅基流动模型名通常带厂商前缀，可在模型名输入框直接修改。',
  },
  {
    value: 'minimax',
    label: 'MiniMax',
    baseUrl: 'https://api.minimax.io/v1',
    model: 'MiniMax-M2.7',
    models: [
      'MiniMax-M3',
      'MiniMax-M2.7',
      'MiniMax-M2.7-highspeed',
      'MiniMax-M2.5',
      'MiniMax-M2.5-highspeed',
      'MiniMax-M2',
    ],
    hint: '国际站地址；国内站可改为 https://api.minimaxi.com/v1。',
  },
  { value: 'custom', label: '自定义（OpenAI 兼容）', baseUrl: '', model: '', models: [] },
];
