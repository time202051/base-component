<template>
  <el-dialog
    title="搜索条件配置"
    :visible.sync="dialogVisible"
    width="60%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="search-config-container">
      <div class="config-header">
        <el-button
          v-if="customs && customs.length > 0"
          type="success"
          size="small"
          @click="customsDialogVisible = true"
        >
          <i class="el-icon-plus" />
          从预设添加
        </el-button>
      </div>

      <el-table
        ref="configTable"
        :data="configList"
        border
        stripe
        style="width: 100%; margin-top: 10px"
        :row-class-name="tableRowClassName"
        row-key="value"
        :tree-props="{ children: '' }"
      >
        <el-table-column label="排序" width="80" align="center" v-if="dragable">
          <template slot-scope="scope">
            <i class="el-icon-rank sort-handle" style="cursor: move; font-size: 18px" />
          </template>
        </el-table-column>

        <el-table-column label="字段名称" prop="label" align="center">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.label"
              size="small"
              placeholder="请输入字段名称"
              disabled
            />
          </template>
        </el-table-column>

        <el-table-column label="字段值" prop="value" align="center">
          <template slot-scope="scope">
            <el-input v-model="scope.row.value" size="small" placeholder="请输入字段值" disabled />
          </template>
        </el-table-column>

        <el-table-column label="输入类型" prop="inputType" width="130" align="center">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.inputType"
              size="small"
              placeholder="请选择类型"
              @change="handleTypeChange(scope.row)"
              :disabled="['number', 'picker'].includes(scope.row.inputType)"
            >
              <el-option label="文本输入" value="text" />
              <el-option label="数字输入" value="number" disabled />
              <el-option label="下拉选择" value="select" />
              <el-option label="日期选择" value="picker" disabled />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="日期类型" width="150" align="center">
          <template slot-scope="scope">
            <el-select
              v-if="scope.row.inputType === 'picker'"
              v-model="scope.row.dateType"
              size="small"
              placeholder="请选择日期类型"
              @change="handleDateTypeChange(scope.row)"
            >
              <el-option label="日期" value="date" />
              <el-option label="日期时间" value="datetime" />
              <el-option label="日期范围" value="daterange" />
              <el-option label="日期时间范围" value="datetimerange" />
              <el-option label="月份" value="month" />
              <el-option label="月份范围" value="monthrange" />
              <el-option label="年份" value="year" />
            </el-select>
            <div v-else class="gray-text">-</div>
          </template>
        </el-table-column>

        <el-table-column label="比较方式" width="130" align="center">
          <template slot-scope="scope">
            <el-select v-model="scope.row.compare" size="small" placeholder="请选择比较方式">
              <el-option label="范围" value="range" />
              <el-option label="包含于" value="in" />
              <el-option label="不包含于" value="not in" />
              <el-option label="等于" value="eq" />
              <el-option label="不等于" value="ne" />
              <el-option label="大于" value="gt" />
              <el-option label="大于等于" value="ge" />
              <el-option label="小于" value="lt" />
              <el-option label="小于等于" value="le" />
              <el-option label="包含" value="contains" />
              <el-option label="以...开始" value="startswith" />
              <el-option label="以...结束" value="endswith" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="配置" width="150" align="center">
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

    <div class="dialog-footer">
      <slot name="footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </slot>
    </div>

    <el-dialog title="配置选项" :visible.sync="optionsDialogVisible" width="700px" append-to-body>
      <el-form :model="currentOptionConfig" label-width="100px" size="small">
        <el-form-item label="数据来源">
          <el-radio-group v-model="currentOptionConfig.sourceType">
            <el-radio label="manual">手动配置</el-radio>
            <el-radio label="dict">本地字典</el-radio>
            <el-radio label="api">接口获取</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'dict'" label="字典">
          <el-select
            v-model="currentOptionConfig.dictKey"
            filterable
            :filter-method="filterDict"
            placeholder="请输入字典，如：orderTypeEnum"
            style="width: 100%"
            @change="handleDictKeyChange"
            clearable
          >
            <el-option
              v-for="dict in allDictList"
              :key="dict.key"
              :label="dict.label"
              :value="dict.key"
            >
              <span style="float: left">{{ dict.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.key }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="接口地址">
          <el-input
            v-model="currentOptionConfig.apiUrl"
            placeholder="请输入接口地址，如：/api/dict/list"
          />
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="请求方式">
          <el-select v-model="currentOptionConfig.method" placeholder="请选择请求方式">
            <el-option label="GET" value="get" />
            <el-option label="POST" value="post" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="文本字段">
          <el-input v-model="currentOptionConfig.labelField" placeholder="如：name" />
        </el-form-item>

        <el-form-item v-if="currentOptionConfig.sourceType === 'api'" label="值字段">
          <el-input v-model="currentOptionConfig.valueField" placeholder="如：id" />
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

        <el-form-item v-if="currentOptionConfig.sourceType === 'dict' && isPreview" label="预览">
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
      <div class="dialog-footer">
        <slot name="footer">
          <el-button @click="optionsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveOptions">确定</el-button>
        </slot>
      </div>
    </el-dialog>

    <el-dialog
      title="从预设添加条件"
      :visible.sync="customsDialogVisible"
      width="600px"
      append-to-body
    >
      <el-table :data="availableCustoms" border stripe style="width: 100%">
        <el-table-column label="字段名称" prop="name" align="center" />
        <el-table-column label="字段值" prop="key" align="center" />
        <el-table-column label="数据类型" width="120" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.keyType === 1" type="info">字符串</el-tag>
            <el-tag v-else-if="scope.row.keyType === 2" type="warning">数字</el-tag>
            <el-tag v-else-if="scope.row.keyType === 3" type="success">枚举</el-tag>
            <el-tag v-else-if="scope.row.keyType === 4" type="primary">日期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleSelectCustom(scope.row)">
              添加
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" style="text-align: right">
        <el-button @click="customsDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import Sortable from "sortablejs";

// interface OptionItem {
//   key: string;
//   value: string;
// }

// interface OptionSource {
//   sourceType: "manual" | "dict" | "api";
//   dictKey?: string;
//   apiUrl?: string;
//   valueField?: string;
//   labelField?: string;
//   options?: OptionItem[];
// }

// interface TableSearchItem {
//   label: string;
//   value: string;
//   inputType: "text" | "number" | "select";
//   children?: OptionItem[];
//   optionSource?: OptionSource;
// }

// interface DictItem {
//   key: string;
//   label: string;
// }

// interface WmsDictItem {
//   desc?: string;
//   enums?: Array<{ key: string; value: string }>;
// }

// interface WmsData {
//   SET_enumsSelect?: Record<string, WmsDictItem>;
// }

// interface CurrentOptionConfig {
//   sourceType: "manual" | "dict" | "api";
//   dictKey: string;
//   apiUrl: string;
//   valueField: string;
//   labelField: string;
//   options: OptionItem[];
// }

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
    // interface ICustoms {
    //   key: string;//键名
    //   name: string; //显示的名称
    //   keyType: number; //数据类型 1字符串 2数字 3枚举 4日期
    // }
    //后端返回的可选的查询入参
    customs: {
      type: Array,
      default: () => [],
    },
    dragable: {
      type: Boolean,
      default: false,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialogVisible: false,
      configList: [],
      optionsDialogVisible: false,
      customsDialogVisible: false,
      currentEditIndex: -1,
      currentOptionConfig: {
        sourceType: "manual",
        dictKey: "",
        apiUrl: "",
        method: "get",
        valueField: "id",
        labelField: "name",
        options: [],
      },
      previewOptions: [],
      allDictList: [],
      allDictListBackup: [],
      sortable: null,
      currentConfig: {}, // 配置选项
    };
  },
  computed: {
    availableCustoms() {
      const selectedKeys = this.configList.map(item => item.value);
      return this.customs.filter(custom => !selectedKeys.includes(custom.key));
    },
  },
  created() {
    this.loadAllDictList();
  },
  watch: {
    visible: {
      handler(newVal) {
        this.dialogVisible = newVal;
        if (newVal) {
          this.configList = JSON.parse(JSON.stringify(this.tableSearch));
          this.$nextTick(() => {
            this.initSortable();
          });
        }
      },
      immediate: true,
    },
    dialogVisible(newVal) {
      this.$emit("update:visible", newVal);
      if (!newVal) {
        this.destroySortable();
      }
    },
  },
  methods: {
    initSortable() {
      if (this.sortable) {
        this.sortable.destroy();
      }

      const table = this.$refs.configTable;
      if (!table) return;

      const tbody = table.$el.querySelector(".el-table__body-wrapper tbody");
      if (!tbody) return;

      this.sortable = Sortable.create(tbody, {
        animation: 150,
        handle: ".sort-handle",
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onEnd: ({ newIndex, oldIndex }) => {
          if (newIndex !== oldIndex) {
            const movedItem = this.configList[oldIndex];
            this.configList.splice(oldIndex, 1);
            this.configList.splice(newIndex, 0, movedItem);
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
      console.log(`\x1b[36m\x1b[4mol插件-动态搜索框配置数据`, this.configList);
    },
    async loadItemOptionsForSave(item) {
      if (!item.optionSource) return;

      const { sourceType } = item.optionSource;

      if (sourceType === "dict") {
        await this.loadDictOptionsForSave(item);
      }
      //  else if (sourceType === "api") {
      //   await this.loadApiOptionsForSave(item);
      // }
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
    // async loadApiOptionsForSave(item) {
    //   try {
    //     const apiUrl = item.optionSource.apiUrl;
    //     const method = item.optionSource.method || "get";
    //     if (!apiUrl) return;

    //     let response;
    //     if (method === "post") {
    //       response = await this.$http.post(apiUrl);
    //     } else {
    //       response = await this.$http.get(apiUrl);
    //     }

    //     if (response.data && Array.isArray(response.data)) {
    //       const { valueField, labelField } = item.optionSource;
    //       item.children = response.data.map(d => ({
    //         key: d[valueField],
    //         value: d[labelField],
    //       }));
    //     }
    //   } catch (error) {
    //     console.error("加载接口数据失败:", error);
    //   }
    // },

    handleDelete(index) {
      this.$confirm("确定要删除该条件吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.configList.splice(index, 1);
      });
    },
    handleTypeChange(row) {
      if (row.inputType === "select" && !row.children) {
        row.children = [];
      } else if (row.inputType === "picker") {
        if (!row.props) {
          row.props = {};
        }
        this.updateDatePickerProps(row);
      } else {
        row.dateType = "";
      }
    },
    handleDateTypeChange(row) {
      if (!row.props) {
        row.props = {};
      }
      this.updateDatePickerProps(row);
    },
    updateDatePickerProps(row) {
      const dateType = row.dateType || "date";
      const props = row.props || {};

      switch (dateType) {
        case "date":
          props.type = "date";
          props.placeholder = "选择日期";
          props.valueFormat = "yyyy-MM-dd";
          props.format = "yyyy/MM/dd";
          break;
        case "datetime":
          props.type = "datetime";
          props.placeholder = "选择日期时间";
          props.valueFormat = "yyyy-MM-dd HH:mm:ss";
          props.format = "yyyy/MM/dd HH:mm:ss";
          break;
        case "daterange":
          props.type = "daterange";
          props.startPlaceholder = "开始日期";
          props.endPlaceholder = "结束日期";
          props.placeholder = "选择日期范围";
          props.valueFormat = "yyyy-MM-dd";
          props.format = "yyyy/MM/dd";
          break;
        case "datetimerange":
          props.type = "datetimerange";
          props.startPlaceholder = "开始时间";
          props.endPlaceholder = "结束时间";
          props.placeholder = "选择时间范围";
          props.valueFormat = "yyyy-MM-dd HH:mm:ss";
          props.format = "yyyy/MM/dd HH:mm:ss";
          props.defaultTime = ["00:00:00", "23:59:59"];
          break;
        case "month":
          props.type = "month";
          props.placeholder = "选择月份";
          props.valueFormat = "yyyy-MM";
          props.format = "yyyy年MM月";
          break;
        case "monthrange":
          props.type = "monthrange";
          props.startPlaceholder = "开始月份";
          props.endPlaceholder = "结束月份";
          props.placeholder = "选择月份范围";
          props.valueFormat = "yyyy-MM";
          props.format = "yyyy年MM月";
          break;
        case "year":
          props.type = "year";
          props.placeholder = "选择年份";
          props.valueFormat = "yyyy";
          props.format = "yyyy年";
          break;
        default:
          props.type = "date";
          props.placeholder = "选择日期";
          props.valueFormat = "yyyy-MM-dd";
          props.format = "yyyy/MM/dd";
      }

      row.props = props;
    },
    handleConfigOptions(index) {
      this.currentEditIndex = index;
      const currentConfig = this.configList[index];
      this.currentConfig = JSON.parse(JSON.stringify(currentConfig));

      const optionSource = currentConfig.optionSource || {};
      this.currentOptionConfig = {
        sourceType: optionSource.sourceType || "manual",
        dictKey: optionSource.dictKey || "",
        apiUrl: optionSource.apiUrl || "",
        method: optionSource.method || "get",
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
    async loadApiOptions(item) {
      try {
        const apiUrl = item.optionSource.apiUrl;
        const method = item.optionSource.method || "get";
        if (!apiUrl) return;

        let response;
        if (method === "post") {
          response = await this.post({ url: apiUrl });
        } else {
          response = await this.get({ url: apiUrl });
        }
        if (response.code !== 200) return;
        if (response.result && Array.isArray(response.result)) {
          const { valueField, labelField } = item.optionSource;
          const children = response.result.map(d => ({
            key: d[valueField],
            value: d[labelField],
          }));
          return children;
        }
      } catch (error) {
        console.error("加载接口数据失败:", error);
        return [];
      }
    },
    needSetChildren(oldConfig, newConfig) {
      const { inputType, optionSource } = oldConfig;
      if (!optionSource) return false;
      const { sourceType, apiUrl, method, valueField, labelField } = optionSource;
      if (inputType !== "select" || sourceType !== "api") return false;
      const {
        sourceType: newSourceType,
        apiUrl: newApiUrl,
        method: newMethod,
        valueField: newValueField,
        labelField: newLabelField,
      } = newConfig;
      if (
        sourceType === newSourceType &&
        apiUrl === newApiUrl &&
        method === newMethod &&
        valueField === newValueField &&
        labelField === newLabelField
      )
        return false;
      return true;
    },
    async handleSaveOptions() {
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
          method: this.currentOptionConfig.method,
          valueField: this.currentOptionConfig.valueField,
          labelField: this.currentOptionConfig.labelField,
        };
        // 接口请求
        // 判断是否需要走 api接口获取
        let children = [];
        const bool = this.needSetChildren(this.currentConfig, config.optionSource);
        if (bool) children = await this.loadApiOptions(config);
        else config.children = children || [];
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
        this.allDictListBackup = dictList;
      } catch (error) {
        console.error("加载字典列表失败:", error);
        this.allDictList = [];
        this.allDictListBackup = [];
      }
    },
    filterDict(query) {
      if (!query) {
        this.allDictList = this.allDictListBackup || [];
        return;
      }
      const filteredList = this.allDictListBackup.filter(item => {
        return (
          item.key.toLowerCase().includes(query.toLowerCase()) ||
          item.label.toLowerCase().includes(query.toLowerCase())
        );
      });
      this.allDictList = filteredList;
    },
    handleDictKeyChange(dictKey) {
      this.allDictList = this.allDictListBackup || [];
      if (dictKey) {
        this.loadPreviewOptions();
      }
    },
    handleSelectCustom(custom) {
      const inputTypeMap = {
        1: "text",
        2: "number",
        3: "select",
        4: "picker",
      };

      const compareTypeMap = {
        1: "contains",
        2: "eq",
        3: "eq",
        4: "eq",
      };

      const newItem = {
        label: custom.name,
        value: custom.key,
        inputType: inputTypeMap[custom.keyType] || "text",
        compare: compareTypeMap[custom.keyType] || "eq",
        children: [],
        props: {},
      };

      if (custom.keyType === 4) {
        newItem.dateType = "date";
        newItem.props = {
          type: "date",
          placeholder: "选择日期",
          valueFormat: "yyyy-MM-dd",
          format: "yyyy/MM/dd",
        };
      } else if (custom.keyType === 3) {
        newItem.optionSource = {
          sourceType: "dict",
          dictKey: custom.enumName,
        };
      }

      this.configList.push(newItem);
      this.customsDialogVisible = false;
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

.sort-handle {
  color: #909399;
  transition: color 0.3s;
}

.sort-handle:hover {
  color: #409eff;
}

.sortable-ghost {
  opacity: 0.4;
  background-color: #f5f7fa;
}

.sortable-drag {
  opacity: 1;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.options-config {
  max-height: 400px;
  overflow-y: auto;
}
</style>
