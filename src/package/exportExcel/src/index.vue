<template>
  <div>
    <img
      :src="excelIcon"
      title="导出"
      style="display: inline-block; cursor: pointer; width: 16px; height: 16px"
      @click="handleTrigger"
    />
    <el-dialog
      title="导出"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
      width="400px"
      append-to-body
    >
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px; font-size: 14px; color: #606266">文件名称</div>
        <el-input
          v-model="exportFilename"
          placeholder="请输入文件名称"
          clearable
          @keyup.enter.native="handleConfirm"
        >
          <template slot="append">
            <el-dropdown
              trigger="click"
              class="format-append-dropdown"
              @command="handleFormatChange"
            >
              <span class="format-append-trigger">
                <span>{{ exportFormat }}</span>
                <i class="el-icon-arrow-down" />
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="item in formatOptions"
                  :key="item.value"
                  :command="item.value"
                >
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-input>
      </div>
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px; font-size: 14px; color: #606266">数据范围</div>
        <el-select v-model="exportScope" style="width: 100%">
          <el-option
            v-for="item in scopeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div
        style="
          padding: 12px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 13px;
          color: #606266;
        "
      >
        <i class="el-icon-info" style="color: #909399; margin-right: 6px" />
        将导出 <b style="color: #303133">{{ exportCountText }}</b> 条数据
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { export_json_to_excel } from "../../../vendor/Export2Excel";
import excelIcon from "../../../assets/icon/excel.svg";

export default {
  name: "export-excel",
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    // 当前页选中的数据
    selection: {
      type: Array,
      default: () => [],
    },
    // 全量导出 exportUrl（全量数据模式下由父组件自行处理导出逻辑）
    exportUrl: {
      type: String,
      default: "",
    },
    columns: {
      type: Array,
      default: () => [],
    },
    filename: {
      type: String,
      default: "表格导出",
    },
    autoWidth: {
      type: Boolean,
      default: true,
    },
    // 搜索框查询条件
    formSearchData: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      excelIcon: excelIcon,
      dialogVisible: false,
      exportFilename: "xlsx",
      exportFormat: "xlsx",
      exportScope: "current",
      scopeOptions: [
        { label: "当前数据（当前页）", value: "current" },
        { label: "选中数据（当前页选中）", value: "selected" },
        { label: "全量数据（所有分页）", value: "all" },
      ],
      formatOptions: [
        { label: "xlsx", value: "xlsx" },
        { label: "csv", value: "csv" },
        // { label: "Excel 宏启用 (.xlsm)", value: "xlsm" },
        // { label: "Excel 二进制 (.xlsb)", value: "xlsb" },
        // { label: "Excel 97-2004 (.xls)", value: "xls" },
        // { label: "Excel 2003 XML (.xlml)", value: "xlml" },
        // { label: "OpenDocument (.ods)", value: "ods" },
        // { label: "Flat ODS (.fods)", value: "fods" },
        // { label: "TXT Tab 分隔 (.txt)", value: "txt" },
        // { label: "HTML 网页 (.html)", value: "html" },
        // { label: "SYLK 符号链接 (.sylk)", value: "sylk" },
        // { label: "DIF 数据交换 (.dif)", value: "dif" },
        // { label: "Lotus (.prn)", value: "prn" },
        // { label: "Ethercalc (.eth)", value: "eth" },
      ],
    };
  },
  computed: {
    exportCountText() {
      const scope = this.exportScope;
      if (scope === "current") {
        return this.data.length;
      }
      if (scope === "selected") {
        return this.selection.length;
      }
      // 全量数据数量未知，父组件自行处理
      return "全量";
    },
  },
  methods: {
    handleTrigger() {
      const columns = this.columns;
      if (!columns || columns.length === 0) {
        this.$message.warning("没有可导出的列");
        return;
      }
      this.exportFilename = this.filename;
      this.exportFormat = "xlsx";
      this.exportScope = "current";
      this.dialogVisible = true;
    },
    handleFormatChange(format) {
      this.exportFormat = format;
    },
    async handleConfirm() {
      const scope = this.exportScope;
      const name = this.exportFilename || this.filename;

      // 全量数据：交由父组件处理
      if (scope === "all") {
        this.dialogVisible = false;
        const filterConditions = await this.$getFilterConditions(
          this.formSearchData.filterConditions
        );
        if (!this.exportUrl) return this.$message.warning("请联系管理员配置导出接口");
        const res = await this.post({
          url: this.exportUrl,
          isLoading: true,
          responseType: "blob",
          data: Object.assign({
            filterConditions: filterConditions,
            exportFormat: this.exportFormat,
          }),
        });
        const mimeMap = {
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          csv: "text/csv",
        };
        const blob = new Blob([res.data], {
          type: mimeMap[this.exportFormat] || mimeMap.xlsx,
        });
        const downloadElement = document.createElement("a");
        const href = window.URL.createObjectURL(blob);
        downloadElement.href = href;
        downloadElement.download = decodeURI(name) + "." + this.exportFormat;
        document.body.appendChild(downloadElement);
        downloadElement.click(); //点击下载
        document.body.removeChild(downloadElement); //下载完成移除元素
        window.URL.revokeObjectURL(href); //释放blob对象
        return;
      }
      // 当前数据 / 选中数据
      const rows = scope === "selected" ? this.selection : this.data;
      if (!rows || rows.length === 0) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      this.dialogVisible = false;
      this.doExport(name, rows);
    },
    doExport(name, rows) {
      const columns = this.columns;

      // 展平列为叶子列，跳过 show === false 的列
      let flatColumns = [];
      let flattenColumns = function (cols) {
        cols.forEach(function (col) {
          if (col.show === false) return;
          if (col.children && col.children.length > 0) {
            flattenColumns(col.children);
          } else {
            flatColumns.push(col);
          }
        });
      };
      flattenColumns(columns);

      if (flatColumns.length === 0) {
        this.$message.warning("没有可见的列");
        return;
      }

      // 构建叶子列表头
      let header = flatColumns.map(function (col) {
        return col.alias || col.label;
      });

      // 计算多级表头最大深度
      let getMaxDepth = function (cols, depth) {
        if (depth === void 0) {
          depth = 1;
        }
        let maxDepth = depth;
        cols.forEach(function (col) {
          if (col.show === false) return;
          if (col.children && col.children.length > 0) {
            maxDepth = Math.max(maxDepth, getMaxDepth(col.children, depth + 1));
          }
        });
        return maxDepth;
      };
      let maxDepth = getMaxDepth(columns);

      // 构建多级表头数组（不含叶子层，叶子层已在 header 中）
      let multiHeader = [];
      if (maxDepth > 1) {
        for (let level = 0; level < maxDepth - 1; level++) {
          let rowCells = [];
          let traverse = function (cols, currentDepth) {
            cols.forEach(function (col) {
              if (col.show === false) return;
              if (currentDepth === level) {
                rowCells.push(col.alias || col.label);
              } else if (currentDepth < level) {
                if (col.children && col.children.length > 0) {
                  traverse(col.children, currentDepth + 1);
                }
              }
            });
          };
          traverse(columns, 0);
          multiHeader.push(rowCells);
        }
      }

      // HTML 剥离
      let stripHtml = function (str) {
        if (str === null || str === undefined) return "";
        return String(str)
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      };

      // 获取单元格值
      let getCellValue = function (row, col) {
        if (col.render && typeof col.render === "function") {
          try {
            return stripHtml(col.render(row));
          } catch (e) {
            let fallback = row[col.prop];
            return fallback !== null && fallback !== undefined ? stripHtml(String(fallback)) : "";
          }
        }
        let val = row[col.prop];
        if (val === null || val === undefined) return "";
        return val;
      };

      // 构建数据行
      let data = rows.map(function (row) {
        return flatColumns.map(function (col) {
          return getCellValue(row, col);
        });
      });

      // 调用导出
      export_json_to_excel({
        multiHeader: multiHeader,
        header: header,
        data: data,
        filename: name,
        autoWidth: this.autoWidth,
        bookType: this.exportFormat,
      });

      this.$emit("export-success");
    },
  },
};
</script>

<style scoped>
/* 文件名输入框 append 中的格式选择器（el-dropdown 触发区域） */
.format-append-dropdown {
  width: 100%;
}
::v-deep .el-input-group__append {
  padding: 0 10px;
}
.format-append-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 48px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  outline: none;
}
.format-append-trigger .el-icon-arrow-down {
  font-size: 12px;
  color: #c0c4cc;
  transition: transform 0.3s;
}
</style>

