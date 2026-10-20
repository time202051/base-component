import './report.css';
import EChartView from './EChartView.vue';
import ReportView from './ReportView.vue';
import HtmlReportView from './HtmlReportView.vue';

/**
 * 可视化组件注册表。
 *
 * 约定：模型通过 render_chart 工具返回 { component, title, height, props }，
 * 前端按 component 名查表渲染对应组件，props 直接透传。
 * 宿主可用 registerVisualComponent 扩展/覆盖，例如注册自己的表格、KPI 卡片等。
 */
const registry = new Map();

export function registerVisualComponent(name, component) {
  if (name && component) registry.set(name, component);
}

export function getVisualComponent(name) {
  return registry.get(name) || null;
}

export function registerVisualComponents(map) {
  if (map && typeof map === 'object') {
    Object.keys(map).forEach((key) => registerVisualComponent(key, map[key]));
  }
}

registerVisualComponent('ol-echarts', EChartView);
registerVisualComponent('ol-report', ReportView);
registerVisualComponent('ol-html-report', HtmlReportView);

export { EChartView, ReportView, HtmlReportView };
