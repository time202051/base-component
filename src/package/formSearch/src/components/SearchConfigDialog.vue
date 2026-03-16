<template>
  <el-dialog
    title="搜索条件配置"
    :visible.sync="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="search-config-container">
      <div class="config-header">
        <el-button type="primary" size="small" @click="handleAdd">
          <i class="el-icon-plus" />
          添加条件
        </el-button>
        <el-button type="success" size="small" @click="handleSave">
          <i class="el-icon-check" />
          保存配置
        </el-button>
      </div>

      <el-table
        :data="configList"
        border
        stripe
        style="width: 100%; margin-top: 10px"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="排序" width="80" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              icon="el-icon-top"
              :disabled="scope.$index === 0"
              @click="handleMoveUp(scope.$index)"
            />
            <el-button
              type="text"
              icon="el-icon-bottom"
              :disabled="scope.$index === configList.length - 1"
              @click="handleMoveDown(scope.$index)"
            />
          </template>
        </el-table-column>

        <el-table-column label="字段名称" prop="label" width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.label" size="small" placeholder="请输入字段名称" />
          </template>
        </el-table-column>

        <el-table-column label="字段值" prop="value" width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.value" size="small" placeholder="请输入字段值" disabled />
          </template>
        </el-table-column>

        <el-table-column label="输入类型" prop="inputType" width="150">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.inputType"
              size="small"
              placeholder="请选择类型"
              @change="handleTypeChange(scope.row)"
            >
              <el-option label="文本输入" value="text" />
              <el-option label="数字输入" value="number" />
              <el-option label="下拉选择" value="select" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="选项配置" min-width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.inputType === 'select'">
              <el-button type="text" size="small" @click="handleConfigOptions(scope.$index)">
                配置选项
              </el-button>
            </div>
            <div v-else class="gray-text">无需配置</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              icon="el-icon-delete"
              style="color: #f56c6c"
              @click="handleDelete(scope.$index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <slot name="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </slot>

    <el-dialog title="配置选项" :visible.sync="optionsDialogVisible" width="700px" append-to-body>
      <el-form :model="currentOptionConfig" label-width="100px" size="small">
        <el-form-item label="数据来源">
          <el-radio-group v-model="currentOptionConfig.sourceType">
            <el-radio label="manual">手动配置</el-radio>
            <el-radio label="dict">本地字典</el-radio>
            <el-radio label="api">接口获取</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'dict'" label="字典Key">
          <el-select
            v-model="currentOptionConfig.dictKey"
            filterable
            remote
            reserve-keyword
            placeholder="请输入字典Key，如：orderTypeEnum"
            :remote-method="remoteDictQuery"
            :loading="dictLoading"
            style="width: 100%"
            @change="handleDictKeyChange"
          >
            <el-option
              v-for="dict in allDictList"
              :key="dict.key"
              :label="dict.label"
              :value="dict.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="接口地址">
          <el-input
            v-model="currentOptionConfig.apiUrl"
            placeholder="请输入接口地址，如：/api/dict/list"
          />
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="值字段">
          <el-input v-model="currentOptionConfig.valueField" placeholder="如：id" />
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="文本字段">
          <el-input v-model="currentOptionConfig.labelField" placeholder="如：name" />
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'manual'" label="选项列表">
          <div class="options-config">
            <div
              v-for="(option, index) in currentOptionConfig.options"
              :key="index"
              class="option-item"
            >
              <el-input
                v-model="option.value"
                size="small"
                placeholder="文本"
                style="width: 150px"
              />
              <el-input
                v-model="option.key"
                size="small"
                placeholder="值"
                style="width: 150px; margin-left: 10px"
              />
              <el-button
                type="text"
                icon="el-icon-delete"
                style="color: #f56c6c; margin-left: 10px"
                @click="handleDeleteOption(index)"
              />
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              style="width: 100%; margin-top: 10px"
              @click="handleAddOption"
            >
              添加选项
            </el-button>
          </div>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'dict'" label="预览">
          <div class="preview-box">
            <el-tag v-for="(item, index) in previewOptions" :key="index" style="margin: 5px">
              {{ item.value }} ({{ item.key }})
            </el-tag>
            <el-empty
              v-if="!previewOptions || previewOptions.length === 0"
              description="暂无数据"
              :image-size="60"
            />
          </div>
        </el-form-item>
      </el-form>
      <slot name="footer">
        <el-button @click="optionsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveOptions">确定</el-button>
      </slot>
    </el-dialog>
  </el-dialog>
</template>

<script>
export default {
  name: "SearchConfigDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    tableSearch: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      dialogVisible: false,
      configList: [],
      optionsDialogVisible: false,
      currentEditIndex: -1,
      currentOptionConfig: {
        sourceType: "manual",
        dictKey: "",
        apiUrl: "",
        valueField: "id",
        labelField: "name",
        options: [],
      },
      previewOptions: [],
      allDictList: [],
      dictLoading: false,
      dictQuery: "",
    };
  },
  watch: {
    visible: {
      handler(newVal) {
        this.dialogVisible = newVal;
        if (newVal) {
          this.configList = JSON.parse(JSON.stringify(this.tableSearch));
          this.loadAllDictList();
        }
      },
      immediate: true,
    },
    dialogVisible(newVal) {
      this.$emit("update:visible", newVal);
    },
  },
  methods: {
    handleClose() {
      this.dialogVisible = false;
    },
    async handleSave() {
      for (const item of this.configList) {
        if (item.inputType === "select" && item.optionSource) {
          await this.loadItemOptionsForSave(item);
        }
      }
      this.$emit("save", this.configList);
      this.dialogVisible = false;
    },
    async loadItemOptionsForSave(item) {
      if (!item.optionSource) return;

      const { sourceType } = item.optionSource;

      if (sourceType === "dict") {
        await this.loadDictOptionsForSave(item);
      } else if (sourceType === "api") {
        await this.loadApiOptionsForSave(item);
      }
    },
    async loadDictOptionsForSave(item) {
      try {
        const dictKey = item.optionSource.dictKey;
        if (!dictKey) return;

        const dictData = await this.getDictData(dictKey);
        if (dictData && Array.isArray(dictData)) {
          item.children = dictData.map(d => ({
            key: d.key,
            value: d.value,
          }));
        }
      } catch (error) {
        console.error("加载字典数据失败:", error);
      }
    },
    async loadApiOptionsForSave(item) {
      try {
        const apiUrl = item.optionSource.apiUrl;
        if (!apiUrl) return;

        const response = await this.$http.get(apiUrl);
        if (response.data && Array.isArray(response.data)) {
          const { valueField, labelField } = item.optionSource;
          item.children = response.data.map(d => ({
            key: d[valueField],
            value: d[labelField],
          }));
        }
      } catch (error) {
        console.error("加载接口数据失败:", error);
      }
    },
    handleAdd() {
      this.configList.push({
        label: "",
        value: "",
        inputType: "text",
        children: [],
      });
    },
    handleDelete(index) {
      this.$confirm("确定要删除该条件吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.configList.splice(index, 1);
      });
    },
    handleMoveUp(index) {
      if (index > 0) {
        const temp = this.configList[index];
        this.configList.splice(index, 1);
        this.configList.splice(index - 1, 0, temp);
      }
    },
    handleMoveDown(index) {
      if (index < this.configList.length - 1) {
        const temp = this.configList[index];
        this.configList.splice(index, 1);
        this.configList.splice(index + 1, 0, temp);
      }
    },
    handleTypeChange(row) {
      if (row.inputType === "select" && !row.children) {
        row.children = [];
      }
    },
    handleConfigOptions(index) {
      this.currentEditIndex = index;
      const currentConfig = this.configList[index];

      const optionSource = currentConfig.optionSource || {};
      this.currentOptionConfig = {
        sourceType: optionSource.sourceType || "manual",
        dictKey: optionSource.dictKey || "",
        apiUrl: optionSource.apiUrl || "",
        valueField: optionSource.valueField || "id",
        labelField: optionSource.labelField || "name",
        options: [],
      };

      if (this.currentOptionConfig.sourceType === "manual") {
        this.currentOptionConfig.options = JSON.parse(JSON.stringify(currentConfig.children || []));
      }

      this.optionsDialogVisible = true;

      this.loadPreviewOptions();
    },
    handleAddOption() {
      this.currentOptionConfig.options.push({
        key: "",
        value: "",
      });
    },
    handleDeleteOption(index) {
      this.currentOptionConfig.options.splice(index, 1);
    },
    handleSaveOptions() {
      const config = this.configList[this.currentEditIndex];
      const configDefault = {
        sourceType: "",
        dictKey: "",
        apiUrl: "",
        valueField: "id",
        labelField: "name",
        options: [],
      };
      if (this.currentOptionConfig.sourceType === "manual") {
        const options = JSON.parse(JSON.stringify(this.currentOptionConfig.options));
        config.children = options;
        config.optionSource = { ...configDefault, sourceType: "manual", options };
      } else if (this.currentOptionConfig.sourceType === "dict") {
        config.optionSource = {
          ...configDefault,
          sourceType: "dict",
          dictKey: this.currentOptionConfig.dictKey,
        };
        config.children = [];
      } else if (this.currentOptionConfig.sourceType === "api") {
        config.optionSource = {
          ...configDefault,
          sourceType: "api",
          apiUrl: this.currentOptionConfig.apiUrl,
          valueField: this.currentOptionConfig.valueField,
          labelField: this.currentOptionConfig.labelField,
        };
        config.children = [];
      }
      this.optionsDialogVisible = false;
    },
    tableRowClassName({ row, rowIndex }) {
      return `row-${rowIndex}`;
    },
    async loadPreviewOptions() {
      this.previewOptions = [];

      if (this.currentOptionConfig.sourceType === "dict") {
        await this.loadDictOptions();
      }
    },
    async loadDictOptions() {
      try {
        const dictKey = this.currentOptionConfig.dictKey;
        if (!dictKey) return;

        const dictData = await this.getDictData(dictKey);
        if (dictData && Array.isArray(dictData)) {
          this.previewOptions = dictData.map(item => ({
            key: item.key,
            value: item.value,
          }));
        }
      } catch (error) {
        console.error("加载字典数据失败:", error);
        this.$message.error("加载字典数据失败");
      }
    },
    getDictData(dictKey) {
      return new Promise(resolve => {
        try {
          const wmsStr = localStorage.getItem("wms") || "{}";
          const wmsData = JSON.parse(wmsStr);
          const dictData = wmsData.SET_enumsSelect || {};
          const dictItem = dictData[dictKey];
          const result = [];

          if (dictItem && dictItem.enums && Array.isArray(dictItem.enums)) {
            dictItem.enums.forEach(item => {
              result.push({
                key: item.key,
                value: item.value,
              });
            });
          }

          resolve(result);
        } catch (error) {
          console.error("获取字典数据失败:", error);
          resolve([]);
        }
      });
    },
    async loadAllDictList() {
      try {
        const wmsStr = localStorage.getItem("wms") || "{}";
        const wmsData = JSON.parse(wmsStr);
        const dictData = wmsData.SET_enumsSelect || {};

        const dictList = [];
        Object.keys(dictData).forEach(key => {
          const dictItem = dictData[key];
          if (dictItem && key) {
            dictList.push({
              key: String(key),
              label: dictItem.desc || key,
            });
          }
        });

        this.allDictList = dictList;
      } catch (error) {
        console.error("加载字典列表失败:", error);
        this.allDictList = [];
      }
    },
    async remoteDictQuery(query) {
      if (!query) {
        this.allDictList = [];
        return;
      }

      try {
        this.dictLoading = true;
        const wmsStr = localStorage.getItem("wms") || "{}";
        const wmsData = JSON.parse(wmsStr);
        const dictData = wmsData.SET_enumsSelect || {};

        const dictList = [];
        Object.keys(dictData).forEach(key => {
          if (key && key.toLowerCase().includes(query.toLowerCase())) {
            const dictItem = dictData[key];
            if (dictItem) {
              dictList.push({
                key: String(key),
                label: dictItem.desc || key,
              });
            }
          }
        });

        this.allDictList = dictList;
      } catch (error) {
        console.error("搜索字典失败:", error);
        this.$message.error("搜索字典失败");
      } finally {
        this.dictLoading = false;
      }
    },
    handleDictKeyChange(dictKey) {
      if (dictKey) {
        this.loadPreviewOptions();
      }
    },
  },
};
</script>

<style scoped>
.search-config-container {
  padding-bottom: 10px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.gray-text {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  text-align: right;
}

.options-config {
  max-height: 400px;
  overflow-y: auto;
}
</style>
