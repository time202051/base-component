<template>
  <div class="ol-summary">
    <div class="ol-summary__title">{{ block.title || "核心结论" }}</div>
    <div class="ol-summary__text">{{ block.text }}</div>
    <ul v-if="items.length" class="ol-summary__list">
      <li v-for="(text, i) in items" :key="i" class="ol-summary__item">
        <span class="ol-summary__dot"></span>
        <span>{{ text }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "ol-summary-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    items() {
      return Array.isArray(this.block && this.block.items) ? this.block.items : [];
    },
  },
};
</script>

<style scoped>
.ol-summary {
  position: relative;
  padding: 12px 14px 12px 16px;
  background: var(--ol-surface);
  border: 1px solid var(--ol-border);
  border-left: 3px solid var(--ol-primary);
  border-radius: var(--ol-radius-sm);
}
.ol-summary__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ol-text-2);
  margin-bottom: 6px;
}
.ol-summary__text {
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--ol-text-1);
}
.ol-summary__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ol-summary__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ol-text-2);
}
.ol-summary__dot {
  width: 5px;
  height: 5px;
  margin-top: 8px;
  border-radius: 50%;
  background: var(--ol-primary);
  flex: 0 0 auto;
}
</style>
