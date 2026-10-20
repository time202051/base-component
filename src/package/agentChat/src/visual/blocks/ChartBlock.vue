<template>
  <div class="ol-report__card ol-chart-block">
    <div class="ol-chart-block__head">
      <span class="ol-report__card-title">{{ block.title }}</span>
      <span v-if="block.subtitle" class="ol-report__card-sub">{{ block.subtitle }}</span>
    </div>
    <EChartView :option="block.option || {}" :height="height" :theme="theme" />
  </div>
</template>

<script>
import EChartView from "../EChartView.vue";

export default {
  name: "ol-chart-block",
  components: { EChartView },
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
    height: { type: [Number, String], default: 280 },
  },
};
</script>

<style scoped>
.ol-chart-block {
  padding: 12px 14px 10px;
}
.ol-chart-block__head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}
.ol-chart-block__head .ol-report__card-title {
  margin-bottom: 0;
}
</style>
