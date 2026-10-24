<template>
  <span
    class="ai-logo"
    :class="['is-' + variant, { 'is-glow': glow }]"
    :style="{ width: sizePx, height: sizePx }"
    aria-hidden="true"
  >
    <span class="ai-logo__glow"></span>
    <img :src="logoUrl" alt="" class="ai-logo__img" />
  </span>
</template>

<script>
import logoUrl from "../../../../assets/icon/aiLogo.svg";

export default {
  name: "ai-logo",
  props: {
    size: { type: [Number, String], default: 36 },
    variant: { type: String, default: "header" },
    glow: { type: Boolean, default: true },
  },
  data() {
    return { logoUrl };
  },
  computed: {
    sizePx() {
      const value = Number(this.size);
      return (Number.isFinite(value) && value > 0 ? value : 36) + "px";
    },
  },
};
</script>

<style scoped>
.ai-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  isolation: isolate;
}
.ai-logo__glow {
  position: absolute;
  inset: -12%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.38), transparent 68%);
  filter: blur(8px);
  opacity: 0.5;
  z-index: -1;
}
.ai-logo__img {
  position: relative;
  z-index: 1;
  width: 78%;
  height: 78%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.32));
}
.ai-logo.is-header .ai-logo__img {
  width: 84%;
  height: 84%;
}
.ai-logo.is-header .ai-logo__glow {
  inset: -10%;
  opacity: 0.42;
}
.ai-logo.is-fab .ai-logo__img {
  width: 88%;
  height: 88%;
}
.ai-logo.is-fab .ai-logo__glow {
  inset: -6%;
  opacity: 0.45;
}
.ai-logo.is-hero .ai-logo__img {
  width: 84%;
  height: 84%;
  filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.38));
}
.ai-logo.is-hero .ai-logo__glow {
  inset: -30%;
  opacity: 0.9;
  filter: blur(18px);
  animation: ai-logo-breathe 4.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ai-logo.is-hero .ai-logo__glow {
    animation: none;
  }
}
@keyframes ai-logo-breathe {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.06);
  }
}
</style>
