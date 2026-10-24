<template>
  <div v-if="items.length" class="ac-quick">
    <button
      v-for="item in items"
      :key="item.text"
      type="button"
      class="ac-quick__item"
      @click="$emit('select', item.text)"
    >
      <i :class="item.icon || 'el-icon-chat-line-round'"></i>
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: "ac-quick-prompts",
  props: {
    items: { type: Array, default: () => [] },
  },
};
</script>

<style scoped>
.ac-quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  margin-top: 18px;
}
.ac-quick__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(79, 124, 255, 0.14);
  border-radius: 10px;
  background: linear-gradient(180deg, #fff, #f8fbff);
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.ac-quick__item::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, #4f7cff, #22d3ee);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.ac-quick__item i {
  flex: 0 0 auto;
  color: #4f7cff;
  font-size: 14px;
}
.ac-quick__item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-quick__item:hover {
  border-color: rgba(34, 211, 238, 0.45);
  color: #2563eb;
  box-shadow:
    0 6px 18px rgba(79, 124, 255, 0.12),
    0 0 16px rgba(34, 211, 238, 0.08);
}
.ac-quick__item:hover::before {
  opacity: 1;
}
.ac-quick__item:hover i {
  color: #22d3ee;
}
</style>
