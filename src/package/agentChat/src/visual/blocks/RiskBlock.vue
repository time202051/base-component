<template>
  <div class="ol-report__card ol-risk">
    <div v-if="block.title" class="ol-report__card-title">{{ block.title }}</div>
    <div class="ol-risk__list">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="ol-risk__item"
        :class="'is-' + (item.tone || 'neutral')"
      >
        <div class="ol-risk__head">
          <span class="ol-risk__dot"></span>
          <span class="ol-risk__title">{{ item.title }}</span>
        </div>
        <div class="ol-risk__text">{{ item.text }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ol-risk-block",
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
.ol-risk {
  padding: 12px 14px;
}
.ol-risk__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ol-risk__item {
  padding: 9px 12px;
  border-radius: 8px;
  border-left: 3px solid var(--ol-text-3);
  background: var(--ol-surface-2);
}
.ol-risk__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.ol-risk__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ol-text-3);
  flex: 0 0 auto;
}
.ol-risk__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ol-text-1);
}
.ol-risk__text {
  font-size: 12px;
  line-height: 1.65;
  color: var(--ol-text-2);
}
.ol-risk__item.is-danger {
  border-left-color: var(--ol-danger);
  background: rgba(239, 68, 68, 0.07);
}
.ol-risk__item.is-danger .ol-risk__dot {
  background: var(--ol-danger);
}
.ol-risk__item.is-warning {
  border-left-color: var(--ol-warning);
  background: rgba(245, 158, 11, 0.08);
}
.ol-risk__item.is-warning .ol-risk__dot {
  background: var(--ol-warning);
}
.ol-risk__item.is-success {
  border-left-color: var(--ol-success);
  background: rgba(22, 163, 74, 0.07);
}
.ol-risk__item.is-success .ol-risk__dot {
  background: var(--ol-success);
}
.ol-risk__item.is-primary {
  border-left-color: var(--ol-primary);
  background: rgba(79, 124, 255, 0.06);
}
.ol-risk__item.is-primary .ol-risk__dot {
  background: var(--ol-primary);
}
</style>
