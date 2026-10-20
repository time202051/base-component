<template>
  <div class="ol-report__card ol-insight">
    <div class="ol-report__card-title">{{ block.title || "关键结论" }}</div>
    <ul class="ol-insight__list">
      <li v-for="(text, i) in items" :key="i" class="ol-insight__item">
        <span class="ol-insight__dot"></span>
        <span class="ol-insight__text">{{ text }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "ol-insight-block",
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
.ol-insight {
  padding: 12px 14px;
}
.ol-insight__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.ol-insight__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.ol-insight__dot {
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: var(--ol-primary);
}
.ol-insight__text {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--ol-text-2);
  overflow-wrap: anywhere;
}
</style>
