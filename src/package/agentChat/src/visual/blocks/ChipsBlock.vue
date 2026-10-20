<template>
  <div class="ol-report__card ol-chips">
    <div v-if="block.title" class="ol-report__card-title">{{ block.title }}</div>
    <div class="ol-chips__row">
      <div v-for="(item, i) in items" :key="i" class="ol-chips__item">
        <div class="ol-chips__value ol-report__num">
          {{ formatValue(item.value) }}<small v-if="item.unit">{{ item.unit }}</small>
        </div>
        <div class="ol-chips__label">{{ item.label }}</div>
        <div v-if="hasDelta(item)" class="ol-chips__delta" :class="deltaClass(item)">
          <i :class="deltaIcon(item)"></i>
          <span class="ol-report__num">{{ Math.abs(item.delta) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ol-chips-block",
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
      const t = this.deltaTrend(item);
      return { "is-up": t === "up", "is-down": t === "down", "is-flat": t === "flat" };
    },
    deltaIcon(item) {
      const t = this.deltaTrend(item);
      if (t === "up") return "el-icon-caret-top";
      if (t === "down") return "el-icon-caret-bottom";
      return "el-icon-minus";
    },
  },
};
</script>

<style scoped>
.ol-chips {
  padding: 12px 14px;
}
.ol-chips__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 8px;
}
.ol-chips__item {
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--ol-surface-2);
  min-width: 0;
}
.ol-chips__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ol-text-1);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.ol-chips__value small {
  font-size: 11px;
  font-weight: 500;
  margin-left: 2px;
  color: var(--ol-text-3);
}
.ol-chips__label {
  margin-top: 2px;
  font-size: 11px;
  color: var(--ol-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ol-chips__delta {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-top: 3px;
  font-size: 11px;
}
.ol-chips__delta.is-up {
  color: var(--ol-success);
}
.ol-chips__delta.is-down {
  color: var(--ol-danger);
}
.ol-chips__delta.is-flat {
  color: var(--ol-text-3);
}
</style>
