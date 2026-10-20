<template>
  <div class="ol-kpi">
    <div v-if="block.title" class="ol-report__card-title">{{ block.title }}</div>
    <div class="ol-kpi__grid">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="ol-report__card ol-kpi__card"
        :style="{ '--kpi-color': colorAt(i) }"
      >
        <div class="ol-kpi__label">
          <span class="ol-kpi__dot" :style="{ backgroundColor: colorAt(i) }"></span>
          <span>{{ item.label }}</span>
        </div>
        <div class="ol-kpi__value">
          <span class="ol-report__num">{{ formatValue(item.value) }}</span>
          <span v-if="item.unit" class="ol-kpi__unit">{{ item.unit }}</span>
        </div>
        <div class="ol-kpi__foot">
          <span v-if="hasDelta(item)" class="ol-kpi__delta" :class="deltaClass(item)">
            <i :class="deltaIcon(item)"></i>
            <span class="ol-report__num">{{ Math.abs(item.delta) }}%</span>
          </span>
          <span v-else class="ol-kpi__hint">—</span>
          <div v-if="item.spark && item.spark.length" class="ol-kpi__spark">
            <EChartView :option="sparkOption(item, i)" :height="28" :theme="theme" />
          </div>
        </div>
        <div v-if="item.note" class="ol-kpi__note">{{ item.note }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import EChartView from "../EChartView.vue";
import { CHART_PALETTE } from "../theme.js";

export default {
  name: "ol-kpi-row",
  components: { EChartView },
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    items() {
      return Array.isArray(this.block && this.block.items) ? this.block.items : [];
    },
  },
  methods: {
    colorAt(index) {
      return CHART_PALETTE[index % CHART_PALETTE.length];
    },
    formatValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value === "number" && Number.isFinite(value)) {
        return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
      }
      return value;
    },
    hasDelta(item) {
      return item && typeof item.delta === "number" && Number.isFinite(item.delta);
    },
    deltaTrend(item) {
      if (item && item.trend) return item.trend;
      if (item && item.delta > 0) return "up";
      if (item && item.delta < 0) return "down";
      return "flat";
    },
    deltaClass(item) {
      const trend = this.deltaTrend(item);
      return {
        "is-up": trend === "up",
        "is-down": trend === "down",
        "is-flat": trend === "flat",
      };
    },
    deltaIcon(item) {
      const trend = this.deltaTrend(item);
      if (trend === "up") return "el-icon-caret-top";
      if (trend === "down") return "el-icon-caret-bottom";
      return "el-icon-minus";
    },
    sparkOption(item, index) {
      const data = item.spark || [];
      return {
        grid: { left: 2, right: 2, top: 3, bottom: 3 },
        xAxis: {
          type: "category",
          show: false,
          boundaryGap: false,
          data: data.map((_, i) => i),
        },
        yAxis: { type: "value", show: false, scale: true },
        tooltip: { show: false },
        color: [this.colorAt(index)],
        series: [
          {
            type: "line",
            data,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1.6 },
            areaStyle: { opacity: 0.14 },
          },
        ],
      };
    },
  },
};
</script>

<style scoped>
.ol-kpi {
  width: 100%;
}
.ol-kpi__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}
.ol-kpi__card {
  position: relative;
  padding: 14px 14px 12px;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ol-kpi__card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--kpi-color, var(--ol-primary));
  opacity: 0.85;
}
.ol-kpi__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ol-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ol-kpi__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
}
.ol-kpi__value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: var(--ol-text-1);
}
.ol-kpi__value .ol-report__num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
}
.ol-kpi__unit {
  font-size: 12px;
  color: var(--ol-text-2);
}
.ol-kpi__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  margin-top: 2px;
}
.ol-kpi__delta {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11.5px;
  line-height: 1.6;
  white-space: nowrap;
}
.ol-kpi__delta.is-up {
  color: var(--ol-success);
  background: rgba(22, 163, 74, 0.1);
}
.ol-kpi__delta.is-down {
  color: var(--ol-danger);
  background: rgba(239, 68, 68, 0.1);
}
.ol-kpi__delta.is-flat {
  color: var(--ol-text-3);
  background: var(--ol-surface-2);
}
.ol-kpi__hint {
  font-size: 12px;
  color: var(--ol-text-3);
}
.ol-kpi__spark {
  width: 72px;
  height: 28px;
  flex: 0 0 auto;
  opacity: 0.9;
}
.ol-kpi__note {
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px dashed var(--ol-border);
  font-size: 11px;
  line-height: 1.5;
  color: var(--ol-text-3);
}
</style>
