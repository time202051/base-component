// 组件库的全局配置，通过 Vue.use(AgentChat, options) 或 mountAgentChat(el, options) 传入
export const globalConfig = {
  // agent 服务地址（本地/服务端）
  agentBaseUrl: 'http://localhost:52310',
  // 当前用户标识（用于本地历史按账号隔离）；宿主登录后传入
  userId: '',
  // 标题
  title: '数据库查询助手',
  // 输入框占位
  placeholder: '输入你的问题，Enter 发送，Shift+Enter 换行',

  // ===== 由宿主页面下发的运行时配置（不填则回落到 agent 端 .env）=====
  // 数据库：{ server, database, user, password, trusted?, encrypt?, driver?, connectionString? }
  db: null,
  // 大模型：{ apiKey, baseUrl, model }
  llm: null,
  // 可选：覆盖 agent 端保护参数
  // { maxRows, costLimit, commandTimeoutSec, llmTimeoutSec, recursionLimit, turnTimeoutSec,
  //   maxConcurrent, summaryTriggerTokens, summaryKeepMessages,
  //   maxSqlQueries, maxSchemaCalls, maxResultChars, maxTotalToolChars, maxOutputTokens }
  // 报告生成步骤较多（多次查询 + 生成 HTML），默认放宽 agent 的最大循环次数
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
export const llmProviders = [
  {
    value: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    value: 'dashscope',
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  {
    value: 'moonshot',
    label: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
  },
  { value: 'custom', label: '自定义', baseUrl: '', model: '' },
];
