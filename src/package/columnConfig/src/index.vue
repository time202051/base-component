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
      size="mini"
      border
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
      <el-table-column label="序号" width="70" align="center">
        <template #default="{ $index }">
          <span
            v-if="editIndex !== $index"
            class="index-text"
            @dblclick="startEditIndex($index)"
          >{{ $index + 1 }}</span>
          <el-input
            v-else
            ref="indexInput"
            v-model="editValue"
            size="mini"
            class="index-input"
            @blur="endEditIndex"
            @keyup.enter="endEditIndex"
            @keyup.esc="cancelEditIndex"
          />
        </template>
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
          <el-checkbox v-model="row.show" size="mini" />
        </template>
      </el-table-column>

      <!-- 固定列 -->
      <el-table-column label="固定" width="70" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row._fixed" size="mini" @change="(v) => { row.fixed = v ? 'left' : false; }" />
        </template>
      </el-table-column>

      <!-- 别名 -->
      <el-table-column label="别名" min-width="130">
        <template #default="{ row }">
          <el-input v-model="row._alias" clearable size="mini" placeholder="留空使用原标签" />
        </template>
      </el-table-column>

      <!-- 可用角色 -->
      <el-table-column v-if="effectiveShowRoleConfig" label="可用角色" min-width="180">
        <template #default="{ row }">
          <el-select v-model="row._roleIds" multiple clearable size="mini" style="width: 100%">
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
      editIndex: -1,
      editingIndex: -1,
      editValue: "",
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

    startEditIndex(index) {
      this.editingIndex = index;
      this.editIndex = index;
      this.editValue = String(index + 1);
      this.$nextTick(() => {
        const input = this.$refs.indexInput;
        if (input) {
          const el = Array.isArray(input) ? input[0] : input;
          el && el.$el && el.$el.querySelector("input") && el.$el.querySelector("input").select();
        }
      });
    },

    endEditIndex() {
      if (this.editingIndex < 0) return;

      const newIndex = parseInt(this.editValue, 10);
      if (isNaN(newIndex) || newIndex < 1 || newIndex > this.tableData.length) {
        this.cancelEditIndex();
        return;
      }

      this.moveRow(this.editingIndex, newIndex - 1);
      this.editIndex = -1;
      this.editingIndex = -1;
      this.editValue = "";
    },

    cancelEditIndex() {
      this.editIndex = -1;
      this.editingIndex = -1;
      this.editValue = "";
    },

    moveRow(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;

      const moved = this.tableData.splice(fromIndex, 1)[0];
      this.tableData.splice(toIndex, 0, moved);
    },

    initSortable() {
      this.destroySortable();
      const table = this.$refs.dragTable;
      if (!table) return;
      const tbody = table.$el.querySelector(".el-table__body-wrapper tbody");
      if (!tbody) return;

      this.sortable = Sortable.create(tbody, {
        animation: 200,
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",
        handle: ".drag-handle:not(.drag-disabled)",
        forceFallback: true,
        fallbackClass: "sortable-fallback",
        onStart: (evt) => {
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
          evt.item.style.transform = "scale(1.02)";
          evt.item.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        },
        onEnd: (evt) => {
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          evt.item.style.transform = "";
          evt.item.style.boxShadow = "";
          if (evt.oldIndex !== evt.newIndex) {
            const moved = this.tableData.splice(evt.oldIndex, 1)[0];
            this.tableData.splice(evt.newIndex, 0, moved);
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

.index-text {
  cursor: pointer;
}
.index-text:hover {
  color: var(--color-primary, #409eff);
}
.index-input {
  width: 60px;
  text-align: center;
}

.drag-handle {
  cursor: grab;
  color: #909399;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.25s;
  &:hover {
    color: var(--color-primary, #409eff);
    background-color: #f0f9ff;
    transform: scale(1.1);
  }
}
.drag-disabled {
  opacity: 0.3;
  cursor: not-allowed !important;
}

.sortable-ghost {
  opacity: 0.6;
  background: #e6f7ff !important;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3) !important;
}
.sortable-chosen {
  background: #f0f9ff !important;
  box-shadow: 0 4px 16px rgba(0, 120, 255, 0.2) !important;
}
.sortable-drag {
  opacity: 0.9;
  z-index: 1999 !important;
  transform: scale(1.02) !important;
}
.sortable-fallback {
  display: table-row !important;
}

/* 防止拖拽时触发内部元素事件 */
.sortable-chosen .el-checkbox,
.sortable-chosen .el-input,
.sortable-chosen .el-select {
  pointer-events: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
