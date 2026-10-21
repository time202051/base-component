<template>
  <div v-if="hasDetails" class="ac-evidence">
    <button type="button" class="ac-evidence__head" @click="open = !open">
      <i class="el-icon-document"></i>
      <span class="ac-evidence__label">数据依据</span>
      <span class="ac-evidence__summary">{{ summaryText }}</span>
      <i :class="open ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
    </button>

    <div v-show="open" class="ac-evidence__body">
      <div v-if="tables.length" class="ac-evidence__row">
        <span class="ac-evidence__key">数据表</span>
        <div class="ac-evidence__tags">
          <span v-for="table in tables" :key="table" class="ac-tag">{{ table }}</span>
        </div>
      </div>

      <div v-if="report && hasReportMeta" class="ac-evidence__row">
        <span class="ac-evidence__key">报告</span>
        <div class="ac-evidence__tags">
          <span v-if="report.template" class="ac-tag">{{ report.template }}</span>
          <span v-if="report.layout" class="ac-tag">{{ report.layout }}</span>
          <span v-if="report.period" class="ac-tag">{{ report.period }}</span>
          <span v-if="report.scope" class="ac-tag">{{ report.scope }}</span>
        </div>
      </div>

      <div v-if="usage && (usage.inputTokens || usage.outputTokens)" class="ac-evidence__row">
        <span class="ac-evidence__key">用量</span>
        <span class="ac-evidence__usage">
          {{ usage.model || "模型" }} · 输入 {{ Number(usage.inputTokens) || 0 }} · 输出
          {{ Number(usage.outputTokens) || 0 }}
          <template v-if="usage.elapsedMs">· 用时 {{ (usage.elapsedMs / 1000).toFixed(1) }}s</template>
        </span>
      </div>

      <div v-if="warnings.length" class="ac-evidence__warn">
        <div v-for="item in warnings" :key="item">{{ item }}</div>
      </div>

      <div v-if="queries.length" class="ac-evidence__block">
        <div class="ac-evidence__block-head">
          <span>查询 SQL · {{ queries.length }} 条</span>
          <span v-if="!sqlVisible" class="ac-evidence__link" @click="revealed = true">查看 SQL</span>
          <span v-else class="ac-evidence__link" @click="revealed = false">收起</span>
        </div>
        <div v-if="sqlVisible" class="ac-evidence__sql-list">
          <div v-for="(query, index) in queries" :key="index" class="ac-evidence__sql">
            <div class="ac-evidence__sql-bar">
              <span>#{{ index + 1 }}</span>
              <span class="ac-evidence__copy" @click="copy(query.sql)">复制</span>
            </div>
            <pre>{{ query.sql }}</pre>
          </div>
        </div>
      </div>

      <div v-if="table && table.rows && table.rows.length" class="ac-evidence__block">
        <div class="ac-evidence__block-head">
          <span>原始结果 · {{ table.rows.length }} 行</span>
        </div>
        <el-table
          class="ac-result-table"
          :data="table.rows"
          size="mini"
          border
          max-height="280"
        >
          <el-table-column
            v-for="col in table.columns"
            :key="col"
            :prop="col"
            :label="col"
            show-overflow-tooltip
          />
        </el-table>
      </div>

      <div v-if="report && report.sources && report.sources.length" class="ac-evidence__sources">
        数据来源：{{ report.sources.join("；") }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ac-evidence-card",
  props: {
    meta: { type: Object, default: null },
    steps: { type: Array, default: () => [] },
    table: { type: Object, default: null },
    usage: { type: Object, default: null },
    showSqlDefault: { type: Boolean, default: false },
  },
  data() {
    return {
      open: false,
      revealed: false,
    };
  },
  computed: {
    report() {
      return this.meta && this.meta.report ? this.meta.report : null;
    },
    queries() {
      return this.steps
        .filter(step => step && step.sql)
        .map(step => ({ id: step.id, sql: step.sql }));
    },
    tables() {
      const fromMeta = this.meta && Array.isArray(this.meta.tables) ? this.meta.tables : [];
      const fromSteps = this.steps
        .filter(step => step && step.table)
        .map(step => step.table);
      return Array.from(new Set([...fromMeta, ...fromSteps]));
    },
    warnings() {
      return this.meta && Array.isArray(this.meta.warnings) ? this.meta.warnings : [];
    },
    hasReportMeta() {
      return Boolean(
        (this.report && (this.report.template || this.report.layout || this.report.period || this.report.scope)) ||
          (this.report && this.report.sources && this.report.sources.length),
      );
    },
    hasDetails() {
      return Boolean(
        this.usage ||
          this.meta ||
          this.queries.length ||
          this.tables.length ||
          (this.table && this.table.rows && this.table.rows.length) ||
          this.warnings.length,
      );
    },
    sqlVisible() {
      return this.showSqlDefault || this.revealed;
    },
    summaryText() {
      const meta = this.meta || {};
      const parts = [];
      const queries = Number(meta.queries) || this.queries.length;
      if (queries) parts.push(queries + " 次查询");
      const rows = Number(meta.rowCount) || 0;
      if (rows) parts.push(rows.toLocaleString("zh-CN") + " 行");
      if (meta.truncated) parts.push("结果已截断");
      const elapsed = Number(meta.elapsedMs) || (this.usage && Number(this.usage.elapsedMs)) || 0;
      if (elapsed) parts.push((elapsed / 1000).toFixed(1) + "s");
      const usage = this.usage || {};
      const tokens = (Number(usage.inputTokens) || 0) + (Number(usage.outputTokens) || 0);
      if (tokens) parts.push(tokens.toLocaleString("zh-CN") + " tokens");
      return parts.length ? parts.join(" · ") : "查看查询明细";
    },
  },
  methods: {
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
</script>

<style scoped>
.ac-evidence {
  margin-top: 8px;
  border-top: 1px dashed #edf0f5;
  padding-top: 6px;
}
.ac-evidence__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 0;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 11.5px;
  line-height: 1.5;
  cursor: pointer;
  text-align: left;
}
.ac-evidence__head:hover {
  color: #4f7cff;
}
.ac-evidence__label {
  flex: 0 0 auto;
  color: #606266;
}
.ac-evidence__summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-evidence__body {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fafbfd;
  border: 1px solid #edf0f5;
}
.ac-evidence__row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11.5px;
  line-height: 1.6;
}
.ac-evidence__key {
  flex: 0 0 44px;
  color: #909399;
}
.ac-evidence__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}
.ac-evidence__usage {
  min-width: 0;
  color: #606266;
  overflow-wrap: anywhere;
}
.ac-tag {
  max-width: 100%;
  padding: 0 6px;
  border-radius: 4px;
  color: #606266;
  background: #f0f2f5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-evidence__warn {
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  color: #b88230;
  background: rgba(230, 162, 60, 0.1);
  font-size: 11.5px;
  line-height: 1.5;
}
.ac-evidence__block {
  margin-top: 6px;
}
.ac-evidence__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #606266;
  font-size: 11.5px;
}
.ac-evidence__link {
  color: #4f7cff;
  cursor: pointer;
}
.ac-evidence__sql {
  margin-bottom: 4px;
  border: 1px solid #e8edf5;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}
.ac-evidence__sql-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 8px;
  color: #909399;
  background: #f5f7fa;
  font-size: 10.5px;
}
.ac-evidence__copy {
  color: #4f7cff;
  cursor: pointer;
}
.ac-evidence__sql pre {
  margin: 0;
  padding: 6px 8px;
  max-height: 140px;
  overflow: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
}
.ac-evidence__sources {
  margin-top: 6px;
  color: #909399;
  font-size: 11px;
  line-height: 1.5;
}
.ac-result-table {
  width: 100%;
}
</style>
