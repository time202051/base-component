<template>
  <el-dialog
    title="列配置"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    :before-close="handleClose"
    top="5vh"
    width="820px"
    append-to-body
    @open="onDialogOpen"
  >
    <el-table
      ref="dragTable"
      :data="tableData"
      row-key="prop"
      max-height="500"
      style="width: 100%"
    >
      <!-- 拖拽排序 -->
      <el-table-column width="50" align="center">
        <template #default="{ row }">
          <i
            class="el-icon-rank drag-handle"
            :class="{ 'drag-disabled': row.fixed }"
          />
        </template>
      </el-table-column>

      <!-- 序号 -->
      <el-table-column label="序号" width="60" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>

      <!-- 字段名 -->
      <el-table-column label="字段" min-width="130">
        <template #default="{ row }">
          <div class="col-field-name">{{ row.label }}</div>
          <div class="col-field-prop">{{ row.prop }}</div>
        </template>
      </el-table-column>

      <!-- 显示 -->
      <el-table-column label="显示" width="70" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row.show" />
        </template>
      </el-table-column>

      <!-- 固定列 -->
      <el-table-column label="固定" width="70" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row._fixed" @change="(v) => { row.fixed = v ? 'left' : false; }" />
        </template>
      </el-table-column>

      <!-- 别名 -->
      <el-table-column label="别名" min-width="130">
        <template #default="{ row }">
          <el-input v-model="row._alias" clearable size="small" placeholder="留空使用原标签" />
        </template>
      </el-table-column>

      <!-- 可用角色 -->
      <el-table-column v-if="effectiveShowRoleConfig" label="可用角色" min-width="180">
        <template #default="{ row }">
          <el-select v-model="row._roleIds" multiple clearable size="small" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import Sortable from "sortablejs";

export default {
  name: "columnConfig",

  props: {
    columns: { type: Array, default: () => [] },
    visible: { type: Boolean, default: false },
    pageKey: { type: String, default: "" },
    menuId: { type: [String, Number], default: "" },
    showRoleConfig: { type: Boolean, default: undefined },
    loadApi: { type: String, default: "/api/app/user-field-config/config" },
    saveApi: { type: String, default: "/api/app/user-field-config/save-config" },
  },

  data() {
    return {
      dialogVisible: false,
      tableData: [],
      sortable: null,
      roleList: [],
    };
  },

  computed: {
    effectiveShowRoleConfig() {
      if (this.showRoleConfig !== undefined) return this.showRoleConfig;
      return true;
    },
  },

  watch: {
    visible: {
      immediate: true,
      handler(val) { this.dialogVisible = val; },
    },
    dialogVisible(val) {
      this.$emit("update:visible", val);
    },
  },

  methods: {
    async onDialogOpen() {
      this.$emit("open", this.columns);

      this.tableData = (this.columns || []).map((col) => ({
        ...col,
        _alias: col.alias || col.label || "",
        _fixed: !!col.fixed,
        _roleIds: col.roleIds || [],
      }));

      await Promise.all([
        this.loadFromApi(),
        this.effectiveShowRoleConfig ? this.loadRoles() : Promise.resolve(),
      ]);

      this.$nextTick(() => this.initSortable());
    },

    async loadRoles() {
      if (typeof this.get !== "function") return;
      try {
        const res = await this.get({ url: "/api/app/identity-role/list" });
        const items = (res && res.result) || [];
        if (Array.isArray(items)) {
          this.roleList = items.map((item) => ({
            id: item.id,
            name: item.description ? `${item.name}（${item.description}）` : item.name,
          }));
        }
      } catch (err) {
        console.warn("[ol-column-config] 加载角色列表失败:", err);
      }
    },

    async loadFromApi() {
      if (typeof this.get !== "function") return;

      const pageKey = this.pageKey || (this.$route && this.$route.path) || "";
      const menuId = this.resolveMenuId();
      if (!menuId) return;

      try {
        const res = await this.get({
          url: this.loadApi,
          data: { pageKey, sysMenuId: menuId },
        });
        const fields = (res && res.result && res.result.fields) || [];
        if (!fields.length) return;

        const fieldMap = {};
        fields.forEach((f) => { fieldMap[f.fieldName] = f; });

        this.tableData = this.tableData.map((row) => {
          const f = fieldMap[row.prop];
          if (!f) return row;
          return {
            ...row,
            label: f.displayName || row.label,
            _alias: f.alias || f.displayName || row.label,
            show: f.isVisible !== false,
            _fixed: !!f.isFixed,
            fixed: f.isFixed || false,
            _roleIds: f.roleIds || [],
            roleIds: f.roleIds || [],
            enumName: f.enumName || row.enumName,
          };
        });
      } catch (err) {
        console.warn("[ol-column-config] 加载列配置失败:", err);
      }
    },

    async handleSave() {
      const all = this.tableData.map((row) => ({
        ...row,
        alias: row._alias || row.label || "",
        fixed: row._fixed ? "left" : false,
        roleIds: row._roleIds || [],
      }));
      all.forEach((r) => {
        delete r._alias;
        delete r._fixed;
        delete r._roleIds;
      });

      // API 保存全部字段，emit 也全部（show 标记可见性）
      await this.saveToApi(all);
      this.$emit("save", all);
      this.dialogVisible = false;
    },

    async saveToApi(columns) {
      if (typeof this.post !== "function") return;

      const pageKey = this.pageKey || (this.$route && this.$route.path) || "";
      const menuId = this.resolveMenuId();
      if (!menuId) return;

      try {
        const fields = columns.map((col) => ({
          fieldName: col.prop,
          displayName: col.alias || col.label,
          alias: col.alias || col.label,
          isVisible: col.show !== false,
          isFixed: !!col.fixed,
          roleIds: col.roleIds || [],
          ...(col.enumName ? { enumName: col.enumName } : {}),
        }));
        await this.post({
          url: this.saveApi,
          data: { pageKey, fields, sysMenuId: menuId },
        });
        this.$message && this.$message.success("列配置保存成功");
      } catch (err) {
        console.warn("[ol-column-config] 保存列配置失败:", err);
      }
    },

    resolveMenuId() {
      if (this.menuId) return this.menuId;
      try {
        const wms = JSON.parse(localStorage.getItem("wms") || "{}");
        const menus = wms.SET_MENUS;
        if (!menus || !this.$route) return "";
        const find = (arr) => {
          for (const item of arr) {
            if (item.path === this.$route.path) return item;
            if (item.child && item.child.length && item.type !== 1) {
              const found = find(item.child);
              if (found) return found;
            }
          }
          return null;
        };
        const m = find(menus);
        return (m && m.id) || "";
      } catch {
        return "";
      }
    },

    handleClose() {
      this.dialogVisible = false;
    },

    initSortable() {
      this.destroySortable();
      const table = this.$refs.dragTable;
      if (!table) return;
      const tbody = table.$el.querySelector(".el-table__body-wrapper tbody");
      if (!tbody) return;

      this.sortable = Sortable.create(tbody, {
        animation: 150,
        handle: ".drag-handle:not(.drag-disabled)",
        ghostClass: "sortable-ghost",
        onEnd: ({ oldIndex, newIndex }) => {
          if (oldIndex !== newIndex) {
            const moved = this.tableData.splice(oldIndex, 1)[0];
            this.tableData.splice(newIndex, 0, moved);
          }
        },
      });
    },

    destroySortable() {
      if (this.sortable) {
        this.sortable.destroy();
        this.sortable = null;
      }
    },
  },

  beforeDestroy() {
    this.destroySortable();
  },
};
</script>

<style lang="scss" scoped>
.col-field-name {
  display: block;
  font-size: 13px;
}
.col-field-prop {
  display: block;
  font-size: 11px;
  color: #909399;
}

.drag-handle {
  cursor: grab;
  color: #909399;
  font-size: 16px;
  &:hover { color: #409eff; }
}
.drag-disabled {
  opacity: 0.3;
  cursor: not-allowed !important;
}

.sortable-ghost {
  opacity: 0.4;
  background: #f0f9ff !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
