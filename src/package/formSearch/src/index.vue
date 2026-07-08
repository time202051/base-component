<template>
  <div class="formSearch formSearchArrowUp">
    <div
      v-if="formSearchData.tableSearch && formSearchData.tableSearch.length >= 0"
      class="table-header"
    >
      <el-form
        ref="formSearch"
        size="mini"
        :rules="formSearchData.rules"
        :model="formSearch"
        :inline="true"
        label-position="right"
        v-bind="{
          ...(formSearchData.options && formSearchData.options.formProps),
        }"
        :key="key"
      >
        <!-- 'label-width': '100px', -->
        <div
          class="transitionGroup"
          :style="{
            '--form-search-span': effectiveSpan,
            '--form-search-label-font-size': labelFontSize,
          }"
        >
          <!-- 组合查询条件：作为网格第一个格子 -->
          <div
            v-if="isCustomSearch && comboPresets.length > 0"
            class="table-header-item combo-grid-item"
            style="grid-column: span 1"
          >
            <label class="combo-grid-label"><i class="el-icon-link"></i> 组合查询</label>
            <div class="combo-grid-content">
              <el-select
                v-model="activeComboPreset"
                size="mini"
                placeholder="选择方案"
                clearable
                @change="handleComboSelect"
                style="width: 100%"
              >
                <el-option
                  v-for="(preset, index) in comboPresets"
                  :key="preset.name"
                  :label="preset.name"
                  :value="preset.name"
                >
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      width: 100%;
                    "
                  >
                    <span
                      style="
                        max-width: 110px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      "
                      >{{ preset.name }}</span
                    >
                    <el-button
                      type="text"
                      icon="el-icon-delete"
                      size="mini"
                      style="color: #f56c6c; padding: 0; line-height: 1"
                      title="删除该组合条件"
                      @click.stop="handleComboDeleteItem(preset.name, index)"
                    />
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
          <el-form-item
            v-for="item in findTableSearch"
            v-show="!item.show"
            :key="item.value"
            class="table-header-item"
            :style="{
              gridColumn: `span ${item.span || 1}`,
              ...(item.labelWidth ? { '--form-search-label-width': item.labelWidth + 'px' } : {}),
            }"
            :prop="item.value && !String(item.value).includes('.') ? item.value : undefined"
            v-bind="item.labelProps || {}"
            :class="{
              picker: item.props && item.props.type === 'datetimerange',
              date: item.props && item.props.type === 'date',
            }"
            @mouseenter.native="onLabelHover($event, item)"
          >
            <template slot="label">
              <el-tooltip
                :content="item.label"
                :disabled="!item.label || item._labelOverflow === false"
                placement="top"
              >
                <span>{{ item.label }}</span>
              </el-tooltip>
            </template>
            <!--    <template v-if="item.inputType === 'treeSelect'">
                <slot name="treeSlot"></slot>
              </template> -->
            <Tree-select
              v-if="item.inputType === 'treeSelect'"
              ref="TreeSelectref"
              v-model="formSearch[item.value]"
              v-bind="item.props || {}"
              :options="item.children"
              @getValue="item.change && item.change(formSearch[item.value])"
            />

            <div
              v-else-if="item.inputType === 'select'"
              :class="isCustomSearch ? 'select-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="isCustomSearch"
                :value="compareMap[item.value] || item.compare || 'eq'"
                @change="handleCompareChange(item, $event)"
              />
              <el-select
                class="custom-select"
                v-model="formSearch[item.value]"
                :key="`sel_${item.value}_${item.props && item.props.multiple ? 'multi' : 'single'}`"
                v-el-select-all="item.loadmores"
                :clearable="item.clearable === undefined || item.clearable"
                v-bind="{ collapseTags: true, ...(item.props || {}) }"
                :placeholder="getSearchPlaceholder(item, '请选择')"
                :popper-append-to-body="false"
                @change="item.change && item.change(formSearch[item.value])"
                @keyup.enter.native="handleSearch('formSearch')"
              >
                <el-option
                  v-for="option in item.children"
                  :key="option.key"
                  :label="option.value"
                  :value="option.key"
                />
              </el-select>
            </div>
            <!-- v-bind="item.props || {}" -->
            <div
              v-else-if="item.inputType === 'selectTEMP'"
              :class="isCustomSearch ? 'select-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="isCustomSearch"
                :value="compareMap[item.value] || item.compare || 'eq'"
                @change="handleCompareChange(item, $event)"
              />
              <el-select
                v-model="formSearch[item.value]"
                :key="`selT_${item.value}_${
                  item.props && item.props.multiple ? 'multi' : 'single'
                }`"
                v-el-select-all="item.loadmores"
                v-bind="{ clearable: true, collapseTags: true, ...(item.props || {}) }"
                :placeholder="getSearchPlaceholder(item, '请选择')"
                :popper-append-to-body="false"
                @change="item.change && item.change(formSearch[item.value])"
                @keyup.enter.native="handleSearch('formSearch')"
              >
                <el-option
                  v-for="option in item.children"
                  :key="option.key"
                  :label="option.value"
                  :value="option.key"
                />
              </el-select>
            </div>
            <el-select
              v-else-if="item.inputType === 'selectRemoteMethod'"
              v-model="formSearch[item.value]"
              v-el-select-all="item.loadmores"
              filterable
              remote
              clearable
              reserve-keyword
              :placeholder="`请输入至少3位关键字`"
              :remote-method="item.remoteMethod"
              :loading="item.loading"
            >
              <el-option
                v-for="option in item.children"
                :key="option.key"
                :label="option.value"
                :value="option.key"
              />
            </el-select>
            <el-date-picker
              v-else-if="item.inputType === 'picker'"
              v-model="formSearch[item.value]"
              clearable
              style="width: 100%"
              :placeholder="item.props.placeholder || '选择日期'"
              v-bind="item.props || { type: 'date' }"
              :default-time="item.props.type == 'datetimerange' ? ['00:00:00', '23:59:59'] : ''"
            />
            <ol-number-range
              v-else-if="item.inputType === 'numberRange'"
              v-model="formSearch[item.value]"
              v-bind="item.props || {}"
              v-on="{
                ...item.listeners,
                change: val =>
                  item.listeners && item.listeners.change && item.listeners.change({ item, val }),
              }"
            ></ol-number-range>
            <div v-else :class="isCustomSearch ? 'input-with-prefix' : ''" style="width: 100%">
              <compare-prefix-select
                v-if="isCustomSearch"
                :value="compareMap[item.value] || item.compare || 'contains'"
                @change="handleCompareChange(item, $event)"
              />
              <template
                v-if="
                  isCustomSearch &&
                  (compareMap[item.value] || item.compare) === 'range' &&
                  Array.isArray(formSearch[item.value])
                "
              >
                <el-input
                  v-model="formSearch[item.value][0]"
                  clearable
                  :type="item.inputType || 'text'"
                  :placeholder="item.inputType === 'number' ? '最小值' : '起始值'"
                  :maxlength="item.maxlength"
                  :class="item.inputType == 'number' ? 'numrule' : ''"
                  @change="handleRangeValidate(item)"
                  @keyup.enter.native="handleSearch('formSearch')"
                  @keydown.native="keyInput(item, $event)"
                  @paste.native="onPaste(item, $event)"
                />
                <span class="range-separator">~</span>
                <el-input
                  v-model="formSearch[item.value][1]"
                  clearable
                  :type="item.inputType || 'text'"
                  :placeholder="item.inputType === 'number' ? '最大值' : '结束值'"
                  :maxlength="item.maxlength"
                  :class="item.inputType == 'number' ? 'numrule' : ''"
                  @change="handleRangeValidate(item)"
                  @keyup.enter.native="handleSearch('formSearch')"
                  @keydown.native="keyInput(item, $event)"
                  @paste.native="onPaste(item, $event)"
                />
              </template>
              <el-input
                v-else
                v-model="formSearch[item.value]"
                clearable
                v-bind="item.props || {}"
                :type="item.inputType || 'text'"
                :placeholder="getSearchPlaceholder(item, '请输入')"
                :maxlength="item.maxlength"
                :oninput="handleChangeInput(item)"
                :class="item.inputType == 'number' ? 'numrule' : ''"
                @keyup.enter.native="handleSearch('formSearch')"
                @keydown.native="keyInput(item, $event)"
                @paste.native="onPaste(item, $event)"
                v-input-history
              />
            </div>
          </el-form-item>
        </div>
        <el-form-item
          style="word-break: keep-all; white-space: nowrap; margin-left: 10px"
          class="fromBtn"
        >
          <el-button v-if="formSearchData.reset" type="primary" @click="handleSearch('formSearch')"
            >查询
          </el-button>
          <el-button v-if="formSearchData.reset" plain @click="handleReset('formSearch')"
            >重置</el-button
          >
          <el-button
            v-if="showExpendBtn"
            plain
            :icon="expend ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
            @click="handleExpend('formSearch')"
          >
            {{ expend ? "收起" : "展开" }}</el-button
          >
          <el-dropdown v-if="isCustomSearch" trigger="click">
            <el-button plain icon="el-icon-more" />
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleOpenConfig">
                <i class="el-icon-setting" /> 配置
              </el-dropdown-item>
              <el-dropdown-item @click.native="handleSave">
                <i class="el-icon-document-checked" /> 保存搜索条件
              </el-dropdown-item>
              <el-dropdown-item @click.native="handleSaveCombo">
                <i class="el-icon-folder-add" /> 保存组合条件
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </div>
    <search-config-dialog
      v-if="configDialogVisible"
      :visible.sync="configDialogVisible"
      :table-search="formSearchData.tableSearch"
      :formSearchData="formSearchData"
      :formSearch="formSearch"
      :customs="formSearchData.customs"
      @save="handleSaveConfig"
      v-bind="$attrs"
    />
  </div>
</template>

<script>
import { getData } from "../../index.js";
import { getEnum } from "../../../utils/getEnum.js";
import OlNumberRange from "../../numberRange/index.js";
import SearchConfigDialog from "./components/SearchConfigDialog.vue";
import ComparePrefixSelect from "./components/ComparePrefixSelect.vue";

export default {
  name: "search",
  components: {
    OlNumberRange,
    SearchConfigDialog,
    ComparePrefixSelect,
  },
  directives: {
    "el-select-loadmore": {
      bind(el, binding) {
        // 获取element-ui定义好的scroll盒子
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        SELECTWRAP_DOM.addEventListener("scroll", function () {
          /**
           * scrollHeight 获取元素内容高度(只读)
           * scrollTop 获取或者设置元素的偏移值,常用于, 计算滚动条的位置, 当一个元素的容器没有产生垂直方向的滚动条, 那它的scrollTop的值默认为0.
           * clientHeight 读取元素的可见高度(只读)
           * 如果元素滚动到底, 下面等式返回true, 没有则返回false:
           * ele.scrollHeight - ele.scrollTop === ele.clientHeight;
           */
          const condition = this.scrollHeight - this.scrollTop <= this.clientHeight;
          if (condition > 0 && condition < 2) {
            binding.value();
          }
        });
      },
    },
    "el-select-all": {
      bind(el, binding, vnode) {
        // console.log(binding.value)
        const _that = vnode.context; // 当前vue对象
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        SELECTWRAP_DOM.addEventListener("scroll", function () {
          // console.log(SELECTWRAP_DOM.scrollHeight) // 文档内容的实际高度
          // console.log(SELECTWRAP_DOM.scrollTop) // 滚动条滚动高度
          // console.log(SELECTWRAP_DOM.clientHeight) // 可视窗口高度
          // CONDITION  //滚动条到底了
          const CONDITION =
            SELECTWRAP_DOM.scrollHeight - SELECTWRAP_DOM.scrollTop - 2 <=
            SELECTWRAP_DOM.clientHeight;
          if (CONDITION) {
            binding.value.SELECTWRAP_DOM_index += 10;
            binding.value.fn();
          }
        });
      },
      unbind(el, binding, vnode) {
        // 解除事件监听
        const _that = vnode.context; // 当前vue对象
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        if (SELECTWRAP_DOM) {
          SELECTWRAP_DOM.removeEventListener("scroll", function () {
            binding.value.SELECTWRAP_DOM_index = 0;
          });
        }
      },
    },
  },
  props: {
    url: {
      type: String,
      default: "",
    },
    formSearchData: {
      type: Object,
      default: () => {
        return {
          buttonData: [],
          rules: {},
          value: {},
          // 循环的各种组件
          tableSearch: [],
          // 表格框架各种样式
          options: {},
          reset: false, // 是否要重置
          customs: [], //根据customs确定是动态还是swagger配置
        };
      },
    },
    // btnlist: Array,
    // 一行显示搜索字段的个数，同时影响 CSS 布局和折叠数量
    span: {
      type: Number,
      default: undefined,
    },
    //获取swagger后的钩子，返回swagger结构数据。用于处理swagger数据
    onSwagger: {
      type: Function,
      default: null,
    },
    isCustomSearch: {
      type: Boolean,
      default: false,
    },
    // 请求方式 post get
    method: {
      type: String,
    },
    // customSearch接口保存的所有数据
    byMenuData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      findTableSearch: {},
      expend: !(
        this.formSearchData.tableSearch &&
        this.formSearchData.tableSearch.length > this.effectiveSpan
      ),
      formSearch: {
        ...this.formSearchData.value,
      },
      configDialogVisible: false,
      compareMap: {},
      loadmores: {
        fn: this.loadmoreGX,
        SELECTWRAP_DOM_index: 0,
        flage: null,
      },
      tempBoxData: [],
      optionBox: [],
      key: 0,
      comboPresets: [], // 组合查询条件列表，从 byMenuData.customSearch 解析
      activeComboPreset: null, // 当前选中的组合条件名称
    };
  },
  async created() {
    this.init();
  },
  mounted() {},
  computed: {
    // 组合查询格子是否显示
    hasComboGrid() {
      return this.isCustomSearch && this.comboPresets.length > 0;
    },
    // 普通搜索项可用的列数：组合查询格子占用 1 列，需腾出位置
    availableSpan() {
      return Math.max(1, this.effectiveSpan - (this.hasComboGrid ? 1 : 0));
    },
    // 搜索框展开折叠按钮是否显示（按每项 span 累计判断，而非项数）
    showExpendBtn() {
      if (!this.formSearchData.tableSearch) return false;
      var totalSpan = this.formSearchData.tableSearch.reduce(function (sum, item) {
        return sum + (item.span || 1);
      }, 0);
      return totalSpan > this.availableSpan;
    },
    // 优先级：props > 全局配置 > 默认值
    finalMethod() {
      return this.method || (this.$olBaseConfig && this.$olBaseConfig.method) || "get";
    },
    // 优先级：props > formSearchData.options > 全局配置 > 默认值
    effectiveSpan() {
      return this.span || (this.$olBaseConfig && this.$olBaseConfig.span) || 4;
    },
    // 表单实际生效的 size（formProps 可能覆盖 el-form 的静态 size="mini"）
    effectiveFormSize() {
      var formProps = this.formSearchData.options && this.formSearchData.options.formProps;
      return (formProps && formProps.size) || "mini";
    },
    // 根据 size 返回对应的标签字号，保证组合查询和查询条件字体一致
    labelFontSize() {
      var map = { mini: "12px", small: "13px", medium: "14px" };
      return map[this.effectiveFormSize] || "12px";
    },
  },
  watch: {
    "formSearchData.value": {
      handler: function (newVal, OldVal) {
        if (newVal) {
          return (this.formSearch = {
            ...newVal,
          });
          // return (this.findTableSearch = { ...newVal });
        }
      },
      deep: true,
    },
    // 监听 byMenuData 解析后端返回的组合查询条件列表
    byMenuData: {
      handler(val) {
        if (val && val.customSearch) {
          try {
            var parsed =
              typeof val.customSearch === "string"
                ? JSON.parse(val.customSearch)
                : val.customSearch;
            this.comboPresets = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            this.comboPresets = [];
          }
        } else {
          this.comboPresets = [];
        }
      },
      immediate: true,
      deep: true,
    },
    // 组合查询格子显隐变化时，重新切分可见的搜索项
    hasComboGrid: {
      handler() {
        this.recalcVisibleItems();
      },
    },
  },
  methods: {
    getSearchPlaceholder(item, prefix) {
      const label = item.placeholder || item.label;
      return `${prefix}${label}`;
    },
    /** 鼠标经过表单行时检测 label 文字是否溢出（被截断显示...），是才开 tooltip */
    onLabelHover(e, item) {
      const labelEl = e.currentTarget.querySelector(".el-form-item__label");
      if (labelEl) {
        const overflow = labelEl.scrollWidth > labelEl.clientWidth;
        this.$set(item, "_labelOverflow", overflow);
      }
    },
    handleCompareChange(item, compare) {
      this.$set(this.compareMap, item.value, compare);
      const key = item.value;
      if (item.inputType === "select" || item.inputType === "selectTEMP") {
        const isMultiple = compare === "in" || compare === "not in";
        // 同步 el-select 的 multiple 属性，否则单选模式收到数组会报错
        if (!item.props) {
          this.$set(item, "props", {});
        }
        this.$set(item.props, "multiple", isMultiple);
        // 切换比较符时清空右侧输入框的值
        this.$set(this.formSearch, key, isMultiple ? [] : null);
      } else {
        // 非下拉类型：切换比较符时清空右侧输入框的值
        // 范围比较符需要双输入框，初始化为长度为2的数组
        if (compare === "range") {
          this.$set(this.formSearch, key, ["", ""]);
        } else {
          this.$set(this.formSearch, key, null);
        }
      }
    },
    /** 范围输入框校验：数字类型时确保起始值 ≤ 结束值，否则自动交换 */
    handleRangeValidate(item) {
      if (item.inputType !== "number") return;
      const key = item.value;
      const val = this.formSearch[key];
      if (!Array.isArray(val)) return;
      const a = val[0];
      const b = val[1];
      // 两个值都存在且起始大于结束，自动交换
      if (a !== "" && a != null && b !== "" && b != null && Number(a) > Number(b)) {
        this.$set(this.formSearch[key], 0, b);
        this.$set(this.formSearch[key], 1, a);
      }
    },

    /** 根据 compare 值同步 item.props.multiple，确保下拉框单选/多选模式正确 */
    syncFieldMultiple(item, compare) {
      if (!item || (item.inputType !== "select" && item.inputType !== "selectTEMP")) return;
      const isMultiple = compare === "in" || compare === "not in";
      if (!item.props) {
        this.$set(item, "props", {});
      }
      this.$set(item.props, "multiple", isMultiple);
    },

    async init() {
      if (!this.isCustomSearch && this.url) {
        const swaggerData = await getData();
        let swaggersearchColumns = swaggerData.paths[this.url][this.finalMethod].parameters || [];
        if (typeof this.onSwagger === "function") {
          try {
            const res = await this.onSwagger({ columns: swaggersearchColumns });
            if (res) swaggersearchColumns = res;
          } catch (err) {}
        }
        swaggersearchColumns.forEach(item => {
          let tempItem = this.formSearchData.tableSearch.find(
            e => e.value.toLowerCase() === item.name.toLowerCase()
          );
          if (tempItem) {
            // 匹配到
            tempItem = { ...item, ...tempItem };
          } else if (item.description) {
            // 未匹配到
            const pushItem = {
              value: item.name,
              label: item.description,
              inputType: "text",
              props: {},
            };
            if (item.schema.enum && Array.isArray(item.schema.enum)) {
              //枚举值
              pushItem.inputType = "select";
              const ref = item.schema["$$ref"].split("/");
              const enumName = ref[ref.length - 1];
              const tempEnum = getEnum(enumName);
              pushItem.children = tempEnum.length
                ? tempEnum
                : item.schema.enum.map(e => ({
                    key: e,
                    value: e,
                  }));
            } else if (item.schema.format === "date-time") {
              //日期
              pushItem.inputType = "picker";
              pushItem.props.valueFormat = "yyyy-MM-dd";
              pushItem.props.format = "yyyy/MM/dd";
            } else if (item.schema && item.schema.type === "string") {
              pushItem.inputType = "text";
            }
            this.formSearchData.tableSearch.push(pushItem);
          }
        });

        // 自动识别范围时间字段,以Begin和End结尾的字段,和"BeginTime", "EndTime"，这样的时间范围字段
        const rangeTimeCloumns = await this.autoDetectRangeTimeFields(swaggersearchColumns);
        this.formSearchData.tableSearch = [...this.formSearchData.tableSearch, ...rangeTimeCloumns];
      }

      // 为所有项补齐 span 默认值（向后兼容旧数据）
      this.formSearchData.tableSearch.forEach(function (item) {
        if (item.span == null) {
          item.span = 1;
        }
      });
      // datetimerange 且格式含 HH:mm:ss 的自动 span=2（需要更多空间显示完整时分秒）
      this.formSearchData.tableSearch.forEach(function (item) {
        if (
          item.inputType === "picker" &&
          item.props &&
          item.props.type === "datetimerange" &&
          item.props.format &&
          item.props.format.indexOf("HH:mm:ss") !== -1 &&
          item.span === 1
        ) {
          item.span = 2;
        }
      });

      var totalSpan = this.formSearchData.tableSearch.reduce(function (sum, item) {
        return sum + (item.span || 1);
      }, 0);
      var isMoreThanSlice = totalSpan > this.availableSpan;
      this.findTableSearch = isMoreThanSlice
        ? this.sliceBySpan(this.formSearchData.tableSearch, this.availableSpan)
        : this.formSearchData.tableSearch;
      // 超过每行列数默认收起，按钮显示"展开"
      if (this.isCustomSearch) this.expend = !isMoreThanSlice;
      await this.loadOptionSources();
      // 初始化时，比较运算符为"范围"的文本/数字输入框需要将值转为长度为2的数组
      if (this.isCustomSearch) {
        this.initRangeFields();
      }
      console.log(`\x1b[36m\x1b[4mol插件-搜索框渲染`, this.formSearchData.tableSearch);
    },
    /** 初始化范围比较字段：确保值为 [开始值, 结束值] 格式的数组 */
    initRangeFields() {
      this.formSearchData.tableSearch.forEach(item => {
        if (!item.value) return;
        const compare = this.compareMap[item.value] || item.compare;
        if (compare !== "range") return;
        // 只处理文本/数字输入框，下拉框和日期选择器有自己的处理逻辑
        if (
          item.inputType === "select" ||
          item.inputType === "selectTEMP" ||
          item.inputType === "picker"
        )
          return;
        const key = item.value;
        if (!Array.isArray(this.formSearch[key])) {
          const existingVal = this.formSearch[key];
          this.$set(
            this.formSearch,
            key,
            existingVal != null ? [String(existingVal), ""] : ["", ""]
          );
        }
      });
    },
    // 统一的自动识别范围时间字段方法
    async autoDetectRangeTimeFields(swaggersearchColumns) {
      const tableSearch = [];
      // 1. 处理 BeginTime, EndTime 特殊情况
      const tableHasCreatedTime = this.formSearchData.tableSearch.some(
        e => e.value === "createdTime"
      );
      if (!tableHasCreatedTime) {
        const requiredNames = ["BeginTime", "EndTime"];
        const hseCreatedTime = requiredNames.every(name =>
          swaggersearchColumns.some(item => item.name === name)
        );
        if (hseCreatedTime) {
          tableSearch.push({
            label: "创建时间",
            value: "createdTime",
            inputType: "picker",
            span: 2,
            props: {
              type: "datetimerange",
              startPlaceholder: "开始时间",
              endPlaceholder: "结束时间",
              placeholder: "选择时间范围",
              valueFormat: "yyyy-MM-dd HH:mm:ss",
              format: "yyyy/MM/dd HH:mm:ss",
            },
            originalFields: {
              begin: "BeginTime",
              end: "EndTime",
            },
          });
        }
      }

      // 2. 自动识别 xxxxBegin 和 xxxxEnd 格式的范围时间字段
      const beginFields = swaggersearchColumns.filter(item => item.name.endsWith("Begin"));

      const endFields = swaggersearchColumns.filter(item => item.name.endsWith("End"));

      // 找出匹配的 Begin 和 End 字段对
      const rangeTimePairs = [];
      beginFields.forEach(item => {
        const prefix = item.name.replace("Begin", "");
        const correspondingEndField = prefix + "End";
        const endTemp = endFields.find(e => e.name === correspondingEndField);
        if (endTemp) {
          rangeTimePairs.push({
            ...item,
            description: item.description || endTemp.description || "", //先用Begin的中文，没有就用End的
            beginField: item.name,
            endField: correspondingEndField,
            timeField: prefix + "Time",
            label: prefix,
          });
        }
      });

      // 使用 for...of 循环等待所有异步操作完成
      for (const pair of rangeTimePairs) {
        const { beginField, endField, timeField, description } = pair;

        // 检查是否已经存在该时间字段
        const timeFieldExists = this.formSearchData.tableSearch.some(
          item => item.value === timeField
        );

        if (!timeFieldExists) {
          // const labelCHN = await camelCaseToChinese(label); //内网项目无法使用
          const labelCHN = description;

          // 从 formSearchData.value 中移除原始字段
          this.removeOriginalFieldsFromValue([beginField, endField]);

          tableSearch.push({
            label: labelCHN,
            value: timeField,
            inputType: "picker",
            span: 2,
            props: {
              type: "datetimerange",
              startPlaceholder: "开始时间",
              endPlaceholder: "结束时间",
              placeholder: `选择${labelCHN}范围`,
              valueFormat: "yyyy-MM-dd HH:mm:ss",
              format: "yyyy/MM/dd HH:mm:ss",
            },
            originalFields: {
              begin: beginField,
              end: endField,
            },
          });
        }
      }
      return tableSearch;
    },
    // 新增方法：从 formSearchData.value 中移除原始字段
    removeOriginalFieldsFromValue(removeKeys) {
      removeKeys.forEach(key => {
        const index = this.formSearchData.tableSearch.findIndex(item => item.value === key);
        if (index !== -1) {
          this.formSearchData.tableSearch.splice(index, 1);
        }
      });
    },
    // 树形下拉
    getValue(val) {
      this.$emit("getTreeSelectValue", val);
    },
    /** 根据字段类型返回默认比较符（与 compare-prefix-select 的默认值一致） */
    getDefaultCompare(item) {
      if (!item) return "contains";
      if (item.inputType === "select" || item.inputType === "selectTEMP") return "eq";
      if (item.inputType === "picker") {
        const rangeTypes = ["daterange", "datetimerange", "monthrange"];
        const isRange =
          (item.props && rangeTypes.includes(item.props.type)) ||
          (item.dateType && rangeTypes.includes(item.dateType));
        return isRange ? "range" : "eq";
      }
      return "contains";
    },

    /** 清空所有查询条件和比较符映射 */
    clearAllFormConditions() {
      // 清空 formSearch 中所有值
      Object.keys(this.formSearch).forEach(key => {
        this.$set(this.formSearch, key, null);
      });
      // 清空比较符映射，并恢复下拉框单选模式
      Object.keys(this.compareMap).forEach(key => {
        this.$set(this.compareMap, key, undefined);
        var item = this.formSearchData.tableSearch.find(function (t) {
          return t.value === key;
        });
        if (item) {
          this.syncFieldMultiple(item, undefined);
        }
      });
    },

    /** 选中组合查询条件 — 先清空所有条件，再回填预设值；传空则只清空 */
    handleComboSelect(name) {
      // 先清空所有查询条件
      this.clearAllFormConditions();
      if (!name) {
        this.activeComboPreset = null;
        return;
      }
      var preset = this.comboPresets.find(function (p) {
        return p.name === name;
      });
      if (!preset) return;

      // 回填 filterConditions 到 formSearch
      if (preset.filterConditions && Array.isArray(preset.filterConditions)) {
        preset.filterConditions.forEach(cond => {
          var compare =
            (preset.compareMap && preset.compareMap[cond.key]) ||
            this.getDefaultCompare(
              this.formSearchData.tableSearch.find(function (t) {
                return t.value === cond.key;
              })
            );
          // range / in / not in 需要数组值，其他取单值
          var isArr = compare === "range" || compare === "in" || compare === "not in";
          var val = isArr
            ? cond.values || []
            : cond.values && cond.values.length > 0
            ? cond.values[0]
            : null;
          this.$set(this.formSearch, cond.key, val);
        });
      }

      // 回填 compareMap 并同步下拉框多选状态
      if (preset.compareMap) {
        Object.keys(preset.compareMap).forEach(key => {
          this.$set(this.compareMap, key, preset.compareMap[key]);
          var item = this.formSearchData.tableSearch.find(function (t) {
            return t.value === key;
          });
          if (item) {
            this.syncFieldMultiple(item, preset.compareMap[key]);
          }
        });
      }

      this.activeComboPreset = name;
    },

    /** 保存当前搜索条件为组合查询方案（新增或覆盖同名方案） */
    handleSaveCombo() {
      this.$prompt("请输入组合条件名称", "保存组合查询条件", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S/,
        inputErrorMessage: "名称不能为空",
      })
        .then(res => {
          var name = res.value.trim();

          // 检查名称是否已存在
          var existingIndex = -1;
          for (var i = 0; i < this.comboPresets.length; i++) {
            if (this.comboPresets[i].name === name) {
              existingIndex = i;
              break;
            }
          }
          if (existingIndex >= 0) {
            this.$message.warning('组合条件名称"' + name + '"已存在，请使用其他名称');
            return;
          }

          var filterConditions = this.setFilterConditionsByFormSearch(this.formSearch) || [];

          if (filterConditions.length === 0) {
            this.$message.warning('请先填写查询条件，不能保存空的组合查询');
            return;
          }

          var newPreset = {
            name: name,
            filterConditions: filterConditions,
            compareMap: Object.assign({}, this.compareMap),
          };

          this.comboPresets.push(newPreset);

          this.activeComboPreset = name;

          // 持久化到后端
          this.saveToApi(
            {
              isCustomSearch: true,
              customSearch: JSON.stringify(this.comboPresets),
            },
            '组合条件"' + name + '"保存成功'
          );
        })
        .catch(() => {});
    },

    /** 删除下拉框中指定的一条组合查询条件 */
    handleComboDeleteItem(name, index) {
      this.$confirm('确定要删除组合条件"' + name + '"吗？', "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          // 如果删的是当前选中的，清空选中状态和表单条件
          if (this.activeComboPreset === name) {
            this.activeComboPreset = null;
            this.clearAllFormConditions();
          }
          this.comboPresets.splice(index, 1);
          this.saveToApi(
            {
              isCustomSearch: true,
              customSearch: JSON.stringify(this.comboPresets),
            },
            "删除成功"
          );
        })
        .catch(() => {});
    },

    /** 统一的保存方法 —— 调用方通过 data 决定传哪些字段，各存各的不互相覆盖 */
    saveToApi(data, successMsg) {
      var targetMenuId = this.getTargetMenuId();
      this.put({
        url: "/api/app/menu-search-setting/" + targetMenuId + "?sysMenuId=" + targetMenuId,
        data: {
          isSettingJson: true,
          settingJson: JSON.stringify(this.formSearchData.tableSearch),
          ...data,
        },
      }).then(res => {
        if (res.code !== 200) return;
        this.$message.success(successMsg || "保存成功");
      });
    },

    setFilterConditionsByFormSearch(formSearch) {
      const filterConditions = [];
      Object.keys(formSearch).forEach(key => {
        const tempItem = this.formSearchData.tableSearch.find(item => item.value === key);
        if (!tempItem || tempItem.isDirect) return;
        const val = formSearch[key];
        if (val !== undefined && val !== null) {
          // 数组值（如范围输入）：全部为空则跳过
          if (Array.isArray(val)) {
            if (val.every(v => v === "" || v === null || v === undefined)) return;
          } else if (val === "") {
            return;
          }
          filterConditions.push({
            key: key,
            values: Array.isArray(val) ? val : [val],
            compare: this.compareMap[key] || this.getDefaultCompare(tempItem),
          });
        }
      });
      return filterConditions;
    },
    // 搜索查询按钮
    handleSearch(formName, item) {
      if (!this.isCustomSearch) {
        if (this.formSearch.createdTime) {
          this.formSearch.BeginTime = this.formSearch.createdTime[0];
          this.formSearch.EndTime = this.formSearch.createdTime[1];
        } else {
          this.formSearch.BeginTime = null;
          this.formSearch.EndTime = null;
        }
        // 有originalFields字段的就是范围时间，查询时候转回接口需要的字段
        Object.keys(this.formSearch).forEach(key => {
          const fieldConfig = this.formSearchData.tableSearch.find(item => item.value === key);
          if (fieldConfig && fieldConfig.originalFields) {
            const { begin, end } = fieldConfig.originalFields;
            if (this.formSearch[key] && Array.isArray(this.formSearch[key])) {
              this.formSearch[begin] = this.formSearch[key][0];
              this.formSearch[end] = this.formSearch[key][1];
            } else {
              this.formSearch[begin] = null;
              this.formSearch[end] = null;
            }
          }
        });

        const tempFormSearch = Object.assign({}, this.formSearch);
        if (this.formSearchData.rules) {
          return this.$refs[formName].validate(valid => {
            if (!valid) return false;
            this.$emit("handleSearch", tempFormSearch, item);
          });
        }
        this.$emit("handleSearch", tempFormSearch, item);
        console.log(`\x1b[36m\x1b[4mol插件-搜索框查询`, tempFormSearch);
      } else {
        // 查询前兜底校验范围字段，防止用户未触发 blur 直接点查询
        this.formSearchData.tableSearch.forEach(item => {
          if (item.inputType === "number") {
            this.handleRangeValidate(item);
          }
        });
        // 转成接口需要的结构filterConditions
        var filterConditions = [];
        // 1. 先取组合查询条件的 filterConditions（作为基础）
        if (this.activeComboPreset) {
          var currentName = this.activeComboPreset;
          var comboPreset = this.comboPresets.find(function (p) {
            return p.name === currentName;
          });
          if (comboPreset && comboPreset.filterConditions) {
            filterConditions = comboPreset.filterConditions.slice();
          }
        }
        // 2. 当前查询条件覆盖组合条件（同 key 的后覆盖前）
        var currentConditions = this.setFilterConditionsByFormSearch(this.formSearch) || [];
        for (var ci = 0; ci < currentConditions.length; ci++) {
          var cc = currentConditions[ci];
          var idx = -1;
          for (var fi = 0; fi < filterConditions.length; fi++) {
            if (filterConditions[fi].key === cc.key) {
              idx = fi;
              break;
            }
          }
          if (idx >= 0) {
            filterConditions[idx] = cc;
          } else {
            filterConditions.push(cc);
          }
        }

        // 提取需要直接作为请求参数的字段（前端写死且 isDirect 为 true 的字段）
        const directParams = {};
        Object.keys(this.formSearch).forEach(key => {
          const tempItem = this.formSearchData.tableSearch.find(item => item.value === key);
          if (tempItem && tempItem.isDirect) {
            directParams[key] = this.formSearch[key];
          }
        });

        // 动态模式
        this.$emit("handleSearch", this.formSearch, { filterConditions, directParams });
        console.log(`\x1b[36m\x1b[4mol插件-动态搜索框查询`, this.formSearch, {
          filterConditions,
          directParams,
        });
      }
    },
    loadmore(obj) {
      this.$emit("loadmore", obj);
    },
    // 搜索重置按钮
    handleReset(formName) {
      this.$refs[formName].resetFields();
      if (this.formSearchData.reset) {
        for (const key in this.formSearch) {
          if (Object.prototype.toString.call(this.formSearch[key]) === "[object String]") {
            this.formSearch[key] = null;
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Array]") {
            this.formSearch[key] = [];
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Object]") {
            this.formSearch[key] = {};
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Boolean]") {
            this.formSearch[key] = false;
          } else {
            this.formSearch[key] = null;
          }
        }
      } else {
        this.formSearch = {
          ...this.formSearchData.value,
        };
      }
      // 重置后恢复范围字段的数组格式，同时重置组合查询
      if (this.isCustomSearch) {
        this.initRangeFields();
        this.activeComboPreset = null;
        this.clearAllFormConditions();
      }
      this.$emit("handleReset", this.formSearch);
      if (this.formSearchData.reset) return false;
      this.handleSearch();
    },
    /** 组合查询显隐或列数变化时，重新计算可见搜索项 */
    recalcVisibleItems() {
      var totalSpan = this.formSearchData.tableSearch.reduce(function (sum, item) {
        return sum + (item.span || 1);
      }, 0);
      var overflows = totalSpan > this.availableSpan;
      if (this.expend) {
        // 展开状态直接显示全部；但如果现在能在一行放下了，自动收起
        if (!overflows) {
          this.expend = false;
        }
        this.findTableSearch = this.formSearchData.tableSearch;
      } else {
        this.findTableSearch = overflows
          ? this.sliceBySpan(this.formSearchData.tableSearch, this.availableSpan)
          : this.formSearchData.tableSearch;
      }
    },
    // 展开和收起
    handleExpend() {
      this.expend = !this.expend; // 展开和收起
      this.findTableSearch = this.expend
        ? this.formSearchData.tableSearch.slice()
        : this.sliceBySpan(this.formSearchData.tableSearch, this.availableSpan);

      this.$emit("btnHandleExpend", this.expend);
    },
    /** 按每项 span 累计值切片，用于折叠时显示前 N 列 */
    sliceBySpan(items, maxSpan) {
      var cumulative = 0;
      for (var i = 0; i < items.length; i++) {
        var itemSpan = items[i].span || 1;
        if (itemSpan > maxSpan) {
          itemSpan = maxSpan;
        }
        if (cumulative + itemSpan > maxSpan) {
          return items.slice(0, i);
        }
        cumulative += itemSpan;
      }
      return items.slice();
    },
    getTargetMenuId() {
      const handleMenu = (arr, _this) => {
        for (const item of arr) {
          if (item.path === _this.$route.path) {
            return item;
          }
          if (item.child && item.child.length > 0 && item.type !== 1) {
            const found = handleMenu(item.child, _this);
            if (found) return found;
          }
        }
        return null;
      };
      let wms = JSON.parse(localStorage.getItem("wms"));
      let SET_MENUS = null;
      if (wms) SET_MENUS = wms.SET_MENUS;
      const menus = SET_MENUS;
      const currentPageItem = handleMenu(menus, this);
      return (
        this.$attrs.menuId || this.$route.query.menuId || (currentPageItem && currentPageItem.id)
      );
    },
    handleSave() {
      if (!this.isCustomSearch) {
        if (this.formSearch.createdTime) {
          this.formSearch.BeginTime = this.formSearch.createdTime[0];
          this.formSearch.EndTime = this.formSearch.createdTime[1];
        } else {
          this.formSearch.BeginTime = null;
          this.formSearch.EndTime = null;
        }
        Object.keys(this.formSearch).forEach(key => {
          const fieldConfig = this.formSearchData.tableSearch.find(item => item.value === key);
          if (fieldConfig && fieldConfig.originalFields) {
            const { begin, end } = fieldConfig.originalFields;
            if (this.formSearch[key] && Array.isArray(this.formSearch[key])) {
              this.formSearch[begin] = this.formSearch[key][0];
              this.formSearch[end] = this.formSearch[key][1];
            } else {
              this.formSearch[begin] = null;
              this.formSearch[end] = null;
            }
          }
        });
        const tempFormSearch = Object.assign({}, this.formSearch);
        this.$emit("handleSave", tempFormSearch);
        console.log(`\x1b[36m\x1b[4mol插件-搜索框保存`, tempFormSearch);
      } else {
        const filterConditions = this.setFilterConditionsByFormSearch(this.formSearch) || [];
        console.log(`\x1b[36m\x1b[4mol插件-动态搜索框保存`, this.formSearch, filterConditions);
        console.log(
          112233,
          this.formSearchData,
          this.formSearch,
          filterConditions,
          this.compareMap,
          this.findTableSearch
        );
        // 持久化：只传 settingJson + defaultFilterJson，不影响 customSearch
        this.saveToApi(
          {
            isDefaultFilterJson: true,
            defaultFilterJson: JSON.stringify({ filterConditions, compareMap: this.compareMap }),
          },
          "保存成功"
        );
      }
    },
    handleOpenConfig() {
      this.configDialogVisible = true;
    },
    handleSaveConfig(configList) {
      if (this.isCustomSearch) {
        this.key++; // 下拉框多选时候高度被撑开，改成单选时候高度无法重置。所以重写渲染。这里不管直接全都重写渲染
      }
      // 记录保存前收展按钮是否可见
      const wasExpendBtnVisible = this.showExpendBtn;
      // 前端追加的搜索条件不参与配置，但需要一直保留在搜索区域
      const frontAppendList = (this.formSearchData.tableSearch || []).filter(
        item => item.isFrontAppend
      );
      this.formSearchData.tableSearch = [...frontAppendList, ...configList];
      // 保存配置后初始化范围字段为数组格式
      if (this.isCustomSearch) {
        this.initRangeFields();
      }
      // 补齐 span 默认值
      this.formSearchData.tableSearch.forEach(function (item) {
        if (item.span == null) {
          item.span = 1;
        }
      });
      var totalSpan = this.formSearchData.tableSearch.reduce(function (sum, item) {
        return sum + (item.span || 1);
      }, 0);
      var isMoreThanSlice = totalSpan > this.availableSpan;

      if (isMoreThanSlice) {
        // 如果之前没有收展按钮，现在有了，默认收起
        if (!wasExpendBtnVisible) {
          this.expend = false;
        }
        // 保持当前 expend 状态决定显示全部还是折叠
        this.findTableSearch = this.expend
          ? this.formSearchData.tableSearch
          : this.sliceBySpan(this.formSearchData.tableSearch, this.availableSpan);
      } else {
        // 不超出一行，全部显示
        this.expend = true;
        this.findTableSearch = this.formSearchData.tableSearch;
      }
      this.$emit("onSave", configList);
    },
    async loadOptionSources() {
      for (const item of this.formSearchData.tableSearch) {
        if (item.inputType === "select" && item.optionSource) {
          await this.loadItemOptions(item);
        }
      }
    },
    async loadItemOptions(item) {
      if (!item.optionSource) return;

      const { sourceType } = item.optionSource;

      if (sourceType === "dict") {
        await this.loadDictOptions(item);
      } else if (sourceType === "api") {
        await this.loadApiOptions(item);
      }
    },
    async loadDictOptions(item) {
      try {
        const dictKey = item.optionSource.dictKey;
        if (!dictKey) return;

        const dictData = await this.getDictData(dictKey);
        if (dictData && Array.isArray(dictData)) {
          const children = dictData.map(d => ({
            key: d.key,
            value: d.value,
          }));
          this.$set(item, "children", children);
        }
      } catch (error) {
        console.error("加载字典数据失败:", error);
      }
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
          this.$set(item, "children", children);
        }
      } catch (error) {
        console.error("加载接口数据失败:", error);
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
    // input为number校验
    handleChangeInput(item) {
      return item.inputType === "number"
        ? this.handleOnInput(this.formSearch[item.value], item.value, item.max)
        : null;
    },
    keyInput(item, e) {
      if (item.inputType === "number") {
        let key = e.key;
        if (key === "e" || key === "E" || key === "-" || key === "+" || key === ".") {
          e.returnValue = false;
          return false;
        }
        return true;
      }
    },
    // 输入框的粘贴事件
    onPaste(item, e) {
      if (item.inputType === "number") {
        const pastedText = e.clipboardData.getData("text");
        const nonNumericPattern = /[^\d]/g;
        if (nonNumericPattern.test(pastedText)) {
          e.preventDefault();
        }
      }
    },
    // input渲染长度校验
    handleOnInput(val, label, max) {
      if (val && Number(val) <= 0) {
        this.formSearch[label] = 0;
      }
      if (val && Number(val) > max) {
        this.formSearch[label] = max;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// ============================================================
//  搜索框布局（只做布局，不修改 Element UI 组件样式）
//    1. 一行 4 个搜索字段，gap 统一控制间距
//    2. 右侧按钮始终一行，不换行
//    3. label 固定 6em + 右对齐，输入框跨行对齐
//    4. 输入框 flex:1 占据剩余空间
// ============================================================

$row-gap: 8px;
$col-gap: 8px;
// 使用 CSS 自定义属性，由 span prop 动态控制
// 默认 4 列，可通过 props、formSearchData.options、$olBaseConfig 覆盖
$label-width: 78px;

// ==================== 顶栏 ====================
.table-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  min-height: 49px;

  .el-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    width: 100%;
  }

  // ==================== 组合查询条件格子 ====================
  .combo-grid-item {
    display: flex;
    align-items: center;
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    min-width: 0;
    // background: var(--color-primary-light-9, #f0f9ff);
    // background: color-mix(in srgb, var(--color-primary) 5%, #fff);
    background: var(--color-primary-light-9, #ecf5ff);
    border-radius: 3px;

    .combo-grid-label {
      width: var(--form-search-label-width, $label-width);
      flex-shrink: 0;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 6px;
      font-size: var(--form-search-label-font-size, 12px);
      color: var(--color-primary, #409eff);
    }

    .combo-grid-content {
      flex: 1;
      min-width: 0;
    }
  }

  // 覆盖 el-form--inline 的 inline-block，改为 flex 以便输入框撑满
  ::v-deep .el-form-item {
    display: flex;
    margin-right: 0;
    margin-bottom: 0;
  }
}

// ==================== 搜索字段网格 ====================
// 使用 CSS Grid 替代 flexbox，支持每项 grid-column: span N 跨列
.transitionGroup {
  display: grid;
  grid-template-columns: repeat(var(--form-search-span, 4), 1fr);
  flex: 1;
  min-width: 0;
  gap: $row-gap $col-gap;
  padding-top: 2px;

  .el-form-item {
    // 宽度由 CSS Grid 自动分配，通过 :style 设置 grid-column 控制跨列
    display: flex;
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    min-width: 0;

    // 标签：固定宽度 + 右对齐，保证跨行输入框左对齐
    ::v-deep .el-form-item__label {
      width: var(--form-search-label-width, $label-width);
      flex-shrink: 0;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 6px;
      font-size: var(--form-search-label-font-size, 12px);
    }

    // 内容区：占据剩余空间
    ::v-deep .el-form-item__content {
      flex: 1;
      min-width: 0;
    }

    // 输入组件撑满内容区
    .el-select,
    .el-input,
    .el-date-editor {
      width: 100%;
    }
  }
}

// ==================== 比较符前缀 + 输入框组合 ====================
.select-with-prefix,
.input-with-prefix {
  display: flex;
  align-items: center;
  gap: 4px;

  .el-select,
  .el-input {
    flex: 1;
  }

  .range-separator {
    flex: none;
    width: 20px;
    text-align: center;
    color: #909399;
    font-size: 14px;
  }
}

// ==================== 右侧按钮组 ====================
.fromBtn {
  flex-shrink: 0;
  margin-left: auto !important;

  ::v-deep .el-form-item__content {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-wrap: nowrap;
  }

  .el-button {
    margin-left: 0 !important;
  }

  // ==================== 多选标签：不换行 + 超长截断 ====================
  ::v-deep .el-select .el-select__tags {
    max-width: 100% !important;
    overflow: hidden !important;
    flex-wrap: nowrap !important;
  }
  ::v-deep .el-select .el-select__tags-text {
    display: inline-block;
    max-width: 64px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    vertical-align: middle;
  }
}
</style>
<style scoped>
.custom-select ::v-deep .el-select__tags {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}

.custom-select ::v-deep .el-select__tags > span:first-child {
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  padding-left: 3px;
}
.custom-select ::v-deep .el-select__tags > span:first-child > span:first-child {
  display: flex;
  flex-wrap: nowrap;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  width: calc(100% - 42px);
}

/* ----- 每个标签（普通标签） ----- */
.custom-select ::v-deep .el-tag.el-tag--info {
  background: #f0f2f5;
  border: none;
  padding: 0 8px;
  /* max-width: 70%; */
  flex-shrink: 1; /* 空间不足时收缩 */
  /* min-width: 30px; */
  display: inline-flex;
  align-items: center;
  transition: background 0.2s;
  margin: 1px 0;
}

/* ----- 标签内文字（强制一行显示） ----- */
.custom-select ::v-deep .el-tag .el-select__tags-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* ★ 强制单行，绝不换行 */
  vertical-align: middle;
  margin-top: 2px;
}
.custom-select ::v-deep .el-tag .el-icon-close {
  margin-top: 2px;
}

/* ----- 标签关闭按钮 ----- */
.custom-select ::v-deep .el-tag .el-tag__close {
  font-size: 12px;
  color: #86909c;
  background: transparent;
  padding: 0;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.custom-select ::v-deep .el-tag .el-tag__close:hover {
  background: #e5e6eb;
  color: #1d2129;
}

/* ----- 折叠 "+N" 标签（.is-hit） ----- */
.custom-select ::v-deep .el-tag.is-hit {
  background: #e8f3ff;
  color: #3370ff;
  border: none;
  font-weight: 500;
  padding: 0 12px;
  max-width: 100px; /* +N 不宜过宽 */
}
.custom-select ::v-deep .el-tag.is-hit .el-tag__close {
  display: none; /* +N 无关闭按钮 */
}

/* ----- 输入框样式 ----- */
.custom-select ::v-deep .el-input__inner {
  border-color: #d9dde4;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.custom-select ::v-deep .el-input__inner:hover {
  border-color: #b3bcc6;
}
.custom-select ::v-deep .el-input__inner:focus {
  border-color: #3370ff;
  box-shadow: 0 0 0 3px rgba(51, 112, 255, 0.12);
}

/* ----- 输入框后缀（箭头）位置修复 ----- */
.custom-select ::v-deep .el-input .el-input__suffix {
  top: 50%;
  transform: translateY(-50%);
}

/* ----- 下拉菜单选项 ----- */
.custom-select ::v-deep .el-select-dropdown__item {
  font-size: 13px;
  padding: 0 16px;
  /* height: 34px;
  line-height: 34px; */
}
.custom-select ::v-deep .el-select-dropdown__item.selected {
  font-weight: 500;
  color: #3370ff;
}

/* ----- 禁用状态保留样式 ----- */
.custom-select ::v-deep .el-input.is-disabled .el-input__inner {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}
</style>
