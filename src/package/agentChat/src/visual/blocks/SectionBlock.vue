<template>
  <div class="ol-section">
    <div v-if="hasNo" class="ol-section__badge">{{ block.no }}</div>
    <div class="ol-section__titles">
      <div class="ol-section__title">{{ block.title }}</div>
      <div v-if="block.subtitle" class="ol-section__sub">{{ block.subtitle }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ol-section-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    hasNo() {
      const no = this.block && this.block.no;
      return no !== undefined && no !== null && no !== "";
    },
  },
};
</script>

<style scoped>
.ol-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px;
  margin-top: 4px;
}
.ol-section__badge {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--ol-primary), var(--ol-primary-2));
  box-shadow: 0 4px 10px rgba(79, 124, 255, 0.3);
}
.ol-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ol-text-1);
  line-height: 1.25;
}
.ol-section__sub {
  font-size: 11px;
  color: var(--ol-text-3);
  margin-top: 1px;
}
</style>
