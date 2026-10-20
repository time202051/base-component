<template>
  <div class="ol-report__card ol-dist">
    <div v-if="block.title || block.subtitle" class="ol-report__card-title">
      {{ block.title || "分布" }}
      <span v-if="block.subtitle" class="ol-report__card-sub">{{ block.subtitle }}</span>
    </div>
    <div class="ol-dist__bar">
      <div
        v-for="(seg, i) in segments"
        :key="i"
        class="ol-dist__seg"
        :style="{ flexGrow: seg.value, background: seg.color }"
        :title="seg.label + ' ' + seg.value"
      >
        <span v-if="seg.value > 0" class="ol-dist__seg-val ol-report__num">{{ seg.value }}</span>
      </div>
    </div>
    <div class="ol-dist__legend">
      <span v-for="(seg, i) in segments" :key="i" class="ol-dist__legend-item">
        <i class="ol-dist__dot" :style="{ background: seg.color }"></i>
        <span class="ol-dist__legend-label">{{ seg.label }}</span>
        <b class="ol-report__num">{{ seg.value }}</b>
      </span>
    </div>
  </div>
</template>

<script>
import { toneColor } from "../theme.js";

const DEFAULT_TONES = ["danger", "warning", "primary", "success", "neutral"];

export default {
  name: "ol-dist-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    segments() {
      const items = Array.isArray(this.block && this.block.items) ? this.block.items : [];
      return items.map((it, i) => {
        const value = Number(it && it.value);
        const safe = Number.isFinite(value) && value > 0 ? value : 0;
        return {
          label: it.label,
          value: safe,
          color: toneColor(it.tone || DEFAULT_TONES[i % DEFAULT_TONES.length]),
        };
      });
    },
  },
};
</script>

<style scoped>
.ol-dist {
  padding: 12px 14px;
}
.ol-dist__bar {
  display: flex;
  height: 22px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ol-surface-2);
}
.ol-dist__seg {
  flex-basis: 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: flex-grow 0.5s ease;
}
.ol-dist__seg-val {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.ol-dist__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
}
.ol-dist__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--ol-text-2);
}
.ol-dist__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.ol-dist__legend-label {
  color: var(--ol-text-2);
}
.ol-dist__legend-item b {
  color: var(--ol-text-1);
  font-weight: 600;
}
</style>
