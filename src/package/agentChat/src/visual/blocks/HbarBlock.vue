<template>
  <div class="ol-report__card ol-hbar">
    <div v-if="block.title || block.subtitle" class="ol-report__card-title">
      {{ block.title || "对比" }}
      <span v-if="block.subtitle" class="ol-report__card-sub">{{ block.subtitle }}</span>
    </div>
    <div class="ol-hbar__rows">
      <div v-for="(row, i) in rows" :key="i" class="ol-hbar__row">
        <div class="ol-hbar__label" :title="row.label">{{ row.label }}</div>
        <div class="ol-hbar__track">
          <div class="ol-hbar__fill" :style="{ width: row.pct + '%', background: row.color }"></div>
        </div>
        <div class="ol-hbar__value ol-report__num" :style="{ color: row.color }">
          {{ row.display }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { paletteColor, toneColor } from "../theme.js";

export default {
  name: "ol-hbar-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    rows() {
      const items = Array.isArray(this.block && this.block.items) ? this.block.items : [];
      const max = items.reduce((m, it) => {
        const v = Number(it && it.value);
        const cap = Number(it && it.max);
        return Math.max(m, Number.isFinite(v) ? v : 0, Number.isFinite(cap) ? cap : 0);
      }, 0);
      const scale = max > 0 ? max : 1;
      return items.map((it, i) => {
        const value = Number(it && it.value);
        const safe = Number.isFinite(value) ? value : 0;
        return {
          label: it.label,
          display: safe + (it.unit || ""),
          pct: Math.max(0, Math.min(100, (safe / scale) * 100)),
          color: it.tone ? toneColor(it.tone) : paletteColor(i),
        };
      });
    },
  },
};
</script>

<style scoped>
.ol-hbar {
  padding: 12px 14px;
}
.ol-hbar__rows {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.ol-hbar__row {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 10px;
}
.ol-hbar__label {
  font-size: 12px;
  color: var(--ol-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ol-hbar__track {
  height: 9px;
  border-radius: 999px;
  background: var(--ol-surface-2);
  overflow: hidden;
}
.ol-hbar__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}
.ol-hbar__value {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 48px;
  text-align: right;
}
</style>
