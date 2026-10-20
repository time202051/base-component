<template>
  <div class="ol-report__card ol-progress">
    <div v-if="block.title" class="ol-report__card-title">{{ block.title }}</div>
    <div class="ol-progress__rows">
      <div v-for="(row, i) in rows" :key="i" class="ol-progress__row">
        <div class="ol-progress__top">
          <span class="ol-progress__label">{{ row.label }}</span>
          <span class="ol-progress__value ol-report__num" :style="{ color: row.color }">
            {{ row.display }}
          </span>
        </div>
        <div class="ol-progress__track">
          <div class="ol-progress__fill" :style="{ width: row.pct + '%', background: row.color }"></div>
        </div>
        <div v-if="row.status" class="ol-progress__status">{{ row.status }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { toneColor } from "../theme.js";

export default {
  name: "ol-progress-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    rows() {
      const items = Array.isArray(this.block && this.block.items) ? this.block.items : [];
      return items.map(it => {
        const value = Number(it && it.value);
        const safe = Number.isFinite(value) ? value : 0;
        let tone = it && it.tone;
        if (!tone) tone = safe >= 100 ? "success" : safe >= 85 ? "primary" : "warning";
        return {
          label: it.label,
          display: safe + (it.unit || "%"),
          pct: Math.max(0, Math.min(100, safe)),
          status: it.status,
          color: toneColor(tone),
        };
      });
    },
  },
};
</script>

<style scoped>
.ol-progress {
  padding: 12px 14px;
}
.ol-progress__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ol-progress__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}
.ol-progress__label {
  font-size: 12.5px;
  color: var(--ol-text-2);
}
.ol-progress__value {
  font-size: 15px;
  font-weight: 700;
}
.ol-progress__track {
  height: 8px;
  border-radius: 999px;
  background: var(--ol-surface-2);
  overflow: hidden;
}
.ol-progress__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}
.ol-progress__status {
  margin-top: 4px;
  font-size: 11px;
  color: var(--ol-text-3);
}
</style>
