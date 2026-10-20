<template>
  <div class="ac-chart">
    <div v-if="title" class="ac-chart__title">{{ title }}</div>
    <div ref="canvas" class="ac-chart__canvas" :style="{ height: chartHeight }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  DataZoomComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { applyChartTheme, resolveTheme } from './theme.js';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  DataZoomComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

export default {
  name: 'ac-echart',
  props: {
    // 标准 ECharts option（由后端模型生成的图表规范）
    option: { type: Object, default: () => ({}) },
    title: { type: String, default: '' },
    height: { type: [Number, String], default: 300 },
    // 报表主题：light / dark，图表配色与坐标轴随主题变化
    theme: { type: String, default: 'light' },
  },
  computed: {
    chartHeight() {
      const h = Number(this.height);
      return (h > 0 ? h : 300) + 'px';
    },
    themedOption() {
      return applyChartTheme(this.option, resolveTheme(this.theme));
    },
  },
  watch: {
    option: {
      deep: true,
      handler() {
        this.render();
      },
    },
    theme() {
      this.render();
    },
  },
  mounted() {
    this.chart = echarts.init(this.$refs.canvas);
    this.render();
    if (typeof ResizeObserver !== 'undefined') {
      // 用 rAF 延迟回调：resize() 会改变 canvas 尺寸，同步回调会再次触发 observer，
      // 导致 "ResizeObserver loop completed with undelivered notifications"。
      this.ro = new ResizeObserver(() => this.scheduleResize());
      this.ro.observe(this.$refs.canvas);
    } else {
      window.addEventListener('resize', this.resize);
    }
  },
  beforeDestroy() {
    if (this.resizeRaf) {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = null;
    }
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    } else {
      window.removeEventListener('resize', this.resize);
    }
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    render() {
      if (!this.chart) return;
      try {
        this.chart.setOption(this.themedOption || {}, true);
      } catch (e) {
        console.warn('[agent-chat] ECharts option 渲染失败：', (e && e.message) || e);
      }
    },
    scheduleResize() {
      if (this.resizeRaf) return;
      this.resizeRaf = requestAnimationFrame(() => {
        this.resizeRaf = null;
        this.resize();
      });
    },
    resize() {
      if (this.chart) this.chart.resize();
    },
  },
};
</script>

<style scoped>
.ac-chart {
  width: 100%;
}
.ac-chart__title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.ac-chart__canvas {
  width: 100%;
}
</style>
