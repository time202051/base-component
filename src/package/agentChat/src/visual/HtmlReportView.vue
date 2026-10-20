<template>
  <div
    class="ol-html-report"
    :class="{ 'is-fullscreen': fullscreen, 'has-rail': hasRail }"
    :style="{ '--ol-preview-h': previewHeight }"
  >
    <div class="ol-html-report__head">
      <div class="ol-html-report__titles">
        <div class="ol-html-report__title-row">
          <span class="ol-html-report__title">{{ title || "分析报告" }}</span>
          <span v-if="templateLabel" class="ol-html-report__badge">{{ templateLabel }}</span>
        </div>
        <div v-if="subtitle || period" class="ol-html-report__sub">
          <span v-if="subtitle">{{ subtitle }}</span>
          <span v-if="period">{{ subtitle ? " · " : "" }}{{ period }}</span>
        </div>
      </div>
      <div class="ol-html-report__actions">
        <button
          type="button"
          class="ol-html-report__action"
          :title="currentTheme === 'dark' ? '切换浅色' : '切换深色'"
          @click.stop="toggleTheme"
        >
          <i :class="currentTheme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon'"></i>
        </button>
        <button type="button" class="ol-html-report__action" :disabled="busy" title="打印 / 另存为 PDF" @click.stop="print">
          <i class="el-icon-printer"></i>
        </button>
        <button type="button" class="ol-html-report__action" :disabled="busy" title="导出长图" @click.stop="exportAs('png')">
          <i class="el-icon-picture-outline"></i>
        </button>
        <button type="button" class="ol-html-report__action" :disabled="busy" title="导出 PDF" @click.stop="exportAs('pdf')">
          <i class="el-icon-document"></i>
        </button>
        <button type="button" class="ol-html-report__action" title="打开新窗口" @click.stop="openNew">
          <i class="el-icon-top-right"></i>
        </button>
        <button type="button" class="ol-html-report__action" title="下载 HTML" @click.stop="download">
          <i class="el-icon-download"></i>
        </button>
        <button
          type="button"
          class="ol-html-report__action"
          :title="fullscreen ? '退出全屏' : '全屏查看'"
          @click.stop="fullscreen = !fullscreen"
        >
          <i :class="fullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
        </button>
      </div>
    </div>

    <div class="ol-html-report__body">
      <nav v-if="hasRail" class="ol-html-report__rail" aria-label="报告目录">
        <div class="ol-html-report__rail-title">目录</div>
        <button
          v-for="item in sections"
          :key="item.id"
          type="button"
          class="ol-html-report__rail-item"
          :class="{ 'is-active': item.id === activeId }"
          @click.stop="goSection(item)"
        >
          <span class="ol-html-report__rail-no">{{ item.no }}</span>
          <span class="ol-html-report__rail-text">{{ item.title }}</span>
        </button>
      </nav>

      <div class="ol-html-report__preview" @click="enterFullscreen">
        <div v-if="loading" class="ol-html-report__loading">
          <i class="el-icon-loading"></i> 正在生成报告…
        </div>
        <iframe
          v-else
          ref="frame"
          class="ol-html-report__frame"
          :srcdoc="doc"
          sandbox="allow-scripts allow-popups allow-forms"
          scrolling="auto"
          title="report-preview"
        ></iframe>
        <div v-if="!loading && !fullscreen" class="ol-html-report__mask">
          <span class="ol-html-report__cta"><i class="el-icon-full-screen"></i> 查看完整报告</span>
        </div>
        <div v-if="busy" class="ol-html-report__busy">
          <i class="el-icon-loading"></i> 正在导出…
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  buildHtmlReportDoc,
  downloadHtml,
  formatReportTime,
  loadEchartsUmd,
  openInNewWindow,
} from "./htmlReport.js";
import { exportReportPdf, exportReportPng, printDoc } from "./exportImage.js";

const TEMPLATE_LABELS = {
  daily: "作业日报",
  weekly: "运营周报",
  monthly: "运营月报",
  inventory: "库存快照",
  exception: "异常专报",
  compare: "多仓对比",
};

export default {
  name: "ol-html-report",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    html: { type: String, default: "" },
    charts: { type: Object, default: () => ({}) },
    height: { type: [Number, String], default: 360 },
    maxHeight: { type: [Number, String], default: 1200 },
    theme: { type: String, default: "light" },
    watermark: { type: String, default: "" },
    template: { type: String, default: "auto" },
    period: { type: String, default: "" },
    scope: { type: String, default: "" },
    sources: { type: Array, default: () => [] },
    warnings: { type: Array, default: () => [] },
  },
  data() {
    return {
      doc: "",
      echartsUmd: "",
      loading: true,
      fullscreen: false,
      busy: false,
      currentTheme: this.theme === "dark" ? "dark" : "light",
      contentHeight: 0,
      generatedAt: "",
      sections: [],
      activeId: "",
    };
  },
  computed: {
    minHeight() {
      const h = Number(this.height);
      return h > 0 ? h : 360;
    },
    maxPreviewHeight() {
      const h = Number(this.maxHeight);
      return h > 0 ? h : 1200;
    },
    hasRail() {
      return this.sections.length >= 2;
    },
    templateLabel() {
      return TEMPLATE_LABELS[this.template] || "";
    },
    // 内容被限高或全屏时，iframe 自己滚动；否则由宿主页面滚动
    innerScroll() {
      return this.fullscreen || this.contentHeight > this.maxPreviewHeight;
    },
    previewHeight() {
      if (this.fullscreen) return "100%";
      const h = this.contentHeight || this.minHeight;
      return Math.min(Math.max(h, this.minHeight), this.maxPreviewHeight) + "px";
    },
  },
  mounted() {
    this._alive = true;
    this._onMessage = this.onMessage.bind(this);
    this._onKeydown = e => {
      if (e.key === "Escape" && this.fullscreen) this.fullscreen = false;
    };
    this._onScroll = () => this.scheduleActive();
    window.addEventListener("message", this._onMessage);
    window.addEventListener("keydown", this._onKeydown);
    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onScroll);

    loadEchartsUmd()
      .then(umd => {
        if (!this._alive) return;
        this.echartsUmd = umd;
        this.rebuild();
        this.loading = false;
      })
      .catch(err => {
        if (!this._alive) return;
        console.error(err);
        this.echartsUmd = "";
        this.rebuild();
        this.loading = false;
      });
  },
  beforeDestroy() {
    this._alive = false;
    window.removeEventListener("message", this._onMessage);
    window.removeEventListener("keydown", this._onKeydown);
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onScroll);
    if (this._activeRaf) cancelAnimationFrame(this._activeRaf);
    this.unlockScroll();
    this.fullscreen = false;
  },
  watch: {
    fullscreen() {
      if (this.fullscreen) this.lockScroll();
      else this.unlockScroll();
      this.$nextTick(() => {
        this.post("reflow");
        this.scheduleActive();
        this.postActiveHint();
      });
    },
    html() {
      this.contentHeight = 0;
      this.sections = [];
      this.rebuild();
    },
    charts() {
      this.contentHeight = 0;
      this.sections = [];
      this.rebuild();
    },
  },
  methods: {
    buildDoc() {
      return buildHtmlReportDoc({
        html: this.html,
        charts: this.charts,
        echartsUmd: this.echartsUmd,
        options: {
          title: this.title,
          theme: this.currentTheme,
          generatedAt: this.generatedAt || formatReportTime(),
          watermark: this.watermark,
          period: this.period,
          scope: this.scope,
          sources: this.sources,
          warnings: this.warnings,
        },
      });
    },
    rebuild() {
      this.generatedAt = formatReportTime();
      this.doc = this.buildDoc();
      this.busy = false;
    },
    onMessage(e) {
      const d = e.data;
      if (!d || d.__olReport !== 1) return;
      const frame = this.$refs.frame;
      if (!frame || e.source !== frame.contentWindow) return;

      if (d.type === "height" && d.value) {
        this.contentHeight = Number(d.value) || 0;
      } else if (d.type === "sections") {
        const list = Array.isArray(d.value) ? d.value : [];
        this.sections = list;
        if (list.length && !this.activeId) this.activeId = list[0].id;
        this.scheduleActive();
      } else if (d.type === "active" && this.innerScroll) {
        if (d.value) this.activeId = d.value;
      }
    },
    post(type, value) {
      const frame = this.$refs.frame;
      if (!frame || !frame.contentWindow) return;
      try {
        frame.contentWindow.postMessage({ __olReport: 1, type, value }, "*");
      } catch (e) {
        /* ignore */
      }
    },
    postActiveHint() {
      if (this.innerScroll && this.activeId) this.post("scroll-to", this.activeId);
    },
    scheduleActive() {
      if (this._activeRaf) return;
      this._activeRaf = requestAnimationFrame(() => {
        this._activeRaf = 0;
        this.updateActiveFromScroll();
      });
    },
    updateActiveFromScroll() {
      if (this.innerScroll || !this.sections.length) return;
      const frame = this.$refs.frame;
      if (!frame) return;
      const frameTop = frame.getBoundingClientRect().top;
      const probe = 90;
      let current = this.sections[0];
      for (let i = 0; i < this.sections.length; i++) {
        if (frameTop + this.sections[i].y <= probe) current = this.sections[i];
        else break;
      }
      if (current && current.id) this.activeId = current.id;
    },
    goSection(item) {
      if (!item) return;
      this.activeId = item.id;
      if (this.innerScroll) {
        this.post("scroll-to", item.id);
        return;
      }
      const frame = this.$refs.frame;
      if (!frame) return;
      const top = frame.getBoundingClientRect().top + window.pageYOffset + item.y - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    },
    toggleTheme() {
      this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
      this.post("theme", this.currentTheme);
      this.$emit("theme-change", this.currentTheme);
    },
    enterFullscreen() {
      if (!this.fullscreen) this.fullscreen = true;
    },
    lockScroll() {
      this._prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    },
    unlockScroll() {
      if (this._prevOverflow !== undefined) {
        document.body.style.overflow = this._prevOverflow || "";
        this._prevOverflow = undefined;
      }
    },
    openNew() {
      if (this.doc) openInNewWindow(this.buildDoc());
    },
    download() {
      if (this.doc) downloadHtml(this.buildDoc(), this.title);
    },
    async print() {
      if (this.busy) return;
      this.busy = true;
      try {
        await printDoc(this.buildDoc());
      } catch (e) {
        console.error(e);
        if (this.$message) this.$message.error("打印失败：" + ((e && e.message) || e));
      } finally {
        this.busy = false;
      }
    },
    async exportAs(format) {
      if (this.busy) return;
      this.busy = true;
      const fileName = this.title || "分析报告";
      try {
        if (format === "pdf") {
          await exportReportPdf(this.buildDoc(), fileName, { width: 1240, scale: 2 });
        } else {
          await exportReportPng(this.buildDoc(), fileName, { width: 1240, scale: 2 });
        }
        if (this.$message) this.$message.success(format === "pdf" ? "PDF 已导出" : "长图已导出");
      } catch (e) {
        console.error(e);
        if (this.$message) this.$message.error("导出失败：" + ((e && e.message) || e));
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped>
.ol-html-report {
  --ol-text-1: #1f2937;
  --ol-text-3: #94a3b8;
  --ol-border: #e8edf5;
  --ol-surface: #ffffff;
  --ol-surface-2: #f6f8fc;
  --ol-primary: #4f7cff;
  width: 100%;
  border: 1px solid var(--ol-border);
  border-radius: 12px;
  background: var(--ol-surface);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 10px 28px rgba(16, 24, 40, 0.07);
}
.ol-html-report.is-fullscreen {
  position: fixed;
  inset: 14px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  max-height: none;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
}
.ol-html-report__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ol-border);
  border-radius: 12px 12px 0 0;
  background: linear-gradient(180deg, rgba(79, 124, 255, 0.05), var(--ol-surface) 60%);
}
.ol-html-report__titles {
  min-width: 0;
}
.ol-html-report__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ol-html-report__badge {
  flex: 0 0 auto;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--ol-primary);
  background: rgba(79, 124, 255, 0.1);
  border: 1px solid rgba(79, 124, 255, 0.22);
}
.ol-html-report__title {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ol-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ol-html-report__sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--ol-text-3);
}
.ol-html-report__actions {
  display: flex;
  gap: 2px;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.ol-html-report__action {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ol-text-3);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ol-html-report__action:hover {
  background: var(--ol-surface-2);
  color: var(--ol-primary);
}
.ol-html-report__action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.ol-html-report__body {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}
.ol-html-report__rail {
  flex: 0 0 172px;
  align-self: flex-start;
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  padding: 12px 8px 12px 12px;
  border-right: 1px solid var(--ol-border);
}
.ol-html-report__rail-title {
  padding: 0 8px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ol-text-3);
}
.ol-html-report__rail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 2px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.ol-html-report__rail-item:hover {
  background: var(--ol-surface-2);
  color: var(--ol-text-1);
}
.ol-html-report__rail-item.is-active {
  background: rgba(79, 124, 255, 0.1);
  color: var(--ol-primary);
  font-weight: 600;
}
.ol-html-report__rail-no {
  flex: 0 0 20px;
  height: 20px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "DIN Alternate", "SF Mono", Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: var(--ol-surface-2);
}
.ol-html-report__rail-item.is-active .ol-html-report__rail-no {
  color: #fff;
  background: linear-gradient(135deg, var(--ol-primary), #6aa1ff);
}
.ol-html-report__rail-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ol-html-report__preview {
  position: relative;
  flex: 1;
  min-width: 0;
  height: var(--ol-preview-h);
  overflow: hidden;
  cursor: pointer;
  background: var(--ol-surface-2);
  border-radius: 0 0 12px 0;
}
.ol-html-report:not(.has-rail) .ol-html-report__preview {
  border-radius: 0 0 12px 12px;
}
.ol-html-report.is-fullscreen .ol-html-report__body {
  flex: 1;
  min-height: 0;
}
.ol-html-report.is-fullscreen .ol-html-report__preview {
  flex: 1 1 auto;
  align-self: stretch;
  height: auto;
  cursor: default;
}
.ol-html-report__frame {
  width: 100%;
  height: var(--ol-preview-h);
  border: 0;
  background: #fff;
  display: block;
}
.ol-html-report.is-fullscreen .ol-html-report__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ol-html-report__loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ol-text-3);
  font-size: 12px;
}
.ol-html-report__mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.9));
  pointer-events: none;
}
.ol-html-report__cta {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--ol-primary), #6aa1ff);
  box-shadow: 0 4px 12px rgba(79, 124, 255, 0.35);
}
.ol-html-report__busy {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #fff;
  background: rgba(15, 23, 42, 0.45);
}
@media (max-width: 860px) {
  .ol-html-report__rail {
    display: none;
  }
}
</style>
