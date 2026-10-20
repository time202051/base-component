<template>
  <div class="ol-notice" :class="'is-' + tone">
    <i class="ol-notice__icon" :class="icon"></i>
    <span class="ol-notice__text">{{ block.text }}</span>
  </div>
</template>

<script>
export default {
  name: "ol-notice-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    tone() {
      return (this.block && this.block.tone) || "warning";
    },
    icon() {
      switch (this.tone) {
        case "danger":
          return "el-icon-error";
        case "success":
          return "el-icon-success";
        case "primary":
          return "el-icon-info";
        default:
          return "el-icon-warning-outline";
      }
    },
  },
};
</script>

<style scoped>
.ol-notice {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 12px;
  border-radius: var(--ol-radius-sm);
  font-size: 12px;
  line-height: 1.6;
}
.ol-notice__icon {
  margin-top: 2px;
  flex: 0 0 auto;
}
.ol-notice.is-warning {
  color: var(--ol-warning);
  background: rgba(245, 158, 11, 0.12);
}
.ol-notice.is-danger {
  color: var(--ol-danger);
  background: rgba(239, 68, 68, 0.12);
}
.ol-notice.is-success {
  color: var(--ol-success);
  background: rgba(22, 163, 74, 0.12);
}
.ol-notice.is-primary {
  color: var(--ol-primary);
  background: rgba(79, 124, 255, 0.1);
}
.ol-notice.is-neutral {
  color: var(--ol-text-2);
  background: var(--ol-surface-2);
}
</style>
