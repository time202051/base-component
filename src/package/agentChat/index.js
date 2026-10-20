import Vue from "vue";
import AgentChat from "./src/index.vue";
import { configure, globalConfig } from "./src/config.js";

AgentChat.install = function (VueCtor) {
  VueCtor.component("ol-agent-chat", AgentChat);
};

/**
 * 命令式挂载（适合老页面/非组件场景）：
 * mountAgentChat('#agent-chat', { props: { userId: 'zhangsan' } })
 */
export function mountAgentChat(target, options = {}) {
  if (options) configure(options);
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) {
    throw new Error(`mountAgentChat: 找不到挂载目标 ${target}`);
  }
  return new Vue({
    render: (h) => h(AgentChat, { props: options.props || {} }),
  }).$mount(el);
}

export { AgentChat, configure, globalConfig };
export {
  registerVisualComponent,
  registerVisualComponents,
  getVisualComponent,
  EChartView,
} from "./src/visual/registry.js";
export default AgentChat;
