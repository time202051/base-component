/**
 * 报表视觉主题（唯一来源）。
 *
 * 报表区块 / 图表都用这里的 token，禁止在组件里写死颜色。
 * 主色沿用聊天头部的 #4F7CFF 渐变，保证报表与对话界面是同一套视觉。
 */

export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

/** 图表统一色板，与 KPI/点缀色同源。 */
export const CHART_PALETTE = [
  '#4F7CFF',
  '#22C1C3',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#10B981',
  '#6366F1',
  '#14B8A6',
];

export const CHART_THEME = {
  light: {
    textColor: '#6B7280',
    textColorStrong: '#1F2937',
    axisLine: '#E6EBF2',
    splitLine: '#EEF1F6',
    tooltipBg: 'rgba(255, 255, 255, 0.96)',
    tooltipBorder: '#E6EBF2',
    tooltipText: '#1F2937',
    surface: '#FFFFFF',
  },
  dark: {
    textColor: '#9AA7BC',
    textColorStrong: '#E6ECF5',
    axisLine: 'rgba(255, 255, 255, 0.14)',
    splitLine: 'rgba(255, 255, 255, 0.06)',
    tooltipBg: 'rgba(19, 28, 46, 0.96)',
    tooltipBorder: 'rgba(255, 255, 255, 0.14)',
    tooltipText: '#E6ECF5',
    surface: '#131C2E',
  },
};

export const REPORT_THEME_STORAGE_KEY = 'agentchat:report-theme';

export function resolveTheme(theme) {
  return theme === 'dark' ? 'dark' : 'light';
}

/** 语义色 → CSS 变量，供各区块统一配色使用。 */
export function toneColor(tone) {
  switch (tone) {
    case 'success':
      return 'var(--ol-success)';
    case 'danger':
      return 'var(--ol-danger)';
    case 'warning':
      return 'var(--ol-warning)';
    case 'neutral':
      return 'var(--ol-text-3)';
    case 'primary':
    default:
      return 'var(--ol-primary)';
  }
}

/** 按序号取图表色板。 */
export function paletteColor(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function fillAxis(axis, t) {
  const a = Object.assign({}, axis);
  a.axisLabel = Object.assign({ color: t.textColor }, a.axisLabel);
  a.axisLine = Object.assign({}, a.axisLine);
  a.axisLine.lineStyle = Object.assign({ color: t.axisLine }, a.axisLine.lineStyle);
  a.axisTick = Object.assign({}, a.axisTick);
  a.axisTick.lineStyle = Object.assign({ color: t.axisLine }, a.axisTick.lineStyle);
  a.splitLine = Object.assign({}, a.splitLine);
  a.splitLine.lineStyle = Object.assign({ color: t.splitLine }, a.splitLine.lineStyle);
  return a;
}

function applyAxes(value, t) {
  if (Array.isArray(value)) return value.map(axis => fillAxis(axis, t));
  return value ? fillAxis(value, t) : value;
}

function isPieLike(series) {
  return (Array.isArray(series) ? series : [series]).some(
    s => s && (s.type === 'pie' || s.type === 'gauge' || s.type === 'funnel'),
  );
}

/**
 * 把模型给的 ECharts option 套上统一主题（浅色/深色）。
 * 模型显式设置的样式优先，这里只补默认值。
 */
export function applyChartTheme(option, theme) {
  const t = CHART_THEME[resolveTheme(theme)] || CHART_THEME.light;
  const src = option && typeof option === 'object' ? option : {};
  const result = Object.assign({}, src);

  result.color = Array.isArray(src.color) && src.color.length ? src.color : CHART_PALETTE;
  result.textStyle = Object.assign(
    { color: t.textColorStrong, fontFamily: FONT_FAMILY },
    src.textStyle,
  );

  if (src.xAxis !== undefined) result.xAxis = applyAxes(src.xAxis, t);
  if (src.yAxis !== undefined) result.yAxis = applyAxes(src.yAxis, t);

  const defaultTrigger = isPieLike(src.series) ? 'item' : 'axis';
  const tip = Object.assign(
    { trigger: defaultTrigger, confine: true, backgroundColor: t.tooltipBg, borderColor: t.tooltipBorder },
    src.tooltip,
  );
  tip.textStyle = Object.assign({ color: t.tooltipText }, tip.textStyle);
  result.tooltip = tip;

  if (src.legend) {
    const legend = Object.assign({}, src.legend);
    legend.textStyle = Object.assign({ color: t.textColor }, legend.textStyle);
    result.legend = legend;
  }

  return result;
}

/** 读/存报表主题偏好（用户手动切换优先于模型给的默认值）。 */
export function loadReportTheme() {
  try {
    const saved = localStorage.getItem(REPORT_THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return '';
}

export function saveReportTheme(theme) {
  try {
    localStorage.setItem(REPORT_THEME_STORAGE_KEY, resolveTheme(theme));
  } catch {
    /* ignore */
  }
}
