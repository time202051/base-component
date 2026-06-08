# ol-curd 通用增删改查组件

基于 Element UI 的 Vue 2 企业级 CRUD 组件，集成搜索、表格、分页、工具栏、列配置、打印、实体变更记录等功能。支持从 Swagger 自动映射搜索字段和表格列。

---

## 基础用法

最简单的使用方式，只需传 `url`，其他全部用默认值：

```html
<ol-curd url="/api/app/product" />
```

这等价于：

```html
<ol-curd
  url="/api/app/product"
  showSearch
  showSelection
  showIndex
  showRefreshBtn
  showPrintBtn
  method="get"
  :pageParams="{ page: 'Page', limit: 'MaxResultCount' }"
/>
```

> 所有 show 类属性默认值见 [全局配置](#全局配置-olbaseconfig)。

---

## Props 速查

### Swagger

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | String | `''` | Swagger 接口路径，如 `/api/app/product`。自动获取搜索字段和表格列 |

### 数据请求

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fetchData` | Function | `null` | 自定义请求函数，见 [fetchData 模式](#模式二fetchdata-自定义请求推荐) |
| `method` | String | `'get'` | 请求方式 `'get'` 或 `'post'` |
| `pageParams` | Object | `{ page:'Page', limit:'MaxResultCount' }` | 分页参数名映射 |
| `responseHandler` | Function | `null` | 响应解析函数，见 [responseHandler](#responsehandler) |

### 搜索

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showSearch` | Boolean | `true` | 是否显示搜索栏 |
| `searchFields` | Array | `[]` | 搜索字段配置，见 [搜索字段](#搜索字段) |
| `searchModel` | Object | `{}` | 搜索表单初始值，支持 `.sync` |
| `searchRules` | Object | `{}` | 搜索表单 Element UI 校验规则 |
| `columnsPerRow` | Number | `4` | 每行显示的搜索字段数，超出折叠 |
| `showCustomSearch` | Boolean | `false` | 是否开启自定义搜索配置模式 |
| `customs` | Array | `[]` | 可用搜索字段列表，手动模式需传入 |
| `menuId` | String/Number | `''` | 菜单ID，用于搜索/列配置持久化 |

### 表格

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | Array | `[]` | 列配置，见 [表格列](#表格列) |
| `showSelection` | Boolean | `true` | 是否显示多选列，支持 `.sync` |
| `showIndex` | Boolean | `true` | 是否显示序号列 |
| `operates` | Array | `[]` | 操作列按钮，见 [操作列](#操作列) |
| `operatesAttrs` | Object | `{}` | 操作列属性，透传 el-table-column |
| `tableAttrs` | Object | `{}` | 透传 el-table 的属性（如 row-key） |

### 工具栏

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showRefreshBtn` | Boolean | `true` | 是否显示刷新按钮 |
| `showPrintBtn` | Boolean | `true` | 是否显示打印按钮 |
| `showSmartPrintBtn` | Boolean | `false` | 是否显示智能打印（模板打印） |
| `smartPrintMenuId` | String | `''` | 智能打印菜单ID |
| `printData` | Array | `[]` | 智能打印数据，默认用当前表格数据 |
| `showColumnFilterBtn` | Boolean | `false` | 是否显示列过滤入口 |
| `columnConfigMode` | String | `'simple'` | 列配置模式 `'simple'`（下拉勾选）或 `'persisted'`（弹窗拖拽+API持久化） |
| `pageKey` | String | `''` | persisted 模式页面标识，默认取 `$route.path` |
| `showEntityChangeBtn` | Boolean | `false` | 是否显示实体变更记录按钮 |
| `btnlist` | Array | `[]` | 菜单配置的按钮列表 |

### 分页

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pagination` | Object | `{ page:1, limit:30, total:0, show:true }` | 分页初始值，支持 `.sync`。`show:false` 可隐藏分页 |
| `pageSizes` | Array | `[20,30,40,60,100,200]` | 每页条数选项 |

### 钩子

| Prop | 类型 | 说明 |
|------|------|------|
| `onSearchSwagger` | Function | Swagger 搜索字段映射后、合并前。`({ columns }) => ({ columns })` |
| `onSearchMerged` | Function | 搜索字段合并完成+日期识别后。`({ columns }) => ({ columns })` |
| `onTableSwagger` | Function | Swagger 表格列 properties 映射后。`({ columns }) => ({ columns })` |
| `onTableMerged` | Function | 表格列合并+补标签后。`({ columns }) => ({ columns })` |

---

## 数据获取

### 模式一：自动模式（零代码）

curd 自动通过 `url` 调用接口，管理 loading、分页、数据。

```html
<ol-curd url="/api/app/product" />
```

**数据流：** 用户点查询 → curd 调 `this.get/post({ url, data: params })` → 解析 response → 表格自动渲染。

**接口返回格式要求：** 内置支持 `{ result: { items/records/list/data: [], total/totalCount/count: N } }` 或 `{ result: [] }`。不匹配时用 `responseHandler` 自定义解析。

### 模式二：fetchData 自定义请求

curd 管理 UI 状态（loading、分页），父组件只负责调接口返回 `{ rows, total }`。

```html
<ol-curd
  url="/api/app/product"
  :fetchData="fetchList"
  ref="curd"
/>
```

```js
export default {
  methods: {
    // curd 自动传参，父组件只管调接口和返回数据
    async fetchList({ searchParams, filterConditions, page, limit, pagination }) {
      const res = await this.$http.get('/api/app/product', {
        params: {
          Page: page,
          MaxResultCount: limit,
          ...searchParams,
        }
      })
      return {
        rows: res.data.items,
        total: res.data.totalCount,
      }
    },

    // 自定义按钮操作后刷新
    async batchDelete() {
      await this.$http.post('/api/app/product/delete', { ids })
      this.$refs.curd.refresh()
    },
  }
}
```

**`fetchData` 入参：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `searchParams` | Object | 当前搜索条件（已清理空值、拆分日期范围） |
| `filterConditions` | Array | 自定义搜索配置模式时自动构建的 FilterConditions，普通模式为 `undefined` |
| `page` | Number | 当前页码 |
| `limit` | Number | 每页条数 |
| `pagination` | Object | 完整分页 `{ page, limit, total }` |

**返回值：** `{ rows: [], total: 0 }` 或 Promise。

---

## 搜索栏

### 搜索字段 Props

```js
{
  prop: 'name',           // 字段名，提交给后端的 key（必填）
  label: '名称',          // 显示的标签（必填）
  type: 'input',          // 控件类型（必填）
  visible: true,          // 是否展示，默认 true
  defaultValue: '',       // 默认值
  placeholder: '',        // 占位文本
  compare: '',            // 自定义搜索比较符（配置模式用）
  props: {},              // 透传给 Element UI 控件的属性
  options: [],            // select 选项 [{ key, label }]
}
```

### 搜索字段类型

| type | 渲染控件 | 说明 |
|------|----------|------|
| `input` | `el-input` | 文本输入 |
| `number` | `el-input`（数字限制） | 数字输入，自动过滤非数字字符 |
| `select` | `el-select` | 下拉选择，需传 `options` |
| `remoteSelect` | `el-select`（远程搜索） | 需配置 `remoteMethod` 和 `onLoadMore` |
| `date` | `el-date-picker` type=date | 日期选择 |
| `datetime` | `el-date-picker` type=datetime | 日期时间选择 |
| `daterange` | `el-date-picker` type=daterange | 日期范围，自动拆分为 `xxxBegin` / `xxxEnd` |
| `datetimerange` | `el-date-picker` type=datetimerange | 日期时间范围 |
| `numberRange` | `ol-number-range` | 数字范围 |

### 基础搜索

```html
<ol-curd url="/api/app/product" :searchFields="searchFields" />
```

```js
data() {
  return {
    searchFields: [
      { prop: 'name', label: '名称', type: 'input' },
      { prop: 'status', label: '状态', type: 'select', options: [
        { key: 1, label: '启用' }, { key: 0, label: '禁用' }
      ]},
      { prop: 'price', label: '价格', type: 'number' },
      { prop: 'createTime', label: '创建时间', type: 'daterange' },
    ]
  }
}
```

### 搜索表单初始值

```html
<ol-curd :searchFields="searchFields" :searchModel="{ status: 1 }" />
```

### 搜索条件双向绑定

```html
<ol-curd :searchFields="searchFields" :searchModel.sync="myModel" />
```

> 点击"查询"按钮时触发同步，不是实时 keystroke。

### 每行字段数

```html
<ol-curd :columnsPerRow="3" />
```

超出自动折叠，显示"展开/收起"按钮。

### Swagger 自动映射搜索字段

传 `url` 后，curd 自动从 Swagger 获取接口参数生成搜索字段：

```html
<ol-curd url="/api/app/product" />
```

手动传的 `searchFields` 会与 Swagger 字段合并（Swagger 打底，手动覆盖）。

**4 个钩子控制处理过程：**

```html
<ol-curd
  url="/api/app/product"
  :onSearchSwagger="({ columns }) => ({ columns: columns.filter(c => c.prop !== 'debug') })"
  :onSearchMerged="({ columns }) => ({ columns })"
  :onTableSwagger="({ columns }) => ({ columns })"
  :onTableMerged="({ columns }) => {
    // 统一加 minWidth
    return { columns: columns.map(c => ({ ...c, minWidth: '100' })) }
  }"
/>
```

| 钩子 | 时机 | 入参/返回 |
|------|------|-----------|
| `onSearchSwagger` | Swagger 字段映射后、与手动配置合并前 | `{ columns }` → `{ columns }` |
| `onSearchMerged` | 合并完成 + 日期识别后 | `{ columns }` → `{ columns }` |
| `onTableSwagger` | Swagger 表格列 properties 提取后、合并前 | `{ columns }` → `{ columns }` |
| `onTableMerged` | Swagger + 手动列合并 + 补标签后 | `{ columns }` → `{ columns }` |

---

## 表格列

### 列 Props

```js
{
  prop: 'name',           // 字段名（必填）
  label: '名称',          // 列标题（必填）
  show: true,             // 是否显示，默认 true
  fixed: false,           // 固定列 'left' / 'right' / false
  sortable: false,        // 是否可排序
  width: '',              // 固定列宽
  minWidth: '',           // 最小列宽
  render: null,           // 自定义渲染函数 (row, column, $index) => VNode
  renderSlot: false,      // 是否走插槽渲染（自动检测，通常不需手动设）
  children: [],           // 多级表头子列
  alias: '',              // 别名（列配置弹窗中显示）
  roleIds: [],            // 可用角色（列配置权限控制）
}
```

### 基础列

```html
<ol-curd url="/api/app/product" :columns="columns" />
```

```js
data() {
  return {
    columns: [
      { prop: 'name', label: '名称', minWidth: '120' },
      { prop: 'price', label: '价格', width: '100', sortable: true },
      { prop: 'status', label: '状态', width: '80' },
      { prop: 'createTime', label: '创建时间', minWidth: '160' },
    ]
  }
}
```

### Swagger 自动生成列

传 `url` 后自动从 Swagger 响应的 properties 提取列定义：

```html
<ol-curd url="/api/app/product" />
```

手动传的 `columns` 中已有的 prop 不会重复添加。枚举字段自动映射为 `xxxDesc`，boolean 字段映射为 `xxxText`。

### 自定义列渲染

**方式一：插槽（推荐）**

```html
<ol-curd url="/api/app/product" :columns="columns">
  <!-- 插槽名 = 列的 prop -->
  <template #status="{ row, $index, column }">
    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
      {{ row.status === 1 ? '启用' : '禁用' }}
    </el-tag>
  </template>

  <template #price="{ row }">
    <span style="color: #e74c3c">¥{{ row.price.toFixed(2) }}</span>
  </template>
</ol-curd>
```

curd 自动检测父组件插槽，为匹配的列设置 `renderSlot: true`。

> 插槽作用域：`{ row, $index, column }`

**方式二：render 函数**

```js
columns: [
  {
    prop: 'price',
    label: '价格',
    render: (row) => `¥${row.price.toFixed(2)}`
  }
]
```

### 多级表头

```js
columns: [
  {
    label: '基本信息',
    children: [
      { prop: 'name', label: '名称' },
      { prop: 'code', label: '编码' },
    ]
  },
  {
    label: '价格信息',
    children: [
      { prop: 'costPrice', label: '成本价' },
      { prop: 'salePrice', label: '销售价' },
    ]
  },
]
```

### #column 插槽（完全自定义列）

```html
<ol-curd url="/api/app/product">
  <template #column="{ columns }">
    <el-table-column
      v-for="col in columns"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
    />
  </template>
</ol-curd>
```

---

## 操作列

```html
<ol-curd url="/api/app/product" :operates="operates" />
```

```js
data() {
  return {
    operates: [
      {
        label: '编辑',
        type: 'primary',          // el-button type，默认 'text'
        size: 'small',            // el-button size，默认 'small'
        icon: 'el-icon-edit',
        click: (row, index) => {
          // 打开编辑弹窗
        }
      },
      {
        label: '删除',
        type: 'danger',
        icon: 'el-icon-delete',
        // 已审核的不可删除
        disabled: (row) => row.status === 'audited',
        click: (row) => this.handleDelete(row)
      },
      {
        label: '审核',
        // 已审核的隐藏
        hidden: (row) => row.status === 'audited',
        click: (row) => this.audit(row)
      },
    ]
  }
}
```

**operate 对象属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | String | 按钮文字（必填） |
| `click` | Function | 点击回调 `(row, $index)`（必填） |
| `type` | String | el-button type，默认 `'text'` |
| `size` | String | el-button size，默认 `'small'` |
| `icon` | String | 图标 class |
| `hidden` | Boolean/Function | 是否隐藏，支持 `boolean` 或 `(row, $index) => boolean` |
| `disabled` | Boolean/Function | 是否禁用，支持 `boolean` 或 `(row, $index) => boolean` |

**操作列宽度**（自动根据按钮数量）：

| 按钮数 | min-width |
|--------|-----------|
| ≤ 2 | 100px |
| ≤ 4 | 160px |
| > 4 | 200px |

手动覆盖：`:operatesAttrs="{ width: '220px', fixed: 'right' }"`

---

## 表格多选

```html
<ol-curd url="/api/app/product" ref="curd" :selection.sync="selectedRows" />
```

```js
data() { return { selectedRows: [] } },
methods: {
  batchDelete() {
    if (!this.selectedRows.length) return this.$message.warning('请先勾选数据')
    const ids = this.selectedRows.map(r => r.id)
    // ...批量删除
  }
}
```

`selectedRows` 通过 `.sync` 始终与表格勾选保持同步。

---

## 工具栏

### 内置工具按钮

```html
<ol-curd
  url="/api/app/product"
  showRefreshBtn        <!-- 刷新，默认 true -->
  showPrintBtn          <!-- 打印，默认 true -->
  showColumnFilterBtn  <!-- 列过滤，默认 false -->
  showSmartPrintBtn    <!-- 智能打印，默认 false -->
  showEntityChangeBtn  <!-- 实体变更记录，默认 false -->
/>
```

### 自定义按钮（btnlist）

通过菜单管理系统配置，`hasBtn` 工具函数自动从 `localStorage.wms.SET_MENUS` 读取按钮并绑定方法：

```html
<ol-curd url="/api/app/product" :btnlist="this.hasBtn(this)" />
```

```js
// hasBtn 已全局注册为 Vue.prototype.hasBtn
// 它会自动匹配当前路由的菜单配置，绑定同名方法
methods: {
  create() { /* 打开新增弹窗 */ },
  export() { /* 导出逻辑 */ },
  import() { /* 导入逻辑 */ },
}
```

### 工具栏插槽

```
┌─ crud-toolbar ─────────────────────────────────────────────────────┐
│ ┌─ toolbar-left ───────────────┐ ┌─ toolbar-right ──────────────┐ │
│ │ #toolbarBefore               │ │ #toolbarActions               │ │
│ │ [btn1] [btn2] ← btnlist      │ │ [列配置] [刷新] [打印] ...    │ │
│ │ #toolbarAfter                │ │ #toolbarActionsAfter          │ │
│ └──────────────────────────────┘ └───────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

```html
<ol-curd url="/api/app/product">
  <template #toolbarBefore="{ selection, pagination }">
    <span>已选 {{ selection.length }} / 共 {{ pagination.total }} 条</span>
  </template>

  <template #toolbarAfter="{ loading }">
    <el-button :disabled="loading" @click="exportAll">全部导出</el-button>
  </template>

  <template #toolbarActions="{ searchModel }">
    <el-tag>当前搜索：{{ searchModel.name }}</el-tag>
  </template>

  <template #toolbarActionsAfter="{ tableData }">
    <span>当前页 {{ tableData.length }} 条</span>
  </template>
</ol-curd>
```

**插槽作用域：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `loading` | Boolean | 是否加载中 |
| `selection` | Array | 已勾选行数据 |
| `tableData` | Array | 当前表格数据 |
| `pagination` | Object | 分页 `{ page, limit, total }` |
| `searchModel` | Object | 当前搜索条件 |
| `columns` | Array | 可见列配置 |

---

## 列配置

### simple 模式（下拉勾选）

点击列图标 → 下拉 checkbox 列表 → 勾选即时生效。

```html
<ol-curd
  url="/api/app/product"
  showColumnFilterBtn
  columnConfigMode="simple"
/>
```

### persisted 模式（弹窗拖拽 + API 持久化）

点击列图标 → 弹窗拖拽排序、设置显示/别名/角色 → 保存调 API 持久化 → 下次打开自动恢复。

```html
<ol-curd
  url="/api/app/product"
  showColumnFilterBtn
  columnConfigMode="persisted"
  menuId="123"
  pageKey="/product/list"
/>
```

| 相关 Prop | 说明 |
|-----------|------|
| `columnConfigMode` | `'simple'` 或 `'persisted'` |
| `pageKey` | 页面标识，默认 `$route.path` |
| `menuId` | 菜单ID |

---

## 打印

**普通打印：** 打印当前表格数据（同步列可见性和顺序）。

```html
<ol-curd url="/api/app/product" showPrintBtn />
```

**智能打印（模板打印）：**

```html
<ol-curd
  url="/api/app/product"
  showSmartPrintBtn
  :smartPrintMenuId="123"
  :printData="customData"
/>
```

---

## 实体变更记录

勾选行后点击图标，弹窗展示变更历史（字段级别新旧值对比）。内部使用 Swagger 自动生成列。

```html
<ol-curd url="/api/app/product" showEntityChangeBtn />
```

接口地址：`/api/app/audit-logging/entity-change-pages`

---

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `search` | `(model, { filterConditions })` | 点击查询 |
| `reset` | `(model)` | 点击重置 |
| `selection-change` | `(rows)` | 勾选变化 |
| `update:selection` | `(rows)` | 勾选变化，`.sync` |
| `row-click` | `(row, column, event)` | 行点击（操作列除外） |
| `sort-change` | `(sort)` | 排序变化 |
| `page-change` | `(page)` | 页码变化 |
| `size-change` | `(limit)` | 每页条数变化 |
| `update:tableData` | `(rows)` | 表格数据变化，`.sync` |
| `update:pagination` | `(pagination)` | 分页变化，`.sync` |
| `update:loading` | `(loading)` | 加载状态变化，`.sync` |
| `update:searchModel` | `(model)` | 搜索条件变化，`.sync` |
| `data-loaded` | `({ rows, total })` | 数据加载完成 |
| `data-error` | `(error)` | 数据加载失败 |
| `refresh` | — | 刷新按钮点击 |
| `print` | `(printListObj)` | 打印按钮点击 |
| `column-config-save` | `(columns)` | 列配置保存 |
| `config-save` | `(fields)` | 搜索配置保存 |

---

## Slots 插槽

| 插槽名 | 作用域 | 说明 |
|--------|--------|------|
| `toolbarBefore` | `{ loading, selection, tableData, pagination, searchModel, columns }` | 工具栏左侧，btnlist 之前 |
| `toolbarAfter` | 同上 | 工具栏左侧，btnlist 之后 |
| `toolbarActions` | 同上 | 工具栏右侧，工具按钮之前 |
| `toolbarActionsAfter` | 同上 | 工具栏右侧，工具按钮之后 |
| `column` | `{ columns }` | 完全自定义表格列 |
| `empty` | — | 表格空状态，默认显示"暂无数据" |
| `[propName]` | `{ row, $index, column }` | 表格列插槽（prop = 列的 prop 名） |

---

## Methods 方法

通过 `$refs` 调用：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `refresh()` | — | Promise | 刷新表格，保持当前搜索+分页 |
| `search()` | — | Promise | 触发查询 |
| `reset()` | — | Promise | 重置搜索条件并查询 |
| `getSelection()` | — | Array | 获取当前勾选行 |
| `clearSelection()` | — | — | 清空勾选 |
| `getSearchParams()` | — | Object | 获取当前搜索参数 |
| `setSearchParams(params)` | Object | — | 设置搜索参数（部分更新） |

---

## responseHandler

仅自动模式（不传 `fetchData`）下生效。用于自定义后端响应数据解析。

**入参：** 后端返回的原始 response  
**返回：** `{ rows: [], total: 0 }`

**内置解析支持的格式（不传时自动识别）：**

| 返回格式 | 识别 |
|---|---|
| `{ result: { items: [], total: 10 } }` | ✅ |
| `{ result: { items: [], totalCount: 10 } }` | ✅ |
| `{ result: { records: [], total: 10 } }` | ✅ |
| `{ result: { list: [], total: 10 } }` | ✅ |
| `{ result: { data: [], total: 10 } }` | ✅ |
| `{ result: [] }` | ✅（无分页，total=length） |

**使用示例：**

```html
<ol-curd url="/api/app/product" :responseHandler="handleResponse" />
```

```js
// 后端: { code: 200, data: { items: [...], totalCount: 10 }, msg: 'ok' }
methods: {
  handleResponse(response) {
    return {
      rows: response.data.items,
      total: response.data.totalCount,
    }
  }
}
```

---

## 全局配置 $olBaseConfig

项目入口注册时设置，所有 `ol-curd` 实例生效：

```js
import OlBaseComponents from 'ol-base-components'

Vue.use(OlBaseComponents, {
  method: 'post',
  showPrintBtn: false,
  showSmartPrintBtn: true,
})
```

### 支持全局配置的 Prop（使用 `$cfg` 机制）

| Prop | 默认值 | 说明 |
|------|--------|------|
| `showSearch` | `true` | 是否显示搜索栏 |
| `showSelection` | `true` | 是否显示多选列 |
| `showIndex` | `true` | 是否显示序号列 |
| `showRefreshBtn` | `true` | 是否显示刷新按钮 |
| `showPrintBtn` | `true` | 是否显示打印按钮 |
| `showCustomSearch` | `false` | 是否显示自定义搜索配置 |
| `showColumnFilterBtn` | `false` | 是否显示列过滤入口 |
| `showSmartPrintBtn` | `false` | 是否显示智能打印按钮 |
| `showEntityChangeBtn` | `false` | 是否显示实体变更记录按钮 |

### 优先级

```
组件直接传参 > $olBaseConfig 全局 > 硬编码默认值
```

```html
<!-- 全局开了智能打印，这里可以关闭 -->
<ol-curd url="/api/app/product" :showSmartPrintBtn="false" />
```

---

## 示例：完整页面

```html
<template>
  <ol-curd
    url="/api/app/product"
    :fetchData="fetchList"
    :btnlist="this.hasBtn(this)"
    :selection.sync="selectedRows"
    :searchModel.sync="query"
    :operates="operates"
    ref="curd"
  >
    <!-- 工具栏 -->
    <template #toolbarBefore="{ selection, pagination }">
      <span class="count-tip">已选 {{ selection.length }} / 共 {{ pagination.total }} 条</span>
    </template>

    <!-- 表格列插槽 -->
    <template #status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>
  </ol-curd>
</template>

<script>
export default {
  data() {
    return {
      selectedRows: [],
      query: {},
      operates: [
        {
          label: '编辑', type: 'primary', icon: 'el-icon-edit',
          click: (row) => this.handleEdit(row)
        },
        {
          label: '删除', type: 'danger', icon: 'el-icon-delete',
          disabled: (row) => row.status === 1,
          click: (row) => this.handleDelete(row)
        },
      ],
    }
  },
  methods: {
    // fetchData
    async fetchList({ searchParams, filterConditions, page, limit }) {
      const res = await this.$http.post('/api/app/product', {
        FilterConditions: filterConditions,
        Page: page,
        MaxResultCount: limit,
      })
      return { rows: res.result.items, total: res.result.totalCount }
    },
    // btnlist 按钮
    create() { /* 打开新增弹窗 */ },
    export() { /* 导出逻辑 */ },
    // 操作列
    handleEdit(row) { /* 打开编辑弹窗 */ },
    async handleDelete(row) {
      await this.$confirm('确认删除？')
      await this.$http.delete(`/api/app/product/${row.id}`)
      this.$message.success('删除成功')
      this.$refs.curd.refresh()
    },
  },
}
</script>
```
