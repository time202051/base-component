<template>
  <div v-if="steps.length" class="ac-trace" :class="{ 'is-live': live }">
    <button type="button" class="ac-trace__head" @click="open = !open">
      <span class="ac-trace__dot" :class="{ 'is-live': live }"></span>
      <span class="ac-trace__title">{{ live ? "正在执行" : "执行过程" }}</span>
      <span class="ac-trace__meta">{{ summaryText }}</span>
      <i :class="open ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
    </button>

    <transition name="ac-trace-fade">
      <div v-show="open" class="ac-trace__list">
        <div
          v-for="group in groups"
          :key="group.key"
          class="ac-step"
          :class="'is-' + group.status"
        >
          <span class="ac-step__dot">
            <i :class="stepIcon(group)"></i>
          </span>
          <div class="ac-step__body">
            <div
              class="ac-step__line"
              :class="{ 'is-clickable': group.count > 1 }"
              @click="toggleGroup(group)"
            >
              <span class="ac-step__label" :title="group.name">{{ group.label }}</span>
              <span v-if="group.count > 1" class="ac-step__count">
                · {{ group.count }} {{ group.unit }}
              </span>
              <span v-if="group.detail" class="ac-step__detail">{{ group.detail }}</span>
              <span v-if="group.durationMs" class="ac-step__time">
                {{ formatDuration(group.durationMs) }}
              </span>
              <i
                v-if="group.count > 1"
                class="ac-step__expand"
                :class="isExpanded(group) ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
              ></i>
            </div>

            <template v-if="group.count === 1">
              <div
                v-if="group.steps[0].sql"
                class="ac-step__preview"
                :title="group.steps[0].sql"
              >
                {{ sqlPreview(group.steps[0].sql) }}
              </div>
              <div v-if="showSql && group.steps[0].sql" class="ac-step__sql">
                <div class="ac-step__sql-bar">
                  <span>SQL</span>
                  <span class="ac-step__copy" @click.stop="copy(group.steps[0].sql)">复制</span>
                </div>
                <pre>{{ group.steps[0].sql }}</pre>
              </div>
              <div v-if="group.steps[0].error" class="ac-step__error">
                {{ group.steps[0].error }}
              </div>
            </template>

            <div v-else-if="isExpanded(group)" class="ac-step__children">
              <div
                v-for="(step, index) in group.steps"
                :key="step.id || index"
                class="ac-child"
              >
                <span class="ac-child__index">#{{ index + 1 }}</span>
                <div class="ac-child__body">
                  <div class="ac-child__line">
                    <span class="ac-child__detail">{{ childDetail(step) }}</span>
                    <span v-if="step.durationMs" class="ac-child__time">
                      {{ formatDuration(step.durationMs) }}
                    </span>
                  </div>
                  <div v-if="step.sql" class="ac-step__preview" :title="step.sql">
                    {{ sqlPreview(step.sql) }}
                  </div>
                  <div v-if="showSql && step.sql" class="ac-step__sql">
                    <div class="ac-step__sql-bar">
                      <span>SQL</span>
                      <span class="ac-step__copy" @click.stop="copy(step.sql)">复制</span>
                    </div>
                    <pre>{{ step.sql }}</pre>
                  </div>
                  <div v-if="step.error" class="ac-step__error">{{ step.error }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { sqlPreview, toolLabel, toolUnit } from "../toolMeta.js";

const GROUPABLE = new Set(["get_table_schema", "run_sql"]);

export default {
  name: "ac-trace-timeline",
  props: {
    steps: { type: Array, default: () => [] },
    live: { type: Boolean, default: false },
    showSql: { type: Boolean, default: false },
  },
  data() {
    return {
      open: this.live,
      expanded: {},
    };
  },
  computed: {
    hasError() {
      return this.steps.some(step => step.status === "error");
    },
    stats() {
      const schemaTables = new Set();
      let queryCount = 0;
      let rowCount = 0;
      let durationMs = 0;
      let reportCount = 0;
      this.steps.forEach(step => {
        durationMs += Number(step.durationMs) || 0;
        if (step.name === "get_table_schema") {
          collectTables(step).forEach(table => schemaTables.add(table));
        } else if (step.name === "run_sql") {
          queryCount += 1;
          rowCount += Number(step.rowCount) || 0;
        } else if (String(step.name || "").indexOf("render") === 0) {
          reportCount += 1;
        }
      });
      return {
        tableCount: schemaTables.size,
        queryCount,
        rowCount,
        durationMs,
        reportCount,
      };
    },
    summaryText() {
      if (this.live) {
        const running =
          [...this.steps].reverse().find(step => step.status === "running") ||
          this.steps[this.steps.length - 1];
        if (running) {
          const label = running.label || toolLabel(running.name);
          const detail = running.detail || "";
          return detail ? `正在${label} · ${detail}` : `正在${label}`;
        }
      }
      const stats = this.stats;
      const parts = [];
      if (stats.tableCount) parts.push(`${stats.tableCount} 张表`);
      if (stats.queryCount) parts.push(`${stats.queryCount} 次查询`);
      if (stats.rowCount) parts.push(`${stats.rowCount.toLocaleString("zh-CN")} 行`);
      if (stats.durationMs) parts.push(this.formatDuration(stats.durationMs));
      if (stats.reportCount) parts.push(`${stats.reportCount} 个报告`);
      return parts.length ? parts.join(" · ") : `${this.steps.length} 步`;
    },
    groups() {
      const list = [];
      this.steps.forEach(step => {
        const last = list[list.length - 1];
        if (last && GROUPABLE.has(step.name) && last.name === step.name) {
          last.steps.push(step);
        } else {
          list.push({ name: step.name, steps: [step] });
        }
      });
      return list.map((item, index) => {
        const steps = item.steps;
        const tables = uniqueTables(steps);
        const rowCount = steps.reduce((sum, step) => sum + (Number(step.rowCount) || 0), 0);
        const durationMs = steps.reduce((sum, step) => sum + (Number(step.durationMs) || 0), 0);
        let detail = "";
        if (item.name === "get_table_schema") {
          if (tables.length > 2) {
            detail = `${tables.slice(0, 2).join("、")} 等 ${tables.length} 张`;
          } else {
            detail = tables.join("、");
          }
        } else if (item.name === "run_sql") {
          detail = rowCount ? `${rowCount.toLocaleString("zh-CN")} 行` : "";
        } else {
          detail = steps[0].detail || "";
        }
        return {
          key: `${index}-${item.name}`,
          name: item.name,
          label: toolLabel(item.name),
          unit: toolUnit(item.name),
          steps,
          count: steps.length,
          tables,
          rowCount,
          durationMs,
          detail,
          status: groupStatus(steps),
        };
      });
    },
  },
  watch: {
    live(value) {
      if (value) this.open = true;
      else if (!this.hasError) this.open = false;
    },
  },
  methods: {
    isExpanded(group) {
      return !!this.expanded[group.key];
    },
    toggleGroup(group) {
      if (!group || group.count <= 1) return;
      this.$set(this.expanded, group.key, !this.expanded[group.key]);
    },
    stepIcon(group) {
      if (group.status === "error") return "el-icon-close";
      if (group.status === "cancelled") return "el-icon-remove-outline";
      if (group.status === "success") return "el-icon-check";
      return "el-icon-loading";
    },
    childDetail(step) {
      if (step.name === "run_sql") {
        const rows = Number(step.rowCount) || 0;
        const tables = collectTables(step).join("、");
        const parts = [];
        if (rows) parts.push(`${rows.toLocaleString("zh-CN")} 行`);
        if (step.truncated) parts.push("已截断");
        if (tables) parts.push(tables);
        return parts.join(" · ") || (step.status === "success" ? "已执行" : "执行中");
      }
      if (step.name === "get_table_schema") {
        const table = step.table || collectTables(step)[0] || "";
        const columns = Number(step.columns) || 0;
        return `${table}${columns ? " · " + columns + " 列" : ""}`;
      }
      if (step.name === "list_tables") {
        return step.detail || `${Number(step.tableCount) || 0} 张表`;
      }
      return step.detail || step.label || toolLabel(step.name);
    },
    sqlPreview(sql) {
      return sqlPreview(sql, 110);
    },
    formatDuration(ms) {
      const value = Number(ms) || 0;
      if (value < 1000) return value + "ms";
      return (value / 1000).toFixed(1) + "s";
    },
    copy(text) {
      if (!text) return;
      const done = () => this.$message && this.$message.success("SQL 已复制");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {});
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    },
  },
};

function collectTables(step) {
  const tables = [];
  if (step && step.table) tables.push(step.table);
  if (step && Array.isArray(step.tables)) tables.push(...step.tables);
  if (step && step.name === "get_table_schema" && step.detail) {
    const fromDetail = String(step.detail).split("·")[0].trim();
    if (fromDetail) tables.push(fromDetail);
  }
  return Array.from(new Set(tables.filter(Boolean).map(item => String(item).trim())));
}

function uniqueTables(steps) {
  const set = new Set();
  steps.forEach(step => collectTables(step).forEach(table => set.add(table)));
  return Array.from(set);
}

function groupStatus(steps) {
  if (steps.some(step => step.status === "error")) return "error";
  if (steps.some(step => step.status === "running")) return "running";
  if (steps.every(step => step.status === "cancelled")) return "cancelled";
  return "success";
}
</script>

<style scoped>
.ac-trace {
  margin-bottom: 10px;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  background: #fafbfd;
  overflow: hidden;
}
.ac-trace__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  text-align: left;
}
.ac-trace__head:hover {
  background: #f4f6fa;
}
.ac-trace__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67c23a;
  flex: 0 0 auto;
}
.ac-trace__dot.is-live {
  background: #4f7cff;
  box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.15);
  animation: ac-trace-pulse 1.4s infinite ease-in-out;
}
.ac-trace__title {
  font-weight: 600;
  color: #303133;
  flex: 0 0 auto;
}
.ac-trace__meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #909399;
}
.ac-trace__list {
  padding: 2px 10px 10px 12px;
  border-top: 1px dashed #edf0f5;
}
.ac-step {
  position: relative;
  display: flex;
  gap: 8px;
  padding-top: 8px;
}
.ac-step::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 22px;
  bottom: -8px;
  width: 1px;
  background: #e7ebf2;
}
.ac-step:last-child::before {
  display: none;
}
.ac-step__dot {
  position: relative;
  z-index: 1;
  width: 15px;
  height: 15px;
  margin-top: 2px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: #fff;
  background: #c0c4cc;
  flex: 0 0 auto;
}
.ac-step.is-success .ac-step__dot {
  background: #67c23a;
}
.ac-step.is-error .ac-step__dot {
  background: #f56c6c;
}
.ac-step.is-cancelled .ac-step__dot {
  background: #e6a23c;
}
.ac-step.is-running .ac-step__dot {
  background: #4f7cff;
}
.ac-step__body {
  flex: 1;
  min-width: 0;
}
.ac-step__line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.ac-step__line.is-clickable {
  cursor: pointer;
}
.ac-step__line.is-clickable:hover .ac-step__label {
  color: #4f7cff;
}
.ac-step__label {
  color: #303133;
  font-size: 12px;
  font-weight: 500;
  flex: 0 0 auto;
}
.ac-step__count {
  color: #4f7cff;
  font-size: 11.5px;
  flex: 0 0 auto;
}
.ac-step__detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #909399;
  font-size: 11.5px;
}
.ac-step__time {
  margin-left: auto;
  color: #b1b6bf;
  font-size: 11px;
  flex: 0 0 auto;
}
.ac-step__expand {
  color: #b1b6bf;
  font-size: 11px;
  flex: 0 0 auto;
}
.ac-step__error {
  margin-top: 3px;
  color: #f56c6c;
  font-size: 11.5px;
  line-height: 1.5;
  word-break: break-all;
}
.ac-step__preview {
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #a0a6b1;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 10.5px;
  line-height: 1.5;
}
.ac-step__children {
  margin-top: 5px;
  padding: 5px 0 0 7px;
  border-left: 2px solid #edf0f5;
}
.ac-child {
  display: flex;
  gap: 6px;
  padding: 3px 0;
  min-width: 0;
}
.ac-child__index {
  flex: 0 0 22px;
  color: #b1b6bf;
  font-size: 10.5px;
  line-height: 1.6;
}
.ac-child__body {
  flex: 1;
  min-width: 0;
}
.ac-child__line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.ac-child__detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #606266;
  font-size: 11.5px;
}
.ac-child__time {
  margin-left: auto;
  color: #b1b6bf;
  font-size: 10.5px;
  flex: 0 0 auto;
}
.ac-step__sql {
  margin-top: 5px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8edf5;
  background: #fff;
}
.ac-step__sql-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  color: #909399;
  background: #f5f7fa;
  font-size: 10.5px;
}
.ac-step__copy {
  cursor: pointer;
  color: #4f7cff;
}
.ac-step__sql pre {
  margin: 0;
  padding: 7px 8px;
  max-height: 150px;
  overflow: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11.5px;
  line-height: 1.55;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
}
.ac-trace-fade-enter-active,
.ac-trace-fade-leave-active {
  transition: opacity 0.15s ease;
}
.ac-trace-fade-enter,
.ac-trace-fade-leave-to {
  opacity: 0;
}
@keyframes ac-trace-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
</style>
