<template>
  <div ref="root" class="ol-report" :data-theme="currentTheme">
    <div class="ol-report__head">
      <div class="ol-report__titles">
        <div class="ol-report__title">{{ title || "分析报表" }}</div>
        <div class="ol-report__subtitle">{{ subtitleLine }}</div>
      </div>
      <div class="ol-report__actions">
        <button
          type="button"
          class="ol-report__action"
          :title="currentTheme === 'dark' ? '切换浅色' : '切换深色'"
          @click.stop="toggleTheme"
        >
          <i :class="currentTheme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon'"></i>
        </button>
        <button
          type="button"
          class="ol-report__action"
          :disabled="exporting"
          title="导出图片"
          @click.stop="exportAs('png')"
        >
          <i class="el-icon-picture-outline"></i>
        </button>
        <button
          type="button"
          class="ol-report__action"
          :disabled="exporting"
          title="导出 PDF"
          @click.stop="exportAs('pdf')"
        >
          <i class="el-icon-document"></i>
        </button>
      </div>
    </div>

    <div v-if="blockList.length" class="ol-report__grid" :style="gridStyle">
      <div
        v-for="(block, index) in blockList"
        :key="index"
        class="ol-report__block"
        :style="{ gridColumn: 'span ' + spanFor(block) }"
      >
        <component
          :is="blockComponent(block.type)"
          v-if="blockComponent(block.type)"
          :block="block"
          :theme="currentTheme"
          :height="chartHeight"
        />
      </div>
    </div>
    <div v-else class="ol-report__empty">暂无可展示的数据</div>
  </div>
</template>

<script>
import KpiRow from "./blocks/KpiRow.vue";
import ChartBlock from "./blocks/ChartBlock.vue";
import TableBlock from "./blocks/TableBlock.vue";
import InsightBlock from "./blocks/InsightBlock.vue";
import SectionBlock from "./blocks/SectionBlock.vue";
import SummaryBlock from "./blocks/SummaryBlock.vue";
import NoticeBlock from "./blocks/NoticeBlock.vue";
import HbarBlock from "./blocks/HbarBlock.vue";
import ProgressBlock from "./blocks/ProgressBlock.vue";
import ChipsBlock from "./blocks/ChipsBlock.vue";
import DistBlock from "./blocks/DistBlock.vue";
import RiskBlock from "./blocks/RiskBlock.vue";
import { exportReport } from "./export.js";
import { loadReportTheme, resolveTheme, saveReportTheme } from "./theme.js";

const BLOCK_MAP = {
  section: SectionBlock,
  summary: SummaryBlock,
  notice: NoticeBlock,
  kpi: KpiRow,
  hbar: HbarBlock,
  progress: ProgressBlock,
  chips: ChipsBlock,
  dist: DistBlock,
  chart: ChartBlock,
  table: TableBlock,
  risk: RiskBlock,
  insights: InsightBlock,
};

export default {
  name: "ol-report",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    theme: { type: String, default: "" },
    blocks: { type: Array, default: () => [] },
  },
  data() {
    return {
      currentTheme: "light",
      cols: 1,
      exporting: false,
      generatedAt: "",
    };
  },
  computed: {
    blockList() {
      return Array.isArray(this.blocks) ? this.blocks.filter(b => b && BLOCK_MAP[b.type]) : [];
    },
    gridStyle() {
      return { gridTemplateColumns: `repeat(${this.cols}, minmax(0, 1fr))` };
    },
    chartHeight() {
      if (this.cols >= 3) return 320;
      if (this.cols === 2) return 270;
      return 240;
    },
    subtitleLine() {
      if (this.subtitle) return this.subtitle;
      return "生成于 " + this.generatedAt;
    },
  },
  created() {
    this.generatedAt = this.formatTime(new Date());
    this.currentTheme = loadReportTheme() || resolveTheme(this.theme);
  },
  mounted() {
    this.measure();
    if (typeof ResizeObserver !== "undefined") {
      // rAF 延迟：切列会改变栅格尺寸，同步回调会再次触发 observer 造成循环告警
      this.ro = new ResizeObserver(() => this.scheduleMeasure());
      this.ro.observe(this.$refs.root);
    } else {
      this.onWinResize = () => this.scheduleMeasure();
      window.addEventListener("resize", this.onWinResize);
    }
  },
  beforeDestroy() {
    if (this.measureRaf) {
      cancelAnimationFrame(this.measureRaf);
      this.measureRaf = null;
    }
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    } else if (this.onWinResize) {
      window.removeEventListener("resize", this.onWinResize);
      this.onWinResize = null;
    }
  },
  methods: {
    formatTime(date) {
      const pad = n => (n < 10 ? "0" + n : "" + n);
      return pad(date.getHours()) + ":" + pad(date.getMinutes());
    },
    scheduleMeasure() {
      if (this.measureRaf) return;
      this.measureRaf = requestAnimationFrame(() => {
        this.measureRaf = null;
        this.measure();
      });
    },
    measure() {
      const root = this.$refs.root;
      if (!root) return;
      const width = root.clientWidth || 0;
      const next = width < 400 ? 1 : width < 760 ? 2 : 3;
      if (next !== this.cols) this.cols = next;
    },
    blockComponent(type) {
      return BLOCK_MAP[type] || null;
    },
    spanFor(block) {
      if (!block) return this.cols;
      if (this.cols === 1) return 1;
      if (block.type !== "chart") return this.cols;
      const span = Number(block.span) > 0 ? Number(block.span) : 6;
      const scaled = Math.round((span / 12) * this.cols);
      return Math.min(this.cols, Math.max(1, scaled));
    },
    toggleTheme() {
      this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
      saveReportTheme(this.currentTheme);
    },
    async exportAs(format) {
      if (this.exporting) return;
      this.exporting = true;
      try {
        const width = this.cols >= 3 ? 1280 : this.cols === 2 ? 1000 : 760;
        await exportReport(this.$refs.root, {
          format,
          theme: this.currentTheme,
          cols: this.cols,
          width,
          fileName: this.title || "分析报表",
        });
        if (this.$message) this.$message.success(format === "pdf" ? "PDF 已导出" : "图片已导出");
      } catch (e) {
        if (this.$message) this.$message.error("导出失败：" + ((e && e.message) || e));
      } finally {
        this.exporting = false;
      }
    },
  },
};
</script>

<style scoped>
.ol-report__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, rgba(79, 124, 255, 0.05), var(--ol-surface) 60%);
  border-bottom: 1px solid var(--ol-border);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.ol-report__head::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ol-primary), var(--ol-primary-2));
}
.ol-report__titles {
  min-width: 0;
}
.ol-report__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ol-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ol-report__subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: var(--ol-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ol-report__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.ol-report__action {
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ol-text-3);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.ol-report__action:hover {
  background: var(--ol-surface-2);
  color: var(--ol-text-1);
}
.ol-report__action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.ol-report__grid {
  display: grid;
  gap: var(--ol-gap);
  padding: 12px;
}
.ol-report__block {
  min-width: 0;
}
.ol-report__empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--ol-text-3);
}
</style>
