<template>
  <div class="ol-crud" :class="{ 'ol-crud--loading': fetchingData }">
    <!-- ==================== 搜索栏 ==================== -->
    <div v-if="$cfg('showSearch')" class="crud-search">
      <!-- 动态配置模式 + 无搜索字段：引导配置 -->
      <div v-if="searchFields.length === 0 && $cfg('showCustomSearch')" class="crud-search-empty">
        <span class="crud-search-empty-text">暂未配置搜索条件</span>
        <el-button plain size="small" icon="el-icon-setting" @click="openConfigDialog"
          >配置搜索字段</el-button
        >
      </div>

      <!-- 有搜索字段：正常渲染表单 -->
      <el-form
        v-if="searchFields.length > 0"
        ref="searchForm"
        :model="internalSearchModel"
        :inline="true"
        size="small"
        label-position="right"
        :rules="searchRules"
        class="crud-search-form"
      >
        <div class="crud-search-fields">
          <el-form-item
            v-for="field in visibleSearchFields"
            :key="field.prop"
            :prop="field.prop"
            class="crud-search-item"
          >
            <template slot="label">
              <el-tooltip
                :content="field.label"
                :disabled="!field.label || field.label.length <= 5"
                placement="top"
              >
                <span>{{ field.label }}</span>
              </el-tooltip>
            </template>
            <!-- 文本输入 -->
            <div
              v-if="field.type === 'input'"
              :class="$cfg('showCustomSearch') ? 'input-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="$cfg('showCustomSearch')"
                :value="compareMap[field.prop] || field.compare || 'contains'"
                @change="handleCompareChange(field, $event)"
              />
              <el-input
                v-model="internalSearchModel[field.prop]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                clearable
                v-bind="field.props || {}"
                @keyup.enter.native="handleSearch"
              />
            </div>

            <!-- 数字输入 -->
            <div
              v-else-if="field.type === 'number'"
              :class="$cfg('showCustomSearch') ? 'input-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="$cfg('showCustomSearch')"
                :value="compareMap[field.prop] || field.compare || 'contains'"
                @change="handleCompareChange(field, $event)"
              />
              <el-input
                v-model="internalSearchModel[field.prop]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                clearable
                v-bind="field.props || {}"
                class="crud-number-input"
                @keyup.enter.native="handleSearch"
                @keydown.native="onNumberKeydown"
                @paste.native="onNumberPaste"
                @input.native="onNumberInput($event, field)"
              />
            </div>

            <!-- 下拉选择 -->
            <div
              v-else-if="field.type === 'select'"
              :class="$cfg('showCustomSearch') ? 'select-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="$cfg('showCustomSearch')"
                :value="compareMap[field.prop] || field.compare || 'eq'"
                @change="handleCompareChange(field, $event)"
              />
              <el-select
                class="custom-select"
                v-model="internalSearchModel[field.prop]"
                :key="`sel_${field.prop}_${(field.props && field.props.multiple) ? 'multi' : 'single'}`"
                :placeholder="field.placeholder || `请选择${field.label}`"
                v-bind="{ clearable: true, collapseTags: true, ...(field.props || {}) }"
                :popper-append-to-body="false"
                @change="onFieldChange(field)"
                @keyup.enter.native="handleSearch"
              >
                <el-option
                  v-for="opt in field.options || []"
                  :key="opt.key !== undefined ? opt.key : opt.value"
                  :label="opt.label || opt.value || opt.key"
                  :value="opt.key !== undefined ? opt.key : opt.value"
                />
              </el-select>
            </div>

            <!-- 远程搜索下拉（滚动加载更多） -->
            <div
              v-else-if="field.type === 'remoteSelect'"
              :class="$cfg('showCustomSearch') ? 'select-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="$cfg('showCustomSearch')"
                :value="compareMap[field.prop] || field.compare || 'eq'"
                @change="handleCompareChange(field, $event)"
              />
              <el-select
                class="custom-select"
                v-model="internalSearchModel[field.prop]"
                :key="`rsel_${field.prop}_${(field.props && field.props.multiple) ? 'multi' : 'single'}`"
                v-el-select-loadmore="() => handleSelectLoadMore(field)"
                filterable
                remote
                reserve-keyword
                :placeholder="field.placeholder || `请输入关键字搜索`"
                v-bind="{ clearable: true, collapseTags: true, ...(field.props || {}) }"
                :remote-method="query => handleRemoteSearch(field, query)"
                :loading="field.loading"
                :popper-append-to-body="false"
                @change="onFieldChange(field)"
                @keyup.enter.native="handleSearch"
              >
                <el-option
                  v-for="opt in field.options || []"
                  :key="opt.key !== undefined ? opt.key : opt.value"
                  :label="opt.label || opt.value || opt.key"
                  :value="opt.key !== undefined ? opt.key : opt.value"
                />
              </el-select>
            </div>

            <!-- 日期选择（含旧格式 picker 兜底） -->
            <el-date-picker
              v-else-if="field.type === 'date' || field.type === 'picker'"
              v-model="internalSearchModel[field.prop]"
              type="date"
              :placeholder="field.placeholder || '选择日期'"
              clearable
              style="width: 100%"
              v-bind="field.props || {}"
            />

            <!-- 日期时间选择 -->
            <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="internalSearchModel[field.prop]"
              type="datetime"
              :placeholder="field.placeholder || '选择日期时间'"
              clearable
              style="width: 100%"
              v-bind="field.props || {}"
            />

            <!-- 日期范围 -->
            <el-date-picker
              v-else-if="field.type === 'daterange'"
              v-model="internalSearchModel[field.prop]"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              clearable
              style="width: 100%"
              v-bind="field.props || {}"
            />

            <!-- 日期时间范围 -->
            <el-date-picker
              v-else-if="field.type === 'datetimerange'"
              v-model="internalSearchModel[field.prop]"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              clearable
              style="width: 100%"
              :default-time="['00:00:00', '23:59:59']"
              v-bind="field.props || {}"
            />

            <!-- 数字范围 -->
            <ol-number-range
              v-else-if="field.type === 'numberRange'"
              v-model="internalSearchModel[field.prop]"
              v-bind="field.props || {}"
            />

            <!-- 默认：文本输入 -->
            <div
              v-else
              :class="$cfg('showCustomSearch') ? 'input-with-prefix' : ''"
              style="width: 100%"
            >
              <compare-prefix-select
                v-if="$cfg('showCustomSearch')"
                :value="compareMap[field.prop] || field.compare || 'contains'"
                @change="handleCompareChange(field, $event)"
              />
              <el-input
                v-model="internalSearchModel[field.prop]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                clearable
                v-bind="field.props || {}"
                @keyup.enter.native="handleSearch"
              />
            </div>
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="crud-search-actions">
          <el-button type="primary" size="small" :disabled="fetchingData" @click="handleSearch"
            >查询</el-button
          >
          <el-button plain size="small" @click="handleReset">重置</el-button>
          <el-button
            v-if="searchFields.length > columnsPerRow"
            plain
            size="small"
            :icon="searchExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
            @click="searchExpanded = !searchExpanded"
          >
            {{ searchExpanded ? "收起" : "展开" }}
          </el-button>
          <el-dropdown
            v-if="$cfg('showCustomSearch')"
            size="small"
            trigger="click"
            style="margin-left: 8px"
          >
            <el-button plain size="small" icon="el-icon-more" />
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="openConfigDialog">
                <i class="el-icon-setting" /> 配置
              </el-dropdown-item>
              <el-dropdown-item @click.native="handleSaveSearch">
                <i class="el-icon-document-checked" /> 保存搜索条件
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-form>

      <!-- 无搜索字段 + 非配置模式：至少展示查询/重置按钮 -->
      <div
        v-if="searchFields.length === 0 && !$cfg('showCustomSearch')"
        class="crud-search-actions"
      >
        <el-button type="primary" size="small" :disabled="fetchingData" @click="handleSearch"
          >查询</el-button
        >
        <el-button plain size="small" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- ==================== 搜索配置弹窗 ==================== -->
    <search-config-dialog
      v-if="configDialogVisible"
      :visible.sync="configDialogVisible"
      :table-search="searchFieldsForDialog"
      :form-search-data="formSearchDataForDialog"
      :form-search="searchModelForDialog"
      :customs="resolvedCustoms"
      @save="handleSaveConfig"
      v-bind="$attrs"
    />

    <!-- ==================== 工具栏 ==================== -->
    <div v-if="toolbarVisible" class="crud-toolbar">
      <div class="crud-toolbar-left">
        <!-- 配置按钮之前 -->
        <slot name="toolbarBefore" v-bind="toolbarSlotScope" />

        <!-- 菜单配置的按钮 -->
        <el-button
          v-for="(btn, index) in btnlist"
          :key="index"
          size="small"
          :type="btn.types ? btn.types : 'primary'"
          :disabled="btn.disabled"
          @click="btn.method"
        >
          <i v-if="btn.icon" :class="btn.icon" />
          {{ btn.title }}
        </el-button>

        <!-- 配置按钮之后 -->
        <slot name="toolbarAfter" v-bind="toolbarSlotScope" />
      </div>
      <div class="crud-toolbar-right">
        <!-- 工具按钮之前 -->
        <slot name="toolbarActions" v-bind="toolbarSlotScope" />

        <!-- 列配置：simple=下拉checkbox / persisted=弹窗拖拽 -->
        <template v-if="$cfg('showColumnFilterBtn')">
          <!-- simple 模式：下拉 checkbox -->
          <el-dropdown
            v-if="resolvedColumnConfigMode === 'simple'"
            trigger="click"
            class="crud-toolbar-action"
          >
            <span class="crud-toolbar-icon"><i class="el-icon-s-operation" /></span>
            <el-dropdown-menu slot="dropdown" class="crud-column-filter">
              <el-checkbox-group v-model="checkedColumns">
                <el-checkbox
                  v-for="col in filterableColumns"
                  :key="col.prop"
                  :label="col.prop"
                  class="crud-column-checkbox"
                >
                  {{ col.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-dropdown-menu>
          </el-dropdown>

          <!-- persisted 模式：点击打开弹窗 -->
          <span v-else class="crud-toolbar-icon" @click="openColumnConfig">
            <i class="el-icon-s-operation" />
          </span>
        </template>

        <!-- 刷新 -->
        <span v-if="$cfg('showRefreshBtn')" class="crud-toolbar-icon" @click="handleRefresh">
          <i class="el-icon-refresh" />
        </span>

        <!-- 打印 -->
        <span v-if="$cfg('showPrintBtn')" class="crud-toolbar-icon" @click="handlePrint">
          <i class="el-icon-printer" />
        </span>

        <!-- 智能打印（模板打印） -->
        <span v-if="$cfg('showSmartPrintBtn')" class="crud-toolbar-icon">
          <print-template-selector
            :menu-id="smartPrintMenuId"
            :print-data="printData || displayTableData"
            :multiple-selection="currentSelection"
            v-bind="$attrs"
          />
        </span>

        <!-- 实体变更记录 -->
        <span
          v-if="$cfg('showEntityChangeBtn')"
          class="crud-toolbar-icon"
          @click="openEntityChange"
          title="实体变更记录"
        >
          <i class="el-icon-receiving" />
        </span>

        <!-- 工具按钮之后 -->
        <slot name="toolbarActionsAfter" v-bind="toolbarSlotScope" />
      </div>
    </div>

    <!-- ==================== 表格 ==================== -->
    <div class="crud-table" :key="tableKey">
      <el-table
        ref="crudTable"
        v-loading="fetchingData"
        border
        :data="displayTableData"
        style="width: 100%"
        height="100%"
        v-bind="tableAttrs"
        @selection-change="onSelectionChange"
        @row-click="onRowClick"
        @sort-change="onSortChange"
      >
        <!-- 多选列 -->
        <el-table-column v-if="$cfg('showSelection')" width="55" align="center" type="selection" />

        <!-- 序号列 -->
        <el-table-column
          v-if="$cfg('showIndex')"
          width="55"
          align="center"
          type="index"
          label="序号"
          :index="computeIndex"
        />

        <!-- 列渲染：优先走 #column 插槽，否则自动渲染 -->
        <template v-if="$scopedSlots.column">
          <slot name="column" :columns="visibleColumnsForSlot" />
        </template>
        <template v-else>
          <template v-for="col in visibleColumns">
            <TableColumn :column="col" :key="col.prop">
              <template v-for="(slotFn, slotName) in $scopedSlots" v-slot:[slotName]="slotProps">
                <slot :name="slotName" v-bind="slotProps" />
              </template>
            </TableColumn>
          </template>
        </template>

        <!-- 操作列 -->
        <el-table-column
          v-if="operates && operates.length > 0"
          v-bind="{
            label: '操作',
            align: 'center',
            minWidth: operatesMinWidth,
            ...(operatesAttrs || {}),
          }"
        >
          <template slot-scope="{ row, $index }">
            <div class="crud-operate-group">
              <template v-for="(btn, idx) in operates">
                <el-button
                  v-if="typeof btn.hidden === 'function' ? !btn.hidden(row, $index) : !btn.hidden"
                  :key="idx"
                  :size="btn.size || 'small'"
                  :type="btn.type || 'text'"
                  :icon="btn.icon"
                  :disabled="
                    typeof btn.disabled === 'function' ? btn.disabled(row, $index) : !!btn.disabled
                  "
                  @click.stop="btn.click && btn.click(row, $index)"
                >
                  {{ btn.label }}
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <div slot="empty" class="crud-empty">
          <slot name="empty">
            <span>暂无数据</span>
          </slot>
        </div>
      </el-table>
    </div>

    <!-- ==================== 分页 ==================== -->
    <div v-if="displayPagination.show !== false" class="crud-pagination">
      <el-pagination
        :current-page="displayPagination.page"
        :page-sizes="resolvedPageSizes"
        :page-size="displayPagination.limit"
        :total="displayPagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>

    <!-- ==================== 列配置弹窗（persisted 模式，接口内置在 ol-column-config 中） ==================== -->
    <ol-column-config
      v-if="resolvedColumnConfigMode === 'persisted'"
      :visible.sync="columnConfigVisible"
      :columns="columnsForConfig"
      :page-key="pageKey"
      :menu-id="resolvedMenuId"
      :role-list="columnRoleList"
      @save="onColumnConfigSave"
    />

    <!-- ==================== 实体变更记录弹窗 ==================== -->
    <entity-change-record
      :visible.sync="entityChangeVisible"
      :selected-rows="currentSelection"
      :page-params="resolvedPageParams"
    />

    <!-- ==================== 隐藏打印模板 ==================== -->
    <print-template
      ref="printTemplate"
      v-show="false"
      class="crud-print-template"
      :print-list-obj="printListObj"
    />
  </div>
</template>

<script>
import EntityChangeRecord from "./components/EntityChangeRecord.vue";
import OlNumberRange from "../../numberRange/index.js";
import SearchConfigDialog from "../../formSearch/src/components/SearchConfigDialog.vue";
import TableColumn from "../../table/src/TableColumn.vue";
import PrintTemplateSelector from "../../table/src/components/PrintTemplateSelector.vue";
import PrintTemplate from "../../table/src/printTable.vue";
import { printTableElement } from "../../table/src/tablePrint.js";
import OlColumnConfig from "../../columnConfig/src/index.vue";
import { getEnum } from "../../../utils/getEnum.js";
import { basePropsOrderChange } from "../../../utils/initData.js";
import ComparePrefixSelect from "../../formSearch/src/components/ComparePrefixSelect.vue";

/**
 * ol-crud — 增删改查一体化组件
 *
 * 将搜索栏 + 数据表格 + 分页封装为一个组件，通过 slot 扩展按钮、列、表单等区域。
 *
 * ## 数据驱动设计
 *
 * ### searchField 搜索字段结构（替代旧 tableSearch）
 * {
 *   prop: String,          // 字段名（提交给后端的 key）
 *   label: String,         // 显示的标签
 *   type: String,          // 'input'|'number'|'select'|'date'|'datetime'|'daterange'|'datetimerange'|'numberRange'
 *   options: Array,        // select 选项 [{ label, value }] 或 [{ key, value }]
 *   visible: Boolean,      // 是否展示（默认 true）
 *   compare: String,       // 比较方式 'contains'|'eq'|'gt'|'lt'|'in'|...
 *   defaultValue: Any,     // 默认值
 *   placeholder: String,   // 占位文本
 *   props: Object,         // 透传给 Element UI 控件的属性
 *   optionSource: Object,  // 动态选项 { sourceType:'dict'|'api', dictKey:'', apiUrl:'', ... }
 * }
 *
 * ### column 表格列结构（替代旧 tableData.columns）
 * {
 *   prop: String,          // 字段名
 *   label: String,         // 列标题
 *   width: String|Number,  // 列宽
 *   minWidth: String,      // 最小列宽（默认 150px）
 *   sortable: Boolean,     // 是否可排序
 *   show: Boolean,         // 是否展示（默认 true）
 *   fixed: Boolean|String, // 固定列
 *   align: String,         // 对齐方式（默认 center）
 *   render: Function,      // 自定义渲染函数 (row) => VNode
 *   children: Array,       // 多级表头
 * }
 */

// --- 新旧数据结构互转（用于兼容 SearchConfigDialog） ---
// 注意：新格式 visible=true 表示展示；旧格式 show=false 表示展示（语义相反）
// 日期类型在旧格式统一用 inputType='picker'，实际类型存在 dateType 或 props.type

const DATE_TYPES = [
  "date",
  "datetime",
  "daterange",
  "datetimerange",
  "month",
  "monthrange",
  "year",
];

const newFieldToOld = field => ({
  ...field,
  value: field.prop,
  inputType: DATE_TYPES.includes(field.type) ? "picker" : field.type,
  children: field.options,
  dateType: DATE_TYPES.includes(field.type) ? field.type : undefined,
  show: !field.visible,
});

const oldFieldToNew = field => {
  const { value, inputType, children, dateType, ...rest } = field;
  // picker → 从 dateType 或 props.type 推导具体类型
  let type = inputType || field.type;
  if (type === "picker") {
    type = dateType || (field.props && field.props.type) || "date";
  }
  return {
    ...rest,
    prop: value || field.prop,
    type,
    options: children || field.options,
  };
};

export default {
  name: "crud",

  components: {
    OlNumberRange,
    SearchConfigDialog,
    ComparePrefixSelect,
    TableColumn,
    PrintTemplateSelector,
    PrintTemplate,
    OlColumnConfig,
    EntityChangeRecord,
  },

  directives: {
    /** el-select 滚动加载：滚动到接近底部时触发回调 */
    "el-select-loadmore": {
      bind(el, binding) {
        // el-select 的滚动容器是 .el-select-dropdown__wrap
        // 但 bind 时下拉框还没打开，需要用 MutationObserver 或延迟绑定
        const tryBind = () => {
          const wrap = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
          if (!wrap) return;
          wrap._loadmoreHandler = function () {
            // 距离底部 5px 以内视为滚动到底
            if (this.scrollHeight - this.scrollTop - this.clientHeight <= 5) {
              binding.value();
            }
          };
          wrap.addEventListener("scroll", wrap._loadmoreHandler);
        };
        // 保存绑定函数，在 inserted 时执行
        el._tryBindLoadmore = tryBind;
      },
      inserted(el) {
        // 延迟到 DOM 完全渲染后，仍可能找不到（下拉未打开），用事件代理兜底
        el._tryBindLoadmore && el._tryBindLoadmore();
      },
      unbind(el) {
        const wrap = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        if (wrap && wrap._loadmoreHandler) {
          wrap.removeEventListener("scroll", wrap._loadmoreHandler);
        }
      },
    },
  },

  props: {
    // ===== Swagger 自动映射 =====
    /** Swagger 接口路径（如 "/api/app/product"），自动获取列和搜索字段 */
    url: { type: String, default: "" },

    // ===== 搜索相关 =====
    /** 是否显示搜索栏。未传时回退到 $olBaseConfig */
    showSearch: { type: Boolean, default: true },
    /** 搜索字段配置数组 */
    searchFields: { type: Array, default: () => [] },
    /** 搜索表单初始值 */
    searchModel: { type: Object, default: () => ({}) },
    /** 每行展示的搜索字段数 */
    columnsPerRow: { type: Number, default: 4 },
    /** 搜索表单校验规则 */
    searchRules: { type: Object, default: () => ({}) },
    /** 是否显示"配置"按钮（动态勾选搜索字段）。未传时回退到 $olBaseConfig */
    showCustomSearch: { type: Boolean, default: false },
    /** 后端返回的可选搜索字段列表，用于配置弹窗 */
    customs: { type: Array, default: () => [] },
    /**
     * 菜单ID，用于搜索配置的持久化（加载/保存）。
     * 不传则自动从 localStorage.wms.SET_MENUS 根据当前路由匹配
     */
    menuId: { type: [String, Number], default: "" },

    // ===== 表格相关 =====
    /** 列配置数组 */
    columns: { type: Array, default: () => [] },
    /** 是否显示多选列。未传时回退到 $olBaseConfig */
    showSelection: { type: Boolean, default: true },
    /** 是否显示序号列。未传时回退到 $olBaseConfig */
    showIndex: { type: Boolean, default: true },
    /** 操作列按钮 */
    operates: { type: Array, default: () => [] },
    /** 操作列配置（透传 el-table-column） */
    operatesAttrs: { type: Object, default: () => ({}) },
    /** 透传给 el-table 的属性 */
    tableAttrs: { type: Object, default: () => ({}) },

    // ===== 工具栏相关 =====
    /** 列配置模式：'simple'=下拉checkbox | 'persisted'=弹窗拖拽+API持久化 */
    columnConfigMode: { type: String, default: "simple" },
    /** 列配置持久化的页面标识（默认取 $route.path） */
    pageKey: { type: String, default: "" },
    /** 是否显示列过滤入口。未传时回退到 $olBaseConfig */
    showColumnFilterBtn: { type: Boolean, default: true },
    /** 是否显示刷新按钮。未传时回退到 $olBaseConfig */
    showRefreshBtn: { type: Boolean, default: true },
    /** 是否显示打印按钮。未传时回退到 $olBaseConfig */
    showPrintBtn: { type: Boolean, default: true },
    /** 是否显示智能打印按钮（模板打印），需配合 smartPrintMenuId / printData。未传时回退到 $olBaseConfig */
    showSmartPrintBtn: { type: Boolean, default: false },
    /** 智能打印的菜单 ID */
    smartPrintMenuId: { type: String, default: "" },
    /** 智能打印的数据 */
    printData: { type: Array, default: () => [] },
    /** 是否显示实体变更记录按钮（勾选行后出现）。未传时回退到 $olBaseConfig */
    showEntityChangeBtn: { type: Boolean, default: false },
    /** 菜单配置的按钮列表 [{ title, types, icon, disabled, method }] */
    btnlist: { type: Array, default: () => [] },

    // ===== 分页相关 =====
    /** 分页配置 { page, limit, total, show } */
    pagination: {
      type: Object,
      default: () => ({ page: 1, limit: 20, total: 0, show: true }),
    },
    /** 每页条数选项 */
    pageSizes: { type: Array, default: () => [20, 30, 40, 60, 100, 200] },

    // ===== 钩子（对象入参，方便后期扩展） =====
    /** Swagger 搜索字段映射后、合并前。入参 { columns }，返回 { columns } */
    onSearchSwagger: { type: Function, default: null },
    /** 搜索字段合并完成+日期识别后。入参 { columns }，返回 { columns } */
    onSearchMerged: { type: Function, default: null },
    /** Swagger 表格列映射后、合并前。入参 { columns }，返回 { columns } */
    onTableSwagger: { type: Function, default: null },
    /** 表格列合并完成+补标签后。入参 { columns }，返回 { columns } */
    onTableMerged: { type: Function, default: null },

    // ===== 数据请求 =====
    /**
     * 自定义数据请求函数 ({ searchParams, filterConditions, page, limit, pagination }) => ({ rows, total })
     * 提供后走手动请求模式（父组件调接口），不传则走自动模式（crud 内部调接口）
     */
    fetchData: { type: Function, default: null },
    /**
     * 分页参数名映射，适配不同后端命名习惯
     * 默认 { page: 'Page', limit: 'MaxResultCount' }（ABP 框架）
     */
    pageParams: {
      type: Object,
      default: () => ({ page: "Page", limit: "MaxResultCount" }),
    },
    /** 响应数据解析函数 (response) => ({ rows: [], total: 0 })，适配不同后端返回格式 */
    responseHandler: { type: Function, default: null },
    // ===== 其他 =====
    /** 请求方式 get / post，默认 get */
    method: { type: String, default: "get" },
  },

  data() {
    return {
      // 内部搜索模型（copy from prop + defaultValue）
      internalSearchModel: {},

      // 展开/收起
      searchExpanded: false,

      // 配置弹窗
      configDialogVisible: false,

      // 自定义搜索模式下的比较符映射 { prop: compareType }
      compareMap: {},

      // autoFetch 模式下从接口返回中自动捕获的 customs
      fetchedCustoms: [],

      // 当前选中行
      currentSelection: [],

      // 列过滤
      checkedColumns: [],

      // 表格 key，用于强制重渲染
      tableKey: 0,

      // 自动请求时内部 loading 标识
      fetchingData: false,

      // 自动请求模式下的内部数据存储
      internalTableData: [],
      internalPagination: {
        page: 1,
        limit:
          (this.$olBaseConfig &&
            this.$olBaseConfig.pagination &&
            this.$olBaseConfig.pagination.limit) ||
          20,
        total: 0,
      },

      // 打印数据
      printListObj: { title: "", tableHeader: [], tableData: [] },

      // 列配置弹窗（persisted 模式）
      columnConfigVisible: false,
      // 实体变更记录弹窗
      entityChangeVisible: false,
      hasColumnConfig: false,
      showColumnRoleConfig: false,
      columnRoleList: [],
    };
  },

  computed: {
    /** 实际请求方式（三级优先级：prop > $olBaseConfig > 默认 'get'） */
    finalMethod() {
      if (this.$options.propsData && "method" in this.$options.propsData) {
        return this.method;
      }
      const base = this.$olBaseConfig || {};
      if (base.method !== undefined) return base.method;
      return "get";
    },

    /** 列配置模式（三级优先级） */
    resolvedColumnConfigMode() {
      if (this.$options.propsData && "columnConfigMode" in this.$options.propsData) {
        return this.columnConfigMode;
      }
      const base = this.$olBaseConfig || {};
      if (base.columnConfigMode !== undefined) return base.columnConfigMode;
      return this.columnConfigMode;
    },

    /** 分页参数名映射（三级优先级） */
    resolvedPageParams() {
      if (this.$options.propsData && "pageParams" in this.$options.propsData) {
        return this.pageParams;
      }
      const base = this.$olBaseConfig || {};
      if (base.pageParams !== undefined) return base.pageParams;
      return this.pageParams;
    },

    /** 每页条数选项（三级优先级） */
    resolvedPageSizes() {
      if (this.$options.propsData && "pageSizes" in this.$options.propsData) {
        return this.pageSizes;
      }
      const base = this.$olBaseConfig || {};
      if (base.pageSizes !== undefined) return base.pageSizes;
      return this.pageSizes;
    },

    /** 是否启用内部数据管理（自动模式有 url，手动模式有 fetchData） */
    shouldAutoFetch() {
      return !!this.url || typeof this.fetchData === "function";
    },

    /** 实际展示的表格数据（crud 内部管理） */
    displayTableData() {
      return this.internalTableData;
    },

    /** 实际使用的分页对象（crud 内部管理） */
    displayPagination() {
      return this.internalPagination;
    },

    /** 工具栏插槽统一作用域，尽可能多传数据方便用户 */
    toolbarSlotScope() {
      return {
        loading: this.fetchingData,
        selection: this.currentSelection,
        tableData: this.displayTableData,
        pagination: this.displayPagination,
        searchModel: this.internalSearchModel,
        columns: this.visibleColumns,
      };
    },

    /** 工具栏是否显示 */
    toolbarVisible() {
      return (
        this.btnlist.length ||
        this.$slots.toolbarBefore ||
        this.$slots.toolbarAfter ||
        this.$slots.toolbarActions ||
        this.$slots.toolbarActionsAfter ||
        this.$cfg("showColumnFilterBtn") ||
        this.$cfg("showRefreshBtn") ||
        this.$cfg("showPrintBtn") ||
        this.$cfg("showSmartPrintBtn") ||
        this.$cfg("showEntityChangeBtn")
      );
    },

    /** 可见的搜索字段（visible !== false） */
    visibleSearchFields() {
      const all = this.searchFields.filter(f => f.visible !== false);
      if (!this.searchExpanded && all.length > this.columnsPerRow) {
        return all.slice(0, this.columnsPerRow);
      }
      return all;
    },

    /** 可见的表格列 */
    visibleColumns() {
      return this.columns.filter(col => {
        if (col.children && col.children.length) return true;
        return col.show !== false;
      });
    },

    /** 传给 #column 插槽的列数据 */
    visibleColumnsForSlot() {
      return this.visibleColumns;
    },

    /** 可供过滤的列（有 prop 的叶子列） */
    filterableColumns() {
      const result = [];
      const walk = cols => {
        (cols || []).forEach(col => {
          if (col.children && col.children.length) {
            walk(col.children);
          } else if (col.prop) {
            result.push(col);
          }
        });
      };
      walk(this.columns);
      return result;
    },

    /** 操作列最小宽度（根据按钮数量估算） */
    operatesMinWidth() {
      const len = (this.operates || []).length;
      if (len <= 2) return "100px";
      if (len <= 4) return "160px";
      return "200px";
    },

    /** 传给 OlColumnConfig 的列数据（全部叶子列） */
    columnsForConfig() {
      return this.filterableColumns.map(col => ({
        ...col,
        alias: col.alias || col.label,
        fixed: col.fixed || false,
        show: col.show !== false,
      }));
    },

    /** 解析后的菜单ID（透传给 ol-column-config） */
    resolvedMenuId() {
      return this.resolveMenuId();
    },

    /** 搜索字段宽度（根据每行列数动态计算） */
    searchItemWidth() {
      const cols = this.columnsPerRow || 4;
      return `calc(${100 / cols}% - 4px)`;
    },

    // --- 兼容 SearchConfigDialog 的数据格式 ---
    /** 旧格式的 tableSearch */
    searchFieldsForDialog() {
      return (this.searchFields || []).map(newFieldToOld);
    },
    /** 旧格式的 formSearchData */
    formSearchDataForDialog() {
      return {
        tableSearch: this.searchFieldsForDialog,
        rules: this.searchRules || {},
        value: this.internalSearchModel || {},
        options: {},
        reset: false,
        customs: this.resolvedCustoms,
      };
    },
    /** customs 解析：自动模式自动捕获，手动模式（fetchData）由父组件传入 */
    resolvedCustoms() {
      if (this.url && typeof this.fetchData !== "function") {
        return this.fetchedCustoms;
      }
      return this.customs;
    },

    /** 旧格式的 formSearch */
    searchModelForDialog() {
      return { ...this.internalSearchModel };
    },
  },

  watch: {
    searchModel: {
      handler(val) {
        if (val && Object.keys(val).length) {
          this.internalSearchModel = { ...val };
        }
      },
      immediate: true,
      deep: true,
    },

    searchFields: {
      handler(fields) {
        this.initSearchDefaults();
      },
      immediate: true,
    },

    columns: {
      handler() {
        this.syncColumnSlots();
        this.syncCheckedColumns();
      },
      immediate: true,
      deep: true,
    },

    checkedColumns(val) {
      const walk = cols => {
        (cols || []).forEach(col => {
          if (col.children && col.children.length) {
            walk(col.children);
          } else if (col.prop) {
            this.$set(col, "show", val.includes(col.prop));
          }
        });
      };
      walk(this.columns);
      this.tableKey++;
    },
  },

  created() {
    this.initSearchDefaults();
  },

  async mounted() {
    this.syncColumnSlots();

    // persisted 模式：先从 API 加载列配置（决定列的顺序/可见性/标签）
    if (this.$cfg("showColumnFilterBtn") && this.resolvedColumnConfigMode === "persisted") {
      await this.loadColumnConfig();
    }

    if (this.$cfg("showCustomSearch")) {
      await this.loadSearchConfig();
    }

    if (this.url) {
      this.initFromSwagger();
    }
  },

  methods: {
    // ===================== 初始化 =====================

    /**
     * 获取配置值，优先级：prop 显式传值 > $olBaseConfig 全局 > 默认值
     * @param {string} key - prop 名称
     * @param {*} defaultVal - 兜底默认值
     */
    $cfg(key) {
      // 父组件显式传了 → 最高优先级
      if (this.$options.propsData && key in this.$options.propsData) {
        return this[key];
      }
      // 全局配置
      const base = this.$olBaseConfig || {};
      if (base[key] !== undefined) return base[key];
      // 兜底：prop 自身的 default 值
      return this[key];
    },

    /** 自动检测父组件传入的列插槽（#propName），自动设置 renderSlot */
    syncColumnSlots() {
      const slotNames = Object.keys(this.$scopedSlots || {});
      if (slotNames.length === 0) return;
      const walk = cols => {
        (cols || []).forEach(col => {
          if (col.children && col.children.length) {
            walk(col.children);
          } else if (col.prop && slotNames.includes(col.prop) && !col.render) {
            this.$set(col, "renderSlot", true);
          }
        });
      };
      walk(this.columns);
    },

    /** 同步 checkedColumns：从 columns 的 show 状态回写到 checkedColumns */
    syncCheckedColumns() {
      const result = [];
      const walk = cols => {
        (cols || []).forEach(col => {
          if (col.children && col.children.length) {
            walk(col.children);
          } else if (col.prop && col.show !== false) {
            result.push(col.prop);
          }
        });
      };
      walk(this.columns);
      // 仅值变化时更新，打断 checkedColumns ↔ columns 循环
      if (
        result.length !== this.checkedColumns.length ||
        result.some((v, i) => v !== this.checkedColumns[i])
      ) {
        this.checkedColumns = result;
      }
    },

    /** 初始化搜索默认值 */
    initSearchDefaults() {
      const model = { ...this.searchModel };
      (this.searchFields || []).forEach(field => {
        if (!(field.prop in model) && field.defaultValue !== undefined) {
          model[field.prop] = field.defaultValue;
        } else if (!(field.prop in model)) {
          model[field.prop] = null;
        }
      });
      this.internalSearchModel = model;
    },

    /** 从 Swagger 自动生成 searchFields 和 columns */
    async initFromSwagger() {
      try {
        const { getData } = await import("../../index.js");
        const swaggerData = await getData();
        if (!swaggerData || !swaggerData.paths) return;

        // 确定 URL
        const apiUrl = this.url;
        if (!apiUrl || !swaggerData.paths[apiUrl]) {
          console.warn(`[ol-crud] Swagger 中未找到路径: ${apiUrl}`);
          return;
        }

        const pathData = swaggerData.paths[apiUrl];
        const method = this.finalMethod;
        const methodData = pathData[method];
        if (!methodData) return;

        // --- 普通模式：从 Swagger 参数自动生成 searchFields ---
        // 配置模式下搜索字段来自 loadSearchConfig() 后端接口，不走 Swagger 映射
        if (!this.$cfg("showCustomSearch")) {
          const parameters = methodData.parameters || [];

          // Step 1: Swagger params → 组件格式的 searchField 列表（全部映射，不做中文过滤）
          let swaggerSearchFields = parameters
            .map(p => this.mapParameterToSearchField(p))
            .filter(Boolean);

          // Step 2: onSearchSwagger 钩子 ({ columns }) — 拿到全部字段，可在此补中文描述
          let searchHookResult = null; // null 表示钩子未调用，后续 autoDetectRangeTimeFields 据此判断
          if (typeof this.onSearchSwagger === "function") {
            try {
              const res = await this.onSearchSwagger({ columns: [...swaggerSearchFields] });
              if (res && Array.isArray(res)) {
                swaggerSearchFields = res;
                searchHookResult = res;
              }
            } catch (err) {
              /* ignore */
            }
          }

          // Step 3: 过滤掉没有中文描述的字段（钩子之后执行，给用户机会补中文）
          swaggerSearchFields = swaggerSearchFields.filter(f => {
            return f.label && /[一-鿿]/.test(f.label);
          });

          // Step 4: 合并 Swagger 字段到手动配置的 searchFields
          // 策略：Object.assign(swagger, user) — Swagger 打底，用户覆盖；prop 不修改
          const manualByProp = {};
          this.searchFields.forEach(f => {
            if (f.prop) manualByProp[f.prop.toLowerCase()] = f;
          });

          swaggerSearchFields.forEach(swaggerField => {
            const key = (swaggerField.prop || "").toLowerCase();
            const manualField = manualByProp[key];

            if (manualField) {
              // 有手动配置：swagger 打底 + 用户覆盖（prop 以用户为准不覆盖）
              const userProp = manualField.prop;
              Object.assign(manualField, swaggerField, manualField);
              manualField.prop = userProp;
            } else {
              // 无手动配置：直接追加 Swagger 字段，同步补上 model 的 key
              this.searchFields.push(swaggerField);
              this.$set(
                this.internalSearchModel,
                swaggerField.prop,
                swaggerField.defaultValue != null ? swaggerField.defaultValue : null
              );
            }
          });

          // Step 5: 普通模式自动识别日期范围字段
          // 传入 parameters（用于配对检测，靠命名规则而非中文描述）和钩子结果（检测用户是否显式删除）
          this.autoDetectRangeTimeFields(parameters, searchHookResult);

          // Step 6: onSearchMerged 钩子 ({ columns }) — 用户直接返回 columns 数组
          if (typeof this.onSearchMerged === "function") {
            try {
              const res = await this.onSearchMerged({ columns: this.searchFields.slice() });
              if (res && Array.isArray(res))
                this.searchFields.splice(0, this.searchFields.length, ...res);
            } catch (err) {
              /* ignore */
            }
          }

          this.initSearchDefaults();
        }

        // --- 自动生成 columns（hasColumnConfig 为 true 时表示 API 列配置已加载，跳过 Swagger） ---
        if (!this.hasColumnConfig) {
          const { responseData } = this._extractSwaggerResponse(methodData);
          const rawProps = responseData ? this._extractItemsProps(responseData) : null;

          // Step 1: 对象 → 数组（保持 Object.keys 顺序），key 存原始属性名
          let propsArray = rawProps
            ? Object.keys(rawProps).map(key => ({ key, ...rawProps[key] }))
            : [];
          // 调整顺序函数
          propsArray = basePropsOrderChange(propsArray);

          // Step 2: onTableSwagger 钩子 ({ columns }) — 拿到全部 response properties 数组，
          // 用户可在钩子中调整数组顺序来控制表格列顺序，也可补 description
          // 用户直接 return columns 数组本身，用这个数组决定最终渲染的表格列
          if (typeof this.onTableSwagger === "function") {
            try {
              const res = await this.onTableSwagger({ columns: propsArray });
              if (res && Array.isArray(res)) propsArray = res;
            } catch (err) {
              /* ignore */
            }
          }

          // Step 3: Desc/Text 优先级处理 + 过滤 + 映射为 column 格式
          // 规则：xxxDesc > xxxText > xxx，如果 Swagger 中同时存在基础字段和 Desc/Text 变体，优先展示变体
          if (propsArray.length) {
            // 3a: 标记被 Desc/Text 变体覆盖的基础字段
            const allKeys = new Set(propsArray.map(f => f.key));
            const replacedKeys = new Set();
            propsArray.forEach(item => {
              if (item.key.endsWith("Desc")) {
                const base = item.key.replace(/Desc$/, "");
                if (allKeys.has(base)) replacedKeys.add(base);
              }
              if (item.key.endsWith("Text")) {
                const base = item.key.replace(/Text$/, "");
                if (allKeys.has(base)) replacedKeys.add(base);
              }
            });

            let swaggerColumns = [];
            const existingColumnProps = new Set(
              this.columns.filter(c => !c.children).map(c => c.prop)
            );
            // 构建快速 lookup：{ propName: prop }，供后面 label 回填用
            const propsLookup = {};
            propsArray.forEach(item => {
              const { key, ...prop } = item;
              // 跳过被 Desc/Text 变体覆盖的基础字段
              if (replacedKeys.has(key)) return;
              if (!existingColumnProps.has(key)) {
                if (prop.description) {
                  const col = this.mapPropertyToColumn(key, prop);
                  if (col) swaggerColumns.push(col);
                }
              }
              propsLookup[key] = prop;
            });

            swaggerColumns.forEach(col => {
              if (!existingColumnProps.has(col.prop)) {
                this.columns.push(col);
                // 即时更新集合，防止后续同 prop 列重复添加
                existingColumnProps.add(col.prop);
              }
            });

            // 回填 label：用户手动写的列没有 label 时，从 swagger property description 补充
            this.columns.forEach(col => {
              if (col.children && col.children.length) {
                col.children.forEach(child => {
                  if (!child.label && child.prop && propsLookup[child.prop]) {
                    this.$set(child, "label", propsLookup[child.prop].description);
                  }
                });
              } else {
                if (!col.label && col.prop && propsLookup[col.prop]) {
                  this.$set(col, "label", propsLookup[col.prop].description);
                }
              }
            });
          }
        }

        // onTableMerged 钩子 ({ columns }) — 用户直接返回 columns 数组
        if (typeof this.onTableMerged === "function") {
          try {
            const res = await this.onTableMerged({ columns: this.columns.slice() });
            if (res && Array.isArray(res)) this.columns.splice(0, this.columns.length, ...res);
          } catch (err) {
            /* ignore */
          }
        }

        this.syncColumnSlots();

        console.log(`\x1b[36m\x1b[4mol-crud Swagger 初始化完成`, {
          searchFields: this.searchFields,
          columns: this.columns,
        });

        // 自动拉取首屏数据
        if (this.shouldAutoFetch) {
          await this.fetchList();
        }
      } catch (err) {
        console.error("[ol-crud] Swagger 初始化失败:", err);
      }
    },

    /** 提取 Swagger response schema */
    _extractSwaggerResponse(methodData) {
      return {
        responseData:
          methodData.responses &&
          methodData.responses["200"] &&
          methodData.responses["200"].content &&
          methodData.responses["200"].content["application/json"] &&
          methodData.responses["200"].content["application/json"].schema,
      };
    },

    /** 提取 response 中的 items properties（支持分页包裹） */
    _extractItemsProps(responseData) {
      return (
        (responseData.properties &&
          responseData.properties.items &&
          responseData.properties.items.items &&
          responseData.properties.items.items.properties) ||
        responseData.properties ||
        {}
      );
    },

    /** 将 Swagger parameter 映射为 searchField（组件格式） */
    mapParameterToSearchField(param) {
      const field = {
        prop: param.name,
        label: param.description || param.name,
        type: "input",
        visible: true,
        defaultValue: null,
        props: {},
      };

      if (!param.schema) return field;

      const schema = param.schema;

      // 枚举 → select
      if (schema.enum && Array.isArray(schema.enum)) {
        field.type = "select";
        // 尝试从 $$ref 解析具名枚举（如 #/definitions/StatusEnum）
        if (schema["$$ref"]) {
          const refParts = schema["$$ref"].split("/");
          const enumName = refParts[refParts.length - 1];
          try {
            const resolvedEnum = getEnum(enumName);
            field.options =
              resolvedEnum && resolvedEnum.length
                ? resolvedEnum
                : schema.enum.map(e => ({ key: e, value: e }));
          } catch {
            field.options = schema.enum.map(e => ({ key: e, value: e }));
          }
        } else {
          field.options = schema.enum.map(e => ({ key: e, value: e }));
        }
      } else if (schema.format === "date-time") {
        // 日期时间 → date picker
        field.type = "date";
        field.props = {
          valueFormat: "yyyy-MM-dd HH:mm:ss",
          format: "yyyy/MM/dd HH:mm:ss",
        };
      } else if (schema.format === "date") {
        field.type = "date";
        field.props = {
          valueFormat: "yyyy-MM-dd",
          format: "yyyy/MM/dd",
        };
      } else if (schema.type === "integer" || schema.type === "number") {
        field.type = "number";
      } else if (schema.type === "boolean") {
        field.type = "select";
        field.options = [
          { key: true, value: "是" },
          { key: false, value: "否" },
        ];
      }

      return field;
    },

    /** 将 Swagger property 映射为 column */
    mapPropertyToColumn(key, prop) {
      const col = {
        prop: key,
        label: prop.description || key,
        sortable: false,
      };

      // 枚举 / boolean → 优先展示 Desc 后缀字段
      // 如果 Swagger 中已有 xxxDesc/xxxText，Step 3 的去重逻辑会跳过当前基础字段
      // 这里处理 Swagger 中没有变体字段的情况，默认指向 xxxDesc
      if (prop.enum && Array.isArray(prop.enum)) {
        col.prop = `${key}Desc`;
        col.label = (prop.description || key).replace(/(枚举|枚举值)/g, "");
      }

      if (prop.type === "boolean") {
        col.prop = `${key}Desc`;
      }

      return col;
    },

    /**
     * 普通模式下自动识别日期范围字段（xxxBegin + xxxEnd → xxxTime）
     * 因为 Element UI daterange 绑定数组，但后端需要两个独立字段
     * 只在非配置模式（!showCustomSearch）下执行
     *
     * @param {Array} parameters - 原始 Swagger 参数（用于配对检测，靠命名规则而非中文描述）
     * @param {Array|null} searchHookResult - onSearchSwagger 钩子返回的字段列表；null 表示钩子未调用
     */
    autoDetectRangeTimeFields(parameters, searchHookResult) {
      if (this.$cfg("showCustomSearch")) return;

      const searchFields = this.searchFields;
      const toAdd = [];

      // 辅助函数：判断用户是否在钩子中显式删除了某个字段
      // 钩子未调用 → false（不过滤）；钩子调用了但字段不在结果中 → true（用户删了）
      const hookRemoved = propName => {
        if (searchHookResult === null) return false;
        return !searchHookResult.some(f => f.prop === propName);
      };

      // 规则1：BeginTime + EndTime → createdTime（创单时间专用）
      const hasBeginTime = parameters.some(p => p.name === "BeginTime");
      const hasEndTime = parameters.some(p => p.name === "EndTime");
      const hasCreatedTime = searchFields.some(f => f.prop === "createdTime");
      if (
        hasBeginTime &&
        hasEndTime &&
        !hasCreatedTime &&
        !hookRemoved("BeginTime") &&
        !hookRemoved("EndTime")
      ) {
        toAdd.push({
          prop: "createdTime",
          label: "创建时间",
          type: "datetimerange",
          visible: true,
          defaultValue: null,
          props: {
            valueFormat: "yyyy-MM-dd HH:mm:ss",
            format: "yyyy/MM/dd HH:mm:ss",
            defaultTime: ["00:00:00", "23:59:59"],
          },
          originalFields: { begin: "BeginTime", end: "EndTime" },
        });
        // 移除原始的 BeginTime / EndTime 独立字段，避免与合成字段重复
        const rmBi = searchFields.findIndex(f => f.prop === "BeginTime");
        const rmEi = searchFields.findIndex(f => f.prop === "EndTime");
        if (rmBi >= 0) searchFields.splice(rmBi, 1);
        if (rmEi >= 0) searchFields.splice(rmEi, 1);
        delete this.internalSearchModel["BeginTime"];
        delete this.internalSearchModel["EndTime"];
      }

      // 规则2：自动识别 xxxBegin + xxxEnd 成对字段 → xxxTime
      const beginParams = parameters.filter(p => p.name.endsWith("Begin"));
      const endParams = parameters.filter(p => p.name.endsWith("End"));

      beginParams.forEach(beginParam => {
        const prefix = beginParam.name.replace(/Begin$/, "");
        const endName = prefix + "End";
        const timeName = prefix + "Time";
        const hasEnd = endParams.some(p => p.name === endName);
        if (!hasEnd) return;
        if (searchFields.some(f => f.prop === timeName)) return;
        // 如果用户在钩子里删掉了 Begin 或 End 字段，跳过
        if (hookRemoved(beginParam.name) || hookRemoved(endName)) return;

        toAdd.push({
          prop: timeName,
          label: beginParam.description || prefix,
          type: "datetimerange",
          visible: true,
          defaultValue: null,
          props: {
            valueFormat: "yyyy-MM-dd HH:mm:ss",
            format: "yyyy/MM/dd HH:mm:ss",
            defaultTime: ["00:00:00", "23:59:59"],
          },
          originalFields: { begin: beginParam.name, end: endName },
        });

        // 从 searchFields 中移除原始的 Begin/End 独立字段
        const rmBeginIdx = searchFields.findIndex(f => f.prop === beginParam.name);
        const rmEndIdx = searchFields.findIndex(f => f.prop === endName);
        if (rmBeginIdx >= 0) searchFields.splice(rmBeginIdx, 1);
        if (rmEndIdx >= 0) searchFields.splice(rmEndIdx, 1);
        // 从 searchModel 中也移除
        delete this.internalSearchModel[beginParam.name];
        delete this.internalSearchModel[endName];
      });

      // 追加合成字段，同步补上 model 的 key
      toAdd.forEach(f => {
        searchFields.push(f);
        this.$set(this.internalSearchModel, f.prop, f.defaultValue != null ? f.defaultValue : null);
      });
      if (toAdd.length) {
        this.initSearchDefaults(); // 更新初始快照
        console.log(
          `\x1b[36m\x1b[4mol-crud 自动识别日期范围字段`,
          toAdd.map(f => f.prop)
        );
      }
    },

    /** 切换比较符：更新 compareMap，select 类型自动切换单选/多选模式，并清空右侧输入框的值 */
    handleCompareChange(field, compare) {
      this.$set(this.compareMap, field.prop, compare);
      this.syncFieldMultiple(field, compare);
      const key = field.prop;
      if (field.type === "select" || field.type === "remoteSelect") {
        const isMultiple = compare === "in" || compare === "not in";
        this.$set(this.internalSearchModel, key, isMultiple ? [] : null);
      } else {
        this.$set(this.internalSearchModel, key, null);
      }
    },

    /** 根据 compare 值同步 field.props.multiple，确保下拉框单选/多选模式正确 */
    syncFieldMultiple(field, compare) {
      if (!field || (field.type !== "select" && field.type !== "remoteSelect")) return;
      const isMultiple = compare === "in" || compare === "not in";
      if (!field.props) {
        this.$set(field, "props", {});
      }
      this.$set(field.props, "multiple", isMultiple);
    },

    /** 重置 compareMap 为 searchFields 中配置的默认 compare 值，并同步 multiple 状态 */
    compareReset() {
      this.compareMap = {};
      if (this.searchFields && this.searchFields.length) {
        this.searchFields.forEach(field => {
          if (field.prop && field.compare) {
            this.$set(this.compareMap, field.prop, field.compare);
            this.syncFieldMultiple(field, field.compare);
          }
        });
      }
    },

    // ===================== 搜索 =====================

    /** 查询 */
    handleSearch() {
      if (this.fetchingData) return;
      const form = this.$refs.searchForm;
      if (form && this.searchRules && Object.keys(this.searchRules).length) {
        return new Promise((resolve, reject) => {
          form.validate(valid => {
            if (!valid) return reject(new Error("表单验证未通过"));
            resolve(this.emitSearch());
          });
        });
      }
      return this.emitSearch();
    },

    /**
     * 构建查询参数：复制搜索模型 → 拆分日期范围 → 清理空值
     * 供 emitSearch 和 fetchList 共用，保证日期范围拆分逻辑一致
     */
    buildSearchParams() {
      const model = { ...this.internalSearchModel };

      // 普通模式：拆分日期范围字段（xxxTime → xxxBegin / xxxEnd）
      if (!this.$cfg("showCustomSearch")) {
        (this.searchFields || []).forEach(field => {
          if (
            (field.type === "daterange" || field.type === "datetimerange") &&
            field.originalFields &&
            model[field.prop]
          ) {
            const { begin, end } = field.originalFields;
            if (Array.isArray(model[field.prop])) {
              model[begin] = model[field.prop][0];
              model[end] = model[field.prop][1];
              delete model[field.prop]; // 移除原始数组 key
            } else {
              model[begin] = null;
              model[end] = null;
              delete model[field.prop];
            }
          }
        });
      }

      // 清理空值
      const cleanParams = {};
      Object.keys(model).forEach(key => {
        const val = model[key];
        if (val !== null && val !== undefined && val !== "") {
          cleanParams[key] = val;
        }
      });

      return { model, cleanParams };
    },

    /** 发出搜索事件 */
    emitSearch() {
      const { model, cleanParams } = this.buildSearchParams();

      // 构建 filterConditions（配置模式用）
      const filterConditions = [];
      Object.keys(cleanParams).forEach(key => {
        const field = this.searchFields.find(f => f.prop === key);
        filterConditions.push({
          key,
          values: Array.isArray(cleanParams[key]) ? cleanParams[key] : [cleanParams[key]],
          compare: this.compareMap[key] || (field && field.compare) || "",
        });
      });

      // search 事件 emit 拆分后的 model（Begin/End 格式，供父组件调接口）
      this.$emit("search", model, { filterConditions });
      // update:searchModel emit 原始 internalSearchModel（保留日期范围数组，避免 .sync 回流清空）
      this.$emit("update:searchModel", { ...this.internalSearchModel });
      console.log(`\x1b[36m\x1b[4mol-crud 查询`, model, { filterConditions });

      // 自动拉取数据
      if (this.shouldAutoFetch) {
        this.internalPagination.page = 1;
        return this.fetchList();
      }
    },

    /**
     * 自动拉取列表数据
     * 通过 Swagger URL 调用后端接口，解析响应并更新 tableData / pagination
     */
    async fetchList() {
      if (!this.shouldAutoFetch) return;
      const { page: pageKey, limit: limitKey } = this.resolvedPageParams || {};
      const page = this.internalPagination.page;
      const limit = this.internalPagination.limit;

      // 搜索参数（含日期范围拆分 + 空值清理）
      const { cleanParams } = this.buildSearchParams();

      // 分页参数
      const pageParams = {
        [pageKey || "Page"]: page,
        [limitKey || "MaxResultCount"]: limit,
      };

      this.fetchingData = true;
      this.$emit("update:loading", true);

      try {
        let rows, total;

        // 构建 filterConditions（自定义搜索配置模式时用）
        let filterConditions;
        if (this.$cfg("showCustomSearch")) {
          filterConditions = [];
          Object.keys(cleanParams).forEach(key => {
            const field = this.searchFields.find(f => f.prop === key);
            filterConditions.push({
              key,
              values: Array.isArray(cleanParams[key]) ? cleanParams[key] : [cleanParams[key]],
              compare: this.compareMap[key] || (field && field.compare) || "",
            });
          });
        }

        if (typeof this.fetchData === "function") {
          // === 自定义请求：父组件负责 API 调用 ===
          const result = await this.fetchData({
            searchParams: cleanParams,
            filterConditions,
            page,
            limit,
            pagination: { ...this.internalPagination },
          });
          rows = (result && result.rows) || [];
          total = (result && result.total) || 0;
        } else {
          // === 自动请求：crud 内部调 API ===
          const apiUrl = this.url;
          if (!apiUrl) return;

          if (typeof this.get !== "function" && typeof this.post !== "function") {
            console.warn(
              "[ol-crud] 未找到 this.get/this.post，无法自动拉取数据，请使用 fetchData 或手动传入 tableData"
            );
            return;
          }

          let params;
          if (this.$cfg("showCustomSearch")) {
            params = { FilterConditions: filterConditions, ...pageParams };
          } else {
            params = { ...cleanParams, ...pageParams };
          }

          const method = this.finalMethod;
          let response;
          if (method === "post") {
            response = await this.post({ url: apiUrl, data: params });
          } else {
            response = await this.get({ url: apiUrl, data: params });
          }

          const parsed = this.parseResponse(response);
          rows = parsed.rows || [];
          total = parsed.total || 0;

          // 自动捕获 customs（分页接口返回的可用搜索字段列表，供 showCustomSearch 配置弹窗使用）
          const customs = (response && response.result && response.result.customs) || [];
          if (customs.length) {
            this.fetchedCustoms = customs;
          }
        }

        // 写入内部数据
        this.internalTableData = rows || [];
        this.internalPagination = {
          ...this.internalPagination,
          total: total || 0,
        };

        this.$emit("update:tableData", rows || []);
        this.$emit("update:pagination", {
          ...this.internalPagination,
          total: total || 0,
        });

        this.$emit("data-loaded", { rows, total });
        console.log(
          `\x1b[36m\x1b[4mol-crud 数据加载完成`,
          `共 ${total} 条，当前 ${(rows || []).length} 条`
        );
      } catch (err) {
        console.error("[ol-crud] 数据请求失败:", err);
        this.$emit("data-error", err);
      } finally {
        this.fetchingData = false;
        this.$emit("update:loading", false);
      }
    },

    /**
     * 刷新表格数据（保持当前搜索条件+分页）。
     * 供父组件通过 $refs.crud.refresh() 调用，如自定义按钮操作后刷新。
     */
    refresh() {
      return this.fetchList();
    },

    /**
     * 解析后端返回的响应数据
     * 内置支持常见分页格式，也可通过 responseHandler prop 自定义
     */
    parseResponse(response) {
      // 优先走自定义解析器
      if (typeof this.responseHandler === "function") {
        return this.responseHandler(response);
      }

      // 内置解析规则（按优先级尝试）
      const result = (response && response.result) || response || {};

      // 格式1: { result: { items/records/list: [], total/totalCount: N } }
      const rows = result.items || result.records || result.list || result.data || [];
      const total =
        result.total != null
          ? result.total
          : result.totalCount != null
          ? result.totalCount
          : result.count != null
          ? result.count
          : rows.length != null
          ? rows.length
          : 0;

      // 格式2: { result: [] } — 直接返回数组，无分页
      if (Array.isArray(result)) {
        return { rows: result, total: result.length };
      }

      return { rows: Array.isArray(rows) ? rows : [], total };
    },

    /** 重置：用 defaultValue 或 null 重建搜索模型，不走 resetFields（兼容动态字段） */
    handleReset() {
      // 重置 compareMap
      this.compareReset();

      // 重建搜索模型：优先取 defaultValue，否则 null
      const model = {};
      (this.searchFields || []).forEach(field => {
        model[field.prop] = field.defaultValue !== undefined ? field.defaultValue : null;
      });
      this.internalSearchModel = model;

      // 清除表单校验红字
      if (this.$refs.searchForm) {
        this.$refs.searchForm.clearValidate();
      }

      this.$emit("reset", { ...this.internalSearchModel });

      // 重置后自动刷新
      if (this.shouldAutoFetch) {
        this.internalPagination.page = 1;
        return this.fetchList();
      }
    },

    /** 搜索字段值变化 */
    onFieldChange(field) {
      if (field.onChange) {
        field.onChange(this.internalSearchModel[field.prop], this.internalSearchModel);
      }
    },

    /** remoteSelect：远程搜索，父组件通过 field.remoteMethod 实现 */
    handleRemoteSearch(field, query) {
      if (field.remoteMethod) {
        field.remoteMethod(query, field);
      }
    },

    /** remoteSelect：滚动到底加载更多，父组件通过 field.onLoadMore 实现 */
    handleSelectLoadMore(field) {
      if (field.onLoadMore) {
        field.onLoadMore(field);
      }
    },

    /** 数字输入框按键拦截 */
    onNumberKeydown(e) {
      const key = e.key;
      if (key === "e" || key === "E" || key === "-" || key === "+" || key === ".") {
        e.returnValue = false;
        return false;
      }
      return true;
    },

    /** 数字输入框粘贴拦截：只允许数字字符 */
    onNumberPaste(e) {
      const pasted = (e.clipboardData && e.clipboardData.getData("text")) || "";
      if (/[^\d]/.test(pasted)) {
        e.preventDefault();
      }
    },

    /** 数字输入框实时过滤：去掉非数字字符（处理中文输入法等绕过 keydown 的场景） */
    onNumberInput(e, field) {
      const raw = e.target.value;
      const cleaned = raw.replace(/\D/g, "");
      if (raw !== cleaned) {
        // 直接用原生 DOM 赋值 + Vue 模型同步，避免 cursor 跳动
        e.target.value = cleaned;
        this.internalSearchModel[field.prop] = cleaned === "" ? null : Number(cleaned);
      }
    },

    // ===================== 配置弹窗（仅 showCustomSearch 时走接口） =====================

    /** 获取菜单ID：优先 props，其次从 localStorage 自动匹配当前路由 */
    resolveMenuId() {
      if (this.menuId) return this.menuId;

      try {
        const wms = JSON.parse(localStorage.getItem("wms") || "{}");
        const menus = wms.SET_MENUS;
        if (!menus || !this.$route) return "";

        // 递归匹配当前路由
        const findMenu = arr => {
          for (const item of arr) {
            if (item.path === this.$route.path) return item;
            if (item.child && item.child.length && item.type !== 1) {
              const found = findMenu(item.child);
              if (found) return found;
            }
          }
          return null;
        };
        const matched = findMenu(menus);
        return (matched && matched.id) || "";
      } catch {
        return "";
      }
    },

    /** 从后端加载已保存的搜索配置 */
    async loadSearchConfig() {
      const id = this.resolveMenuId();
      if (!id) return;

      try {
        if (typeof this.get !== "function") return;
        const res = await this.get({
          url: `/api/app/menu-search-setting/by-menu`,
          data: { sysMenuId: id },
        });
        if (res.code !== 200 || !res.result) return;

        const configList = res.result.settingJson ? JSON.parse(res.result.settingJson) : [];

        // Step 1: 加载字段配置（如果存在），覆盖本地 searchFields
        if (configList && configList.length) {
          const newFields = configList.map(oldFieldToNew);
          this.searchFields.splice(0, this.searchFields.length, ...newFields);
          // 不在此处调 initSearchDefaults()：splice 会触发 searchFields watcher
          // 异步执行 initSearchDefaults()，在此处同步调用会被后续 watcher 覆写
          this.loadOptionSources();
          console.log(`\x1b[36m\x1b[4mol-crud 已加载搜索配置`, newFields);
        }

        // Step 2: 始终根据当前 searchFields 初始化 compareMap + field.props.multiple
        // （无论 searchFields 来自 props 还是后端配置，都需要同步 multiple 状态）
        this.compareReset();

        // Step 3: 回显已保存的默认搜索条件（独立于字段配置，可能单独存在）
        // 此步骤的 compare 会覆盖 compareReset 设置的默认值，确保"保存的搜索条件 > 配置弹框默认值"
        if (res.result.defaultFilterJson) {
          try {
            const defaultFilters = JSON.parse(res.result.defaultFilterJson);
            // 等待 searchFields watcher 异步触发的 initSearchDefaults() 执行完毕，
            // 否则 watcher 会在回显之后把 internalSearchModel 重置为 null，导致回显失效
            await this.$nextTick();
            defaultFilters.forEach(item => {
              if (item.values && item.values.length > 0) {
                // 接口默认值不覆盖前端已有的非空值
                if (!(item.key in this.internalSearchModel) || this.internalSearchModel[item.key] == null) {
                  this.$set(
                    this.internalSearchModel,
                    item.key,
                    item.values.length === 1 ? item.values[0] : item.values
                  );
                }
                if (item.compare) {
                  this.$set(this.compareMap, item.key, item.compare);
                  // 同步 field.props.multiple，确保下拉框单选/多选模式与回显数据一致
                  const field = this.searchFields.find(f => f.prop === item.key);
                  this.syncFieldMultiple(field, item.compare);
                }
              }
            });
            console.log(`\x1b[36m\x1b[4mol-crud 已回显默认搜索条件`, defaultFilters);
          } catch (e) {
            console.error("[ol-crud] defaultFilterJson 解析失败:", e);
          }
        }
      } catch (err) {
        console.warn("[ol-crud] 加载搜索配置失败:", err);
      }
    },

    /** 加载搜索字段中 optionSource 指定的下拉选项（select 类型） */
    loadOptionSources() {
      (this.searchFields || []).forEach(field => {
        if (field.type === "select" && field.optionSource) {
          this.loadItemOptions(field);
        }
      });
    },

    /** 加载单个字段的下拉选项 */
    async loadItemOptions(field) {
      if (!field.optionSource) return;

      const { sourceType } = field.optionSource;

      if (sourceType === "dict") {
        await this.loadDictOptions(field);
      } else if (sourceType === "api") {
        await this.loadApiOptions(field);
      }
    },

    /** 从字典加载下拉选项 */
    async loadDictOptions(field) {
      try {
        const dictKey = field.optionSource.dictKey;
        if (!dictKey) return;

        const dictData = await this.getDictData(dictKey);
        if (dictData && Array.isArray(dictData)) {
          const options = dictData.map(d => ({
            key: d.key,
            value: d.value,
          }));
          this.$set(field, "options", options);
        }
      } catch (error) {
        console.error("[ol-crud] 加载字典数据失败:", error);
      }
    },

    /** 从 API 加载下拉选项（如 -select 结尾的接口） */
    async loadApiOptions(field) {
      try {
        const apiUrl = field.optionSource.apiUrl;
        const method = field.optionSource.method || "get";
        if (!apiUrl) return;
        if (typeof this.get !== "function") return;

        let response;
        if (method === "post" && typeof this.post === "function") {
          response = await this.post({ url: apiUrl });
        } else {
          response = await this.get({ url: apiUrl });
        }
        if (!response || response.code !== 200) return;
        if (response.result && Array.isArray(response.result)) {
          const { valueField, labelField } = field.optionSource;
          const options = response.result.map(d => ({
            key: d[valueField],
            value: d[labelField],
          }));
          this.$set(field, "options", options);
        }
      } catch (error) {
        console.error("[ol-crud] 加载接口数据失败:", error);
      }
    },

    /** 从 localStorage 读取字典数据 */
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
          resolve([]);
        }
      });
    },

    /**
     * persisted 模式：从 API 加载列配置，以此为准构建 columns
     * API fields 即列定义（顺序/可见/标签/固定），合并用户手动列的 render/sortable/enumName
     */
    async loadColumnConfig() {
      const id = this.resolveMenuId();
      if (!id || typeof this.get !== "function") return;

      try {
        const res = await this.get({
          url: "/api/app/user-field-config/config",
          data: {
            pageKey: this.pageKey || (this.$route && this.$route.path) || "",
            sysMenuId: id,
          },
        });
        const fields = (res && res.result && res.result.fields) || [];
        if (!fields.length) return; // 无已保存配置，fallback 到 Swagger

        // 收集用户手动列的非展示属性（render/sortable/enumName/width/children）
        const userColMap = {};
        const walkUser = cols => {
          (cols || []).forEach(c => {
            if (c.children && c.children.length) walkUser(c.children);
            else if (c.prop) userColMap[c.prop] = c;
          });
        };
        walkUser(this.columns);

        // API order 排序 → 构建列
        const sorted = [...fields].sort(
          (a, b) => (a.order != null ? a.order : 0) - (b.order != null ? b.order : 0)
        );
        const apiColumns = sorted.map(f => {
          const user = userColMap[f.fieldName];
          const base = {
            prop: f.fieldName,
            label: f.displayName || f.fieldName,
            show: f.isVisible !== false,
            fixed: f.isFixed || false,
            sortable: false,
          };
          if (user) {
            return {
              ...base,
              render: user.render,
              renderSlot: user.renderSlot,
              sortable: user.sortable,
              attrs: user.attrs,
              width: user.width,
              minWidth: user.minWidth,
              children: user.children,
              enumName: f.enumName || user.enumName,
            };
          }
          return { ...base, enumName: f.enumName || undefined };
        });

        // 用户手动列不在 API 中的 → 追加末尾
        Object.values(userColMap).forEach(c => {
          if (!apiColumns.find(a => a.prop === c.prop)) apiColumns.push({ ...c });
        });

        this.columns.splice(0, this.columns.length, ...apiColumns);
        // 标记已成功加载，Swagger 列生成不再覆盖
        this.hasColumnConfig = true;
        console.log(`\x1b[36m\x1b[4mol-crud 已加载列配置`, apiColumns.length, "列");
      } catch (err) {
        console.warn("[ol-crud] 加载列配置失败:", err);
      }
    },

    /** 打开列配置弹窗（persisted 模式） */
    openColumnConfig() {
      this.columnConfigVisible = true;
    },

    /** 打开实体变更记录（需勾选至少一条） */
    openEntityChange() {
      if (!this.currentSelection.length) {
        this.$message && this.$message.warning("请至少勾选一条数据");
        return;
      }
      this.entityChangeVisible = true;
    },

    /** 列配置保存：更新 show/fixed/label，按弹窗顺序重排 */
    onColumnConfigSave(result) {
      const resultMap = {};
      result.forEach(r => {
        resultMap[r.prop] = r;
      });

      // 更新现有列属性（$set 保证 Vue 2 响应式）
      const walk = cols => {
        (cols || []).forEach(col => {
          if (col.children && col.children.length) {
            walk(col.children);
          } else {
            const r = resultMap[col.prop];
            if (r) {
              this.$set(col, "show", r.show !== false);
              this.$set(col, "fixed", r.fixed || false);
              if (r.alias) this.$set(col, "label", r.alias);
              if (r.roleIds) this.$set(col, "roleIds", r.roleIds);
            }
          }
        });
      };
      walk(this.columns);

      // 按 result 顺序重排叶子列
      const leaves = [];
      const collect = cols => {
        (cols || []).forEach(c => {
          if (c.children && c.children.length) collect(c.children);
          else leaves.push(c);
        });
      };
      collect(this.columns);

      const ordered = [];
      result.forEach(r => {
        const col = leaves.find(c => c.prop === r.prop);
        if (col) ordered.push(col);
      });
      leaves.forEach(c => {
        if (!ordered.find(x => x.prop === c.prop)) ordered.push(c);
      });

      this.columns.splice(0, this.columns.length, ...ordered);
      this.tableKey++;

      this.$emit("column-config-save", result);
    },

    /** 打开配置弹窗 */
    openConfigDialog() {
      this.configDialogVisible = true;
    },

    /** 保存当前搜索条件为默认筛选 */
    async handleSaveSearch() {
      if (!this.$cfg("showCustomSearch")) {
        // 非配置模式：emit 保存事件，由父组件处理
        this.$emit("handleSave", { ...this.internalSearchModel });
        return;
      }

      // 配置模式：构建 filterConditions 并持久化到后端
      const { cleanParams } = this.buildSearchParams();
      const filterConditions = [];
      Object.keys(cleanParams).forEach(key => {
        const field = this.searchFields.find(f => f.prop === key);
        filterConditions.push({
          key,
          values: Array.isArray(cleanParams[key]) ? cleanParams[key] : [cleanParams[key]],
          compare: this.compareMap[key] || (field && field.compare) || "",
        });
      });

      const menuId = this.resolveMenuId();
      if (!menuId || typeof this.post !== "function") return;

      try {
        const res = await this.post({
          url: "/api/app/menu-search-setting/set-default-filter",
          data: {
            sysMenuId: menuId,
            defaultFilterJson: JSON.stringify(filterConditions),
          },
        });
        if (res.code === 200) {
          this.$message && this.$message.success("保存成功");
        }
      } catch (err) {
        console.warn("[ol-crud] 保存搜索条件失败:", err);
      }
    },

    /** 保存配置：更新本地 searchFields 并持久化到后端 */
    async handleSaveConfig(configList) {
      const newFields = (configList || []).map(oldFieldToNew);
      this.searchFields.splice(0, this.searchFields.length, ...newFields);
      this.initSearchDefaults();
      // 重置 compareMap 以同步新的 compare 默认值
      this.compareReset();
      this.loadOptionSources();
      this.$emit("config-save", newFields);

      // 持久化到后端
      const id = this.resolveMenuId();
      if (id && typeof this.post === "function") {
        try {
          // 保存时转回旧格式（SearchConfigDialog 输出的就是旧格式）
          const saveData = (configList || []).map(item => ({
            ...item,
            value: item.value,
            inputType: item.inputType,
            children: item.children,
          }));
          const res = await this.post({
            url: `/api/app/menu-search-setting`,
            data: {
              sysMenuId: id,
              settingJson: JSON.stringify(saveData),
            },
          });
          if (res.code === 200) {
            this.$message && this.$message.success("搜索配置保存成功");
          }
        } catch (err) {
          console.warn("[ol-crud] 保存搜索配置失败:", err);
        }
      }

      console.log(`\x1b[36m\x1b[4mol-crud 保存搜索配置`, newFields);
    },

    // ===================== 表格 =====================

    /** 多选变化 */
    onSelectionChange(val) {
      this.currentSelection = val;
      this.$emit("selection-change", val);
      this.$emit("update:selection", val);
    },

    /** 行点击 */
    onRowClick(row, column, event) {
      if (column && column.label === "操作") return;
      this.$emit("row-click", row, column, event);
    },

    /** 排序变化 */
    onSortChange(sort) {
      this.$emit("sort-change", sort);
    },

    /** 序号计算 */
    computeIndex(index) {
      const page = (this.displayPagination && this.displayPagination.page) || 1;
      const limit = (this.displayPagination && this.displayPagination.limit) || 30;
      return (page - 1) * limit + index + 1;
    },

    /** 刷新 */
    handleRefresh() {
      if (this.fetchingData) return;
      if (this.shouldAutoFetch) {
        this.fetchList();
      }
      this.$emit("refresh");
    },

    /** 打印：直接调起浏览器打印，列和数据和当前表格一致 */
    handlePrint() {
      if (!this.displayTableData || this.displayTableData.length === 0) return;

      // 组装打印数据
      const current =
        (this.$router && this.$router.history && this.$router.history.current) || this.$route;
      this.printListObj.title =
        (current && current.name) ||
        (this.$route && this.$route.meta && this.$route.meta.title) ||
        document.title;
      this.printListObj.tableHeader = this.visibleColumns;
      this.printListObj.tableData = this.displayTableData;

      this.$nextTick(() => {
        setTimeout(() => {
          const printRoot =
            (this.$refs.printTemplate && this.$refs.printTemplate.$el) ||
            this.$el.querySelector(".crud-print-template");
          if (!printRoot) {
            console.error("[ol-crud] 未找到打印区域");
            return;
          }
          printTableElement(printRoot);
        }, 50);
      });

      this.$emit("print", this.printListObj);
    },

    // ===================== 分页 =====================

    /** 每页条数变化 */
    onSizeChange(limit) {
      const pg = this.internalPagination;
      pg.limit = limit;
      pg.page = 1;
      this.$emit("update:pagination", { ...pg });
      this.$emit("size-change", limit);
      if (this.shouldAutoFetch) {
        this.fetchList();
      }
    },

    /** 页码变化 */
    onPageChange(page) {
      const pg = this.internalPagination;
      pg.page = page;
      this.$emit("update:pagination", { ...pg });
      this.$emit("page-change", page);
      if (this.shouldAutoFetch) {
        this.fetchList();
      }
    },

    // ===================== 公开方法（通过 ref 调用） =====================

    /** 获取搜索参数 */
    getSearchParams() {
      return { ...this.internalSearchModel };
    },

    /** 设置搜索参数 */
    setSearchParams(params) {
      Object.keys(params).forEach(key => {
        if (key in this.internalSearchModel) {
          this.internalSearchModel[key] = params[key];
        }
      });
    },

    /** 获取当前选中行 */
    getSelection() {
      return this.currentSelection;
    },

    /** 清空选中 */
    clearSelection() {
      if (this.$refs.crudTable) {
        this.$refs.crudTable.clearSelection();
      }
    },

    /** 触发查询（供外部调用），返回 Promise 可 await */
    search() {
      return this.handleSearch();
    },

    /** 触发重置（供外部调用），返回 Promise 可 await */
    reset() {
      return this.handleReset();
    },
  },
};
</script>

<style lang="scss" scoped>
/* ==================== 容器 ==================== */
.ol-crud {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
  padding: 10px;
  overflow: hidden;

  &--loading {
    pointer-events: none;
    opacity: 0.7;
  }
}

/* ==================== 搜索栏 ==================== */
.crud-search {
  $col-gap: 8px;
  $row-gap: 6px;

  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;

  &-empty {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    min-height: 36px;

    &-text {
      color: #909399;
      font-size: 13px;
    }
  }

  .crud-search-form {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    width: 100%;
  }

  // 覆盖 el-form--inline 的 inline-block，改为 flex
  ::v-deep .el-form-item {
    display: flex;
    margin-right: 0;
    margin-bottom: 0;
  }

  .crud-search-fields {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
    gap: $row-gap $col-gap;
  }

  .crud-search-item {
    width: calc((100% - 3 * #{$col-gap}) / 4);
    display: flex;
    margin-right: 0 !important;
    margin-bottom: 0 !important;

    // 标签：固定宽度 + 右对齐，跨行输入框对齐
    ::v-deep .el-form-item__label {
      width: 6em;
      flex-shrink: 0;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 6px;
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

  // 比较符前缀 + 输入框组合
  .select-with-prefix,
  .input-with-prefix {
    display: flex;
    align-items: center;
    gap: 4px;

    ::v-deep .compare-prefix-select {
      flex: 0 0 auto;
    }

    > .el-select,
    > .el-input {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  // 按钮组：始终一行靠右
  .crud-search-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    white-space: nowrap;

    .el-button {
      margin-left: 0 !important;
    }
  }
}

/* ==================== 工具栏 ==================== */
.crud-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;

  &-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &-icon {
    display: block;
    width: 26px;
    height: 26px;
    padding: 5px;
    line-height: 16px;
    text-align: center;
    color: #333;
    border: 1px solid #ccc;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.75;
    }
  }
}

.crud-column-filter {
  padding: 5px;
  max-height: 60vh;
  overflow-y: auto;

  .crud-column-checkbox {
    display: block;
    margin: 4px 0;
  }
}

/* ==================== 表格 ==================== */
.crud-table {
  flex: 1;
  overflow: auto;

  ::v-deep .el-table {
    td {
      padding: 0;

      .cell {
        line-height: 28px;
        font-size: 12px;
      }
    }

    th {
      padding: 0;
      background: #f5f7fa;

      .cell {
        line-height: 28px;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  ::v-deep .el-table__body tr.current-row > td {
    background-color: rgb(24, 144, 255) !important;
    color: #fff;
  }
}

/* 操作列 */
.crud-operate-group {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  .el-button {
    padding: 4px 6px;
    font-size: 12px;
  }
}

/* 空状态 */
.crud-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

/* ==================== 分页 ==================== */
.crud-pagination {
  display: flex;
  justify-content: flex-start;
  padding: 0;
}

/* ==================== 数字输入框隐藏箭头 ==================== */
::v-deep .crud-number-input input::-webkit-outer-spin-button,
::v-deep .crud-number-input input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}

::v-deep .crud-number-input input[type="number"] {
  -moz-appearance: textfield !important;
}

::v-deep .crud-number-input .el-input__inner {
  line-height: 1px !important;
}
.crud-toolbar-left {
  gap: 0px !important;
}
</style>

<!-- 打印样式（非 scoped，影响打印模板） -->
<style lang="scss">
@media print {
  .crud-print-template {
    display: block !important;
    visibility: visible !important;
    position: static !important;
  }

  .crud-print-template table {
    width: 100% !important;
    table-layout: auto !important;
    word-break: break-all;
    font-size: 10px !important;
  }

  .crud-print-template th,
  .crud-print-template td {
    padding: 4px 6px !important;
    font-size: 10px !important;
    line-height: 1.3 !important;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  /* 确保表格不超出页面 */
  .crud-print-template .Print_body_table {
    overflow: visible !important;
    width: 100% !important;
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
