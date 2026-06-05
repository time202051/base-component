<template>
  <el-dialog
    title="实体变更记录"
    :visible.sync="dialogVisible"
    width="70%"
    top="5vh"
    append-to-body
    :close-on-click-modal="false"
  >
    <ol-table
      ref="table"
      :url="url"
      :table-data="tableData"
      :paginations="paginations"
      :btnlist="[]"
      @handleSizeChange="(v) => { paginations.limit = v; paginations.page = 1; fetch(); }"
      @handleindexChange="(v) => { paginations.page = v; fetch(); }"
    >
      <template #changeInfo="{ row }">
        <el-popover placement="bottom" trigger="click" width="420" popper-class="ecr-popover">
          <el-table :data="row.customPropertyChanges || []" border size="small" max-height="280">
            <el-table-column prop="propertyName" label="字段" width="120" />
            <el-table-column prop="originalValue" label="原数据" />
            <el-table-column prop="newValue" label="新数据" />
          </el-table>
          <span slot="reference" class="ecr-link">查看</span>
        </el-popover>
      </template>
    </ol-table>

    <div slot="footer">
      <el-button @click="dialogVisible = false">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import OlTable from "../../../table/index.js";

const SWAGGER_URL = "/api/app/audit-logging/entity-change-pages";

export default {
  name: "EntityChangeRecord",

  components: { OlTable },

  props: {
    visible: Boolean,
    selectedRows: { type: Array, default: () => [] },
    pageParams: { type: Object, default: () => ({ page: "Page", limit: "MaxResultCount" }) },
  },

  data() {
    return {
      url: SWAGGER_URL,
      dialogVisible: false,
      paginations: { page: 1, limit: 20, total: 0, pagetionShow: true },
      tableData: {
        loading: false,
        rows: [],
        columns: [
          { prop: "changeInfo", label: "变更详情", show: true, fixed: "right", renderSlot: true, minWidth: "" },
        ],
        options: { selection: false, index: false, headTool: false, refreshBtn: false, downloadBtn: false },
      },
    };
  },

  watch: {
    visible: {
      immediate: true,
      handler(v) {
        this.dialogVisible = v;
        if (v) this.$nextTick(() => this.fetch());
      },
    },
    dialogVisible(v) { this.$emit("update:visible", v); },
  },

  methods: {
    async fetch() {
      if (typeof this.post !== "function" || !this.selectedRows.length) return;
      const p = this.pageParams || {};

      this.tableData.loading = true;
      try {
        const res = await this.post({
          url: SWAGGER_URL,
          data: {
            FilterConditions: [
              { key: "EntityId", values: this.selectedRows.map((r) => r.id), compare: "in" },
            ],
            [p.page || "Page"]: this.paginations.page,
            [p.limit || "MaxResultCount"]: this.paginations.limit,
          },
        });
        this.tableData.rows = (res && res.result && res.result.items) || [];
        this.paginations.total = (res && res.result && res.result.totalCount) || 0;
      } catch (err) {
        console.warn("[EntityChangeRecord] 请求失败:", err);
      } finally {
        this.tableData.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.ecr-link { color: #1682e6; cursor: pointer; }
</style>

<style lang="scss">
.ecr-popover {
  .el-table td { padding: 0; .cell { line-height: 28px; font-size: 12px; } }
  .el-table th { padding: 0; background: #f5f7fa; .cell { line-height: 28px; font-size: 12px; } }
}
</style>
