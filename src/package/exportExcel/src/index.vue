<template>
  <div>
    <img
      :src="excelIcon"
      title="导出Excel"
      style="display: inline-block; cursor: pointer; width: 16px; height: 16px"
      @click="handleTrigger"
    />
    <el-dialog
      title="导出Excel"
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
          <template slot="append">.{{ exportFormat }}</template>
        </el-input>
      </div>
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px; font-size: 14px; color: #606266">文件格式</div>
        <el-select v-model="exportFormat" style="width: 100%">
          <el-option
            v-for="item in formatOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div style="padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 13px; color: #606266">
        <i class="el-icon-info" style="color: #909399; margin-right: 6px" />
        将导出 <b style="color: #303133">{{ data.length }}</b> 条数据
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
  },
  data() {
    return {
      excelIcon: excelIcon,
      dialogVisible: false,
      exportFilename: "",
      exportFormat: "xlsx",
      formatOptions: [
        { label: "Excel 2007+ (.xlsx)", value: "xlsx" },
        { label: "Excel 97-2004 (.xls)", value: "xls" },
        { label: "CSV 逗号分隔 (.csv)", value: "csv" },
        { label: "OpenDocument (.ods)", value: "ods" },
      ],
    };
  },
  methods: {
    handleTrigger() {
      var rows = this.data;
      if (!rows || rows.length === 0) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      var columns = this.columns;
      if (!columns || columns.length === 0) {
        this.$message.warning("没有可导出的列");
        return;
      }
      this.exportFilename = this.filename;
      this.exportFormat = "xlsx";
      this.dialogVisible = true;
    },
    handleConfirm() {
      this.dialogVisible = false;
      this.doExport(this.exportFilename || this.filename);
    },
    doExport(name) {
      var rows = this.data;
      var columns = this.columns;

      // 展平列为叶子列，跳过 show === false 的列
      var flatColumns = [];
      var flattenColumns = function (cols) {
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
      var header = flatColumns.map(function (col) {
        return col.alias || col.label;
      });

      // 计算多级表头最大深度
      var getMaxDepth = function (cols, depth) {
        if (depth === void 0) {
          depth = 1;
        }
        var maxDepth = depth;
        cols.forEach(function (col) {
          if (col.show === false) return;
          if (col.children && col.children.length > 0) {
            maxDepth = Math.max(maxDepth, getMaxDepth(col.children, depth + 1));
          }
        });
        return maxDepth;
      };
      var maxDepth = getMaxDepth(columns);

      // 构建多级表头数组（不含叶子层，叶子层已在 header 中）
      var multiHeader = [];
      if (maxDepth > 1) {
        for (var level = 0; level < maxDepth - 1; level++) {
          var rowCells = [];
          var traverse = function (cols, currentDepth) {
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
      var stripHtml = function (str) {
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
      var getCellValue = function (row, col) {
        if (col.render && typeof col.render === "function") {
          try {
            return stripHtml(col.render(row));
          } catch (e) {
            var fallback = row[col.prop];
            return fallback !== null && fallback !== undefined ? stripHtml(String(fallback)) : "";
          }
        }
        var val = row[col.prop];
        if (val === null || val === undefined) return "";
        return val;
      };

      // 构建数据行
      var data = rows.map(function (row) {
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
