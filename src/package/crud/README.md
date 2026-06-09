# ol-crud 增删改查

基于 Element UI 的 Vue 2 企业级 CRUD 组件。将 **搜索表单 + 数据表格 + 分页器 + 工具栏** 封装为一体，只需传一个接口地址即可运行。支持 Swagger 自动映射、自定义请求、列配置、打印、实体变更记录等功能。

---

## 使用场景

几乎所有后台管理页面都遵循同样的模式：搜索 → 列表 → 分页 → 操作。这个组件解决的就是这个重复劳动——你不再需要手写搜索表单、分页表格、加载状态、空状态这些样板代码。

**什么时候用它？** 只要页面主体是一个带搜索和分页的数据表格，就用它。比如用户列表、订单列表、商品管理、审批记录等。

---

## 快速开始

### 零代码模式

只需传一个 `url`，组件自动从 Swagger 获取字段定义、调接口、管理 UI 状态。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" />
```

等价于：

```html
<ol-crud
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

</details>

### fetchData 自定义请求

需要自定义请求逻辑（如参数签名、请求头、响应解密等）时，传 `fetchData`。crud 管理 UI，你只管调接口：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :fetchData="fetchList" ref="crud" />
```

```js
export default {
  methods: {
    async fetchList({ searchParams, filterConditions, page, limit }) {
      const res = await this.$http.get('/api/app/product', {
        params: { Page: page, MaxResultCount: limit, ...searchParams }
      })
      return { rows: res.data.items, total: res.data.totalCount }
    },
    // 操作完刷新表格
    handleDelete(row) {
      this.$refs.crud.refresh()
    }
  }
}
```

</details>

**fetchData 入参：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `searchParams` | `Object` | 当前搜索条件，日期范围已拆分为 `xxxBegin` / `xxxEnd` |
| `filterConditions` | `Array` | `showCustomSearch` 模式下自动构建，普通模式为 `undefined` |
| `page` | `Number` | 当前页码 |
| `limit` | `Number` | 每页条数 |
| `pagination` | `Object` | 完整分页 `{ page, limit, total }` |

**返回值：** `{ rows: [], total: 0 }`

### 接口返回格式

不传 `fetchData` 时，组件内置解析支持以下格式：

| 后端返回 | 状态 |
|------|------|
| `{ result: { items: [], total: 10 } }` | ✅ |
| `{ result: { records: [], total: 10 } }` | ✅ |
| `{ result: { list: [], total: 10 } }` | ✅ |
| `{ result: { data: [], total: 10 } }` | ✅ |
| `{ result: [] }` | ✅ （total = 数组长度） |

不匹配时用 `responseHandler` 自定义：

<details>
<summary>示例代码</summary>

```js
methods: {
  handleResponse(response) {
    return { rows: response.data.items, total: response.data.totalCount }
  }
}
```

```html
<ol-crud url="/api/app/product" :responseHandler="handleResponse" />
```

</details>

---

## 搜索栏

### 基础搜索

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :searchFields="searchFields" />
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

</details>

### 搜索字段类型一览

| `type` | 渲染控件 | 备注 |
|--------|----------|------|
| `input` | `el-input` | 文本输入，支持回车触发搜索 |
| `number` | `el-input`（数字过滤） | 自动过滤非数字字符 |
| `select` | `el-select` | 需传 `options: [{ key, label }]` |
| `remoteSelect` | `el-select` + 远程搜索 | 需配置 `remoteMethod`，可选 `onLoadMore` 滚动加载 |
| `date` | `el-date-picker[type=date]` | 单个日期 |
| `datetime` | `el-date-picker[type=datetime]` | 日期时间 |
| `daterange` | `el-date-picker[type=daterange]` | 日期范围，提交时拆为 `propBegin` / `propEnd` |
| `datetimerange` | `el-date-picker[type=datetimerange]` | 日期时间范围 |
| `numberRange` | `ol-number-range` | 数字范围 |

**`SearchField` 完整属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prop` | `String` | — | ★ 字段名，提交给后端的 key |
| `label` | `String` | — | ★ 显示的标签 |
| `type` | `String` | — | ★ 控件类型，见上表 |
| `visible` | `Boolean` | `true` | 是否在搜索栏显示 |
| `defaultValue` | `any` | — | 默认值 |
| `placeholder` | `String` | — | 占位文本，不传自动生成 |
| `compare` | `String` | — | 比较符：`contains` `eq` `gt` `lt` `gte` `lte` `in` `notin`（配置模式用） |
| `props` | `Object` | — | 透传给 Element UI 控件的属性，如 `{ multiple: true }` |
| `options` | `Array` | — | select 选项，每项 `{ key: string\|number, label: string }` |
| `remoteMethod` | `Function` | — | remoteSelect 远程搜索方法 `(query) => void` |
| `onLoadMore` | `Function` | — | remoteSelect 滚动到底部加载更多 |
| `loading` | `Boolean` | — | remoteSelect 加载中状态 |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface SearchField {
  prop: string
  label: string
  type: 'input' | 'number' | 'select' | 'remoteSelect' | 'date'
      | 'datetime' | 'daterange' | 'datetimerange' | 'numberRange'
  visible?: boolean
  defaultValue?: any
  placeholder?: string
  compare?: 'contains' | 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notin'
  props?: Record<string, any>
  options?: Array<{ key: string | number; label: string }>
  remoteMethod?: (query: string) => void
  onLoadMore?: () => void
  loading?: boolean
}
```

</details>

### 搜索初始值 & 双向绑定

<details>
<summary>示例代码</summary>

```html
<!-- 初始值 -->
<ol-crud :searchFields="fields" :searchModel="{ status: 1 }" />

<!-- 双向绑定：查询时自动同步 -->
<ol-crud :searchFields="fields" :searchModel.sync="myModel" />
```

</details>

> 注意：`.sync` 在点击「查询」按钮时触发，不是实时同步。

### 搜索校验

<details>
<summary>示例代码</summary>

```html
<ol-crud :searchFields="fields" :searchRules="rules" />
```

```js
data() {
  return {
    rules: {
      name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
      price: [{ type: 'number', message: '价格必须为数字' }],
    }
  }
}
```

</details>

校验规则是 Element UI 标准的 `el-form` rules 格式。

### 每行字段数 & 超出折叠

<details>
<summary>示例代码</summary>

```html
<ol-crud :columnsPerRow="3" />
```

</details>

默认每行 4 个搜索字段，超出自动折叠，显示「展开/收起」按钮。

### Swagger 自动映射搜索字段

传 `url` 后自动从 Swagger 接口参数生成搜索字段。手动传入的 `searchFields` 会与 Swagger 字段合并（Swagger 打底，手动覆盖）。

4 个钩子让你在映射流程中间插入处理逻辑：

<details>
<summary>示例代码</summary>

```html
<ol-crud
  url="/api/app/product"
  :onSearchSwagger="({ columns }) => ({ columns: columns.filter(c => c.prop !== 'debug') })"
  :onSearchMerged="({ columns }) => ({ columns })"
/>
```

</details>

| 钩子 | 调用时机 |
|------|----------|
| `onSearchSwagger` | Swagger 搜索字段映射后、与手动配置合并前 |
| `onSearchMerged` | 合并完成 + 日期类型识别后 |
| `onTableSwagger` | Swagger 表格列 properties 提取后、合并前 |
| `onTableMerged` | Swagger + 手动列合并 + 补标签后 |

### 自定义搜索配置（showCustomSearch）

开启 `showCustomSearch` 后搜索栏出现「配置」按钮，用户可以动态勾选想要展示的搜索字段，字段列表和排列顺序通过 API 持久化。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" showCustomSearch menuId="123" />
```

</details>

**customs 数据来源：**
- **自动模式**（只传 `url`）：分页接口返回 `response.result.customs`，crud 自动捕获
- **fetchData 模式**：父组件通过 `customs` prop 手动传入

搜索条件提交时会自动组装为 `FilterConditions` 格式传给后端（也会传给 `fetchData`）。

---

## 表格

### 基础列

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :columns="columns" />
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

</details>

**`TableColumn` 完整属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prop` | `String` | — | ★ 字段名，对应行数据的 key |
| `label` | `String` | — | ★ 列标题 |
| `show` | `Boolean` | `true` | 是否显示，`false` 时不在表格渲染 |
| `fixed` | `Boolean` / `String` | `false` | 固定列：`'left'` `'right'` |
| `sortable` | `Boolean` | `false` | 是否可排序 |
| `width` | `String` / `Number` | — | 固定列宽 |
| `minWidth` | `String` | `150px` | 最小列宽 |
| `align` | `String` | `'center'` | 对齐方式：`'left'` `'center'` `'right'` |
| `render` | `Function` | — | 渲染函数 `(row, column, $index) => any` |
| `renderSlot` | `Boolean` | — | 是否走插槽渲染，crud 自动检测 |
| `children` | `Array` | — | 多级表头子列 `TableColumn[]` |
| `alias` | `String` | — | 别名，列配置弹窗中显示 |
| `roleIds` | `Number[]` | — | 角色 ID 数组，用于列配置权限控制 |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface TableColumn {
  prop: string
  label: string
  show?: boolean
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  width?: string | number
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: any, column: TableColumn, $index: number) => any
  renderSlot?: boolean
  children?: TableColumn[]
  alias?: string
  roleIds?: number[]
}
```

</details>

### 操作列

每行末尾的操作按钮，支持动态显隐和禁用：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :operates="operates" />
```

```js
data() {
  return {
    operates: [
      {
        label: '编辑',
        type: 'primary',
        icon: 'el-icon-edit',
        click: (row, index) => { this.editDialog.open(row) }
      },
      {
        label: '删除',
        type: 'danger',
        icon: 'el-icon-delete',
        disabled: (row) => row.status === 'locked',   // 函数动态判断
        click: (row) => this.handleDelete(row)
      },
      {
        label: '审核',
        hidden: (row) => row.status !== 'pending',     // 待审核的才显示
        click: (row) => this.audit(row)
      },
    ]
  }
}
```

</details>

**`Operate` 属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `String` | — | ★ 按钮文字 |
| `click` | `Function` | — | ★ 点击回调 `(row, $index) => void` |
| `type` | `String` | `'text'` | el-button type：`'primary'` `'success'` `'warning'` `'danger'` `'info'` |
| `size` | `String` | `'small'` | el-button size |
| `icon` | `String` | — | 图标 class，如 `'el-icon-edit'` |
| `hidden` | `Boolean` / `Function` | `false` | 隐藏：`false` / `true` / `(row, $index) => boolean` |
| `disabled` | `Boolean` / `Function` | `false` | 禁用：`false` / `true` / `(row, $index) => boolean` |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface Operate {
  label: string
  click: (row: any, $index: number) => void
  type?: string
  size?: string
  icon?: string
  hidden?: boolean | ((row: any, $index: number) => boolean)
  disabled?: boolean | ((row: any, $index: number) => boolean)
}
```

</details>

操作列宽度根据按钮数量自动计算：≤2 个 → `100px`，≤4 个 → `160px`，>4 个 → `200px`。也可通过 `:operatesAttrs="{ width: '220px', fixed: 'right' }"` 手动覆盖。

### 自定义列渲染

**推荐：具名插槽** — 插槽名等于列的 `prop`，crud 自动检测：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :columns="columns">
  <template #status="{ row }">
    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
      {{ row.status === 1 ? '启用' : '禁用' }}
    </el-tag>
  </template>

  <template #price="{ row }">
    <span style="color: #e74c3c">¥{{ row.price.toFixed(2) }}</span>
  </template>
</ol-crud>
```

</details>

插槽作用域：`{ row, $index, column }`

**备选：render 函数**

<details>
<summary>示例代码</summary>

```js
columns: [
  { prop: 'price', label: '价格', render: (row) => `¥${row.price.toFixed(2)}` }
]
```

</details>

### 多级表头

<details>
<summary>示例代码</summary>

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

</details>

### 完全自定义列（#column 插槽）

当你需要完全控制 `<el-table-column>` 渲染时：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product">
  <template #column="{ columns }">
    <el-table-column v-for="col in columns" :key="col.prop" v-bind="col" />
  </template>
</ol-crud>
```

</details>

### 多选

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :selection.sync="selectedRows" ref="crud" />
```

```js
data() { return { selectedRows: [] } },
methods: {
  batchDelete() {
    if (!this.selectedRows.length) return this.$message.warning('请先勾选数据')
    // ...批量操作
    this.$refs.crud.refresh()
  }
}
```

</details>

也可以通过 `@selection-change="fn"` 事件获取勾选变化。

---

## 工具栏

### 布局

```
┌─ crud-toolbar ─────────────────────────────────────────────┐
│ ┌─ toolbar-left ──────────┐ ┌─ toolbar-right ────────────┐ │
│ │ #toolbarBefore           │ │ #toolbarActions             │ │
│ │ [新增] [导出] ← btnlist   │ │ [列过滤] [刷新] [打印] ...  │ │
│ │ #toolbarAfter            │ │ #toolbarActionsAfter        │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 内置按钮

所有 `show` 类 prop 默认值为 `true`，可通过 prop 单独关闭，也可通过 `$olBaseConfig` 全局设置。

<details>
<summary>示例代码</summary>

```html
<ol-crud
  url="/api/app/product"
  showRefreshBtn          <!-- 刷新 -->
  showPrintBtn            <!-- 打印当前表格 -->
  showColumnFilterBtn    <!-- 列过滤/配置 -->
  showSmartPrintBtn      <!-- 智能打印（模板打印） -->
  showEntityChangeBtn    <!-- 实体变更记录 -->
/>
```

</details>

### 自定义按钮（btnlist）

从菜单管理系统自动获取按钮并绑定同名 methods：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" :btnlist="this.hasBtn(this)" />
```

```js
// hasBtn 全局注册在 Vue.prototype 上
// 自动匹配当前路由的菜单，读取 localStorage.wms.SET_MENUS
methods: {
  create() { /* 新增弹窗 */ },
  export() { /* 导出逻辑 */ },
}
```

</details>

**`BtnlistItem` 属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `String` | — | 按钮文字 |
| `method` | `Function` | — | 点击回调，自动绑定同名 methods |
| `types` | `String` | `'primary'` | el-button type |
| `icon` | `String` | — | 图标 class，如 `'el-icon-plus'` |
| `disabled` | `Boolean` | `false` | 是否禁用 |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface BtnlistItem {
  title: string
  method: () => void
  types?: string
  icon?: string
  disabled?: boolean
}
```

</details>

### 插槽

4 个插槽覆盖工具栏所有位置：

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product">
  <!-- 左侧，btnlist 前面 -->
  <template #toolbarBefore="{ selection, pagination }">
    <span>已选 {{ selection.length }} / 共 {{ pagination.total }} 条</span>
  </template>

  <!-- 左侧，btnlist 后面 -->
  <template #toolbarAfter="{ loading }">
    <el-button :disabled="loading" @click="exportAll">全部导出</el-button>
  </template>

  <!-- 右侧，内置按钮前面 -->
  <template #toolbarActions="{ searchModel }">
    <el-tag>搜索条件：{{ searchModel.name }}</el-tag>
  </template>

  <!-- 右侧，内置按钮后面 -->
  <template #toolbarActionsAfter="{ tableData }">
    <span>当前页 {{ tableData.length }} 条</span>
  </template>
</ol-crud>
```

</details>

4 个插槽作用域相同，均为 `ToolbarSlotScope`：

| 属性 | 类型 | 说明 |
|------|------|------|
| `loading` | `Boolean` | 列表加载中 |
| `selection` | `Array` | 当前勾选的行数据 |
| `tableData` | `Array` | 当前页表格数据 |
| `pagination` | `Object` | 分页 `{ page, limit, total }` |
| `searchModel` | `Object` | 当前搜索条件 |
| `columns` | `Array` | 可见列配置 `TableColumn[]` |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface ToolbarSlotScope {
  loading: boolean
  selection: any[]
  tableData: any[]
  pagination: { page: number; limit: number; total: number }
  searchModel: Record<string, any>
  columns: TableColumn[]
}
```

</details>

---

## 列配置

### simple 模式（下拉勾选）

工具栏出现列图标，点击弹出 checkbox 下拉列表，勾选即时生效。这是默认模式，勾选状态与当前表格列显示状态同步。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" showColumnFilterBtn columnConfigMode="simple" />
```

</details>

### persisted 模式（弹窗拖拽 + API 持久化）

点击列图标打开弹窗，支持拖拽排序、设置显示/别名、按角色分配可见列。保存调用 API 持久化，下次打开自动恢复。

<details>
<summary>示例代码</summary>

```html
<ol-crud
  url="/api/app/product"
  showColumnFilterBtn
  columnConfigMode="persisted"
  menuId="123"
  pageKey="/product/list"
/>
```

</details>

| 相关 Prop | 说明 |
|-----------|------|
| `columnConfigMode` | `'simple'`（默认）或 `'persisted'` |
| `pageKey` | 页面标识，默认取 `$route.path` |
| `menuId` | 菜单 ID，用于 API 数据隔离 |

---

## 打印 & 实体变更记录

### 打印

**普通打印：** 打印当前表格数据，表头列与页面完全一致。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" showPrintBtn />
```

</details>

**智能打印：** 模板打印，可传入自定义数据。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" showSmartPrintBtn :smartPrintMenuId="123" :printData="myData" />
```

</details>

打印时触发 `@print` 事件，参数 `PrintListObj`：

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `String` | 打印标题，默认取路由 meta.title |
| `tableHeader` | `Array` | 表头列 `TableColumn[]` |
| `tableData` | `Array` | 表格数据 |

<details>
<summary>TypeScript 接口定义</summary>

```ts
interface PrintListObj {
  title: string
  tableHeader: TableColumn[]
  tableData: any[]
}
```

</details>

### 实体变更记录

勾选行后出现图标，点击弹窗展示该条数据的字段级别变更历史（新旧值对比），列定义从 Swagger 自动生成。

<details>
<summary>示例代码</summary>

```html
<ol-crud url="/api/app/product" showEntityChangeBtn />
```

</details>

接口地址：`/api/app/audit-logging/entity-change-pages`

---

## 全局配置

项目入口注册时传入，所有 `ol-crud` 实例全局生效：

<details>
<summary>示例代码</summary>

```js
import OlBaseComponents from 'ol-base-components'

Vue.use(OlBaseComponents, {
  method: 'post',             // 全局请求方式 'get' | 'post'
  columnConfigMode: 'simple', // 列配置模式 'simple' | 'persisted'
  pageParams: { page: 'Page', limit: 'MaxResultCount' }, // 分页参数名
  pageSizes: [20, 40, 60, 100, 200],        // 每页条数选项
  pagination: { limit: 50 },                // 分页初始值（limit/show）
  showPrintBtn: false,       // 全局关闭普通打印
  showSmartPrintBtn: true,   // 全局开启智能打印
})
```

</details>

### 支持全局配置的 Prop

所有以下 prop 遵循 **组件直接传参 > $olBaseConfig 全局 > 硬编码默认值** 的三级优先级：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `method` | `String` | `'get'` | 请求方式 `'get'` / `'post'` |
| `pageParams` | `Object` | `{ page:'Page', limit:'MaxResultCount' }` | 分页参数名映射 |
| `pageSizes` | `Array` | `[20,30,40,60,100,200]` | 每页条数选项 |
| `pagination` | `Object` | `{ page:1, limit:30, total:0, show:true }` | 分页初始值，主要 `limit` 和 `show` 有用 |
| `columnConfigMode` | `String` | `'simple'` | 列配置模式 `'simple'` / `'persisted'` |
| `showSearch` | `Boolean` | `true` | 显示搜索栏 |
| `showSelection` | `Boolean` | `true` | 显示多选列 |
| `showIndex` | `Boolean` | `true` | 显示序号列 |
| `showRefreshBtn` | `Boolean` | `true` | 显示刷新按钮 |
| `showPrintBtn` | `Boolean` | `true` | 显示打印按钮 |
| `showCustomSearch` | `Boolean` | `false` | 显示搜索配置按钮 |
| `showColumnFilterBtn` | `Boolean` | `true` | 显示列过滤入口 |
| `showSmartPrintBtn` | `Boolean` | `false` | 显示智能打印按钮 |
| `showEntityChangeBtn` | `Boolean` | `false` | 显示实体变更记录按钮 |

---

## API 参考

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `String` | `''` | 接口路径，用于 Swagger 自动映射 + 自动请求 |
| `method` | `String` | `'get'` | 请求方式 `'get'` / `'post'` |
| `fetchData` | `Function` | — | 自定义请求函数，见[快速开始](#fetchdata-自定义请求) |
| `responseHandler` | `Function` | — | 响应解析 `(response) => ({ rows, total })` |
| `pageParams` | `Object` | `{ page:'Page', limit:'MaxResultCount' }` | 分页参数名映射 |
| `columns` | `Array` | `[]` | 表格列配置 `TableColumn[]`，见[表格](#表格) |
| `searchFields` | `Array` | `[]` | 搜索字段配置 `SearchField[]`，见[搜索栏](#搜索栏) |
| `searchModel` | `Object` | `{}` | 搜索表单初始值，支持 `.sync` |
| `searchRules` | `Object` | `{}` | 搜索表单校验规则（el-form rules 格式） |
| `columnsPerRow` | `Number` | `4` | 每行搜索字段数，超出折叠 |
| `showSearch` | `Boolean` | `true` | 显示搜索栏，支持全局配置 |
| `showCustomSearch` | `Boolean` | `false` | 显示搜索配置按钮，支持全局配置 |
| `customs` | `Array` | `[]` | 可用搜索字段列表（fetchData 模式手动传入） |
| `menuId` | `String`/`Number` | `''` | 菜单 ID，用于搜索/列配置持久化 |
| `showSelection` | `Boolean` | `true` | 显示多选列，支持 `.sync` 和全局配置 |
| `showIndex` | `Boolean` | `true` | 显示序号列，支持全局配置 |
| `operates` | `Array` | `[]` | 操作列按钮 `Operate[]`，见[操作列](#操作列) |
| `operatesAttrs` | `Object` | `{}` | 操作列属性，透传 `el-table-column` |
| `tableAttrs` | `Object` | `{}` | 透传 `el-table`，如 `{ 'row-key': 'id' }` |
| `pagination` | `Object` | `{ page:1, limit:30, total:0, show:true }` | 分页，支持 `.sync` |
| `pageSizes` | `Array` | `[20,30,40,60,100,200]` | 每页条数选项 |
| `showRefreshBtn` | `Boolean` | `true` | 显示刷新，支持全局配置 |
| `showPrintBtn` | `Boolean` | `true` | 显示打印，支持全局配置 |
| `showSmartPrintBtn` | `Boolean` | `false` | 显示智能打印，支持全局配置 |
| `smartPrintMenuId` | `String` | `''` | 智能打印菜单 ID |
| `printData` | `Array` | `[]` | 智能打印数据，为空时用当前表格数据 |
| `showColumnFilterBtn` | `Boolean` | `true` | 显示列配置入口，支持全局配置 |
| `columnConfigMode` | `String` | `'simple'` | 列配置模式 `'simple'` / `'persisted'` |
| `pageKey` | `String` | `''` | persisted 模式页面标识，默认 `$route.path` |
| `showEntityChangeBtn` | `Boolean` | `false` | 显示实体变更记录，支持全局配置 |
| `btnlist` | `Array` | `[]` | 工具栏菜单按钮 `BtnlistItem[]` |
| `onSearchSwagger` | `Function` | — | Swagger 搜索字段映射后钩子 |
| `onSearchMerged` | `Function` | — | 搜索字段合并后钩子 |
| `onTableSwagger` | `Function` | — | Swagger 表格列映射后钩子 |
| `onTableMerged` | `Function` | — | 表格列合并后钩子 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `search` | `(model, { filterConditions })` | 点击查询按钮 |
| `reset` | `(model)` | 点击重置按钮 |
| `selection-change` | `(rows)` | 勾选行变化 |
| `update:selection` | `(rows)` | 勾选行变化，`.sync` |
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

### Slots

| 插槽名 | 作用域 | 说明 |
|--------|--------|------|
| `toolbarBefore` | `ToolbarSlotScope` | 工具栏左侧，btnlist 之前 |
| `toolbarAfter` | `ToolbarSlotScope` | 工具栏左侧，btnlist 之后 |
| `toolbarActions` | `ToolbarSlotScope` | 工具栏右侧，内置按钮之前 |
| `toolbarActionsAfter` | `ToolbarSlotScope` | 工具栏右侧，内置按钮之后 |
| `[propName]` | `{ row, $index, column }` | 表格列插槽，插槽名 = 列的 prop |
| `column` | `{ columns }` | 完全自定义表格列 |
| `empty` | — | 表格空状态，默认"暂无数据" |

### Methods

通过 `this.$refs.xxx.方法名()` 调用：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `refresh()` | — | `Promise` | 刷新表格，保持当前搜索+分页 |
| `search()` | — | `Promise` | 触发查询 |
| `reset()` | — | `Promise` | 重置搜索条件并查询 |
| `getSelection()` | — | `Array` | 获取当前勾选行 |
| `clearSelection()` | — | — | 清空勾选 |
| `getSearchParams()` | — | `Object` | 获取当前搜索参数 |
| `setSearchParams(params)` | `Object` | — | 设置搜索参数（部分更新） |

### 数据类型

所有复杂结构的属性汇总（各功能章节已单独列出，此处为统一速查）。

#### SearchField · 搜索字段

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prop` ★ | `String` | — | 字段名 |
| `label` ★ | `String` | — | 显示标签 |
| `type` ★ | `String` | — | 控件类型，见[搜索字段类型一览](#搜索字段类型一览) |
| `visible` | `Boolean` | `true` | 是否显示 |
| `defaultValue` | `any` | — | 默认值 |
| `placeholder` | `String` | — | 占位文本 |
| `compare` | `String` | — | 比较符（配置模式用） |
| `props` | `Object` | — | 透传给 Element UI 控件 |
| `options` | `Array` | — | `[{ key, label }]`，select 选项 |
| `remoteMethod` | `Function` | — | remoteSelect 远程搜索 |
| `onLoadMore` | `Function` | — | remoteSelect 滚动加载 |
| `loading` | `Boolean` | — | remoteSelect 加载态 |

#### TableColumn · 表格列

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prop` ★ | `String` | — | 字段名 |
| `label` ★ | `String` | — | 列标题 |
| `show` | `Boolean` | `true` | 是否显示 |
| `fixed` | `Boolean` / `String` | `false` | 固定列：`'left'` `'right'` |
| `sortable` | `Boolean` | `false` | 可排序 |
| `width` | `String` / `Number` | — | 固定列宽 |
| `minWidth` | `String` | `150px` | 最小列宽 |
| `align` | `String` | `'center'` | `'left'` `'center'` `'right'` |
| `render` | `Function` | — | `(row, column, $index) => any` |
| `renderSlot` | `Boolean` | — | 走插槽渲染 |
| `children` | `Array` | — | 多级表头 `TableColumn[]` |
| `alias` | `String` | — | 别名 |
| `roleIds` | `Number[]` | — | 角色权限 |

#### Operate · 操作列按钮

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` ★ | `String` | — | 按钮文字 |
| `click` ★ | `Function` | — | `(row, $index) => void` |
| `type` | `String` | `'text'` | el-button type |
| `size` | `String` | `'small'` | el-button size |
| `icon` | `String` | — | 图标 class |
| `hidden` | `Boolean` / `Function` | `false` | `(row, $index) => boolean` |
| `disabled` | `Boolean` / `Function` | `false` | `(row, $index) => boolean` |

#### Pagination · 分页

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | `Number` | `1` | 当前页码 |
| `limit` | `Number` | `30` | 每页条数 |
| `total` | `Number` | `0` | 总条数 |
| `show` | `Boolean` | `true` | 是否显示分页组件 |

#### FetchData · 自定义请求

`fetchData` 入参：

| 属性 | 类型 | 说明 |
|------|------|------|
| `searchParams` | `Object` | 当前搜索条件（已清理空值） |
| `filterConditions` | `Array` | 搜索配置模式下的过滤条件 |
| `page` | `Number` | 当前页码 |
| `limit` | `Number` | 每页条数 |
| `pagination` | `Object` | 完整分页 `{ page, limit, total }` |

返回：`{ rows: any[], total: number }` 或 Promise。

#### 插槽作用域

| 属性 | 类型 | 适用插槽 | 说明 |
|------|------|----------|------|
| `loading` | `Boolean` | 工具栏 | 列表加载中 |
| `selection` | `Array` | 工具栏 | 当前勾选行 |
| `tableData` | `Array` | 工具栏 | 当前页数据 |
| `pagination` | `Object` | 工具栏 | 分页对象 |
| `searchModel` | `Object` | 工具栏 | 搜索条件 |
| `columns` | `Array` | 工具栏 | 可见列配置 |
| `row` | `any` | 列插槽 | 当前行数据 |
| `$index` | `Number` | 列插槽 | 行索引 |
| `column` | `Object` | 列插槽 | 当前列配置 |

<details>
<summary>TypeScript 接口定义（汇总）</summary>

```ts
// ===== 搜索 =====
interface SearchField {
  prop: string
  label: string
  type: 'input' | 'number' | 'select' | 'remoteSelect' | 'date'
      | 'datetime' | 'daterange' | 'datetimerange' | 'numberRange'
  visible?: boolean
  defaultValue?: any
  placeholder?: string
  compare?: string
  props?: Record<string, any>
  options?: Array<{ key: string | number; label: string }>
  remoteMethod?: (query: string) => void
  onLoadMore?: () => void
  loading?: boolean
}

// ===== 表格 =====
interface TableColumn {
  prop: string
  label: string
  show?: boolean
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  width?: string | number
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: any, column: TableColumn, $index: number) => any
  renderSlot?: boolean
  children?: TableColumn[]
  alias?: string
  roleIds?: number[]
}

interface Operate {
  label: string
  click: (row: any, $index: number) => void
  type?: string
  size?: string
  icon?: string
  hidden?: boolean | ((row: any, $index: number) => boolean)
  disabled?: boolean | ((row: any, $index: number) => boolean)
}

// ===== 工具栏 =====
interface BtnlistItem {
  title: string
  method: () => void
  types?: string
  icon?: string
  disabled?: boolean
}

// ===== 分页 =====
interface Pagination {
  page: number
  limit: number
  total: number
  show: boolean
}

// ===== fetchData =====
interface FetchDataParams {
  searchParams: Record<string, any>
  filterConditions?: Array<{ field: string; compare: string; value: any }>
  page: number
  limit: number
  pagination: Pagination
}
interface FetchDataResult { rows: any[]; total: number }

// ===== 打印 =====
interface PrintListObj { title: string; tableHeader: TableColumn[]; tableData: any[] }

// ===== 插槽 =====
interface ToolbarSlotScope {
  loading: boolean
  selection: any[]
  tableData: any[]
  pagination: Pagination
  searchModel: Record<string, any>
  columns: TableColumn[]
}
interface RowSlotScope { row: any; $index: number; column: TableColumn }

// ===== 钩子 =====
type SwaggerHook = (params: { columns: any[] }) => { columns: any[] }
```

</details>

---

## 完整示例

一个真实页面的完整代码，涵盖搜索、fetchData、btnlist、operates、插槽、多选：

<details>
<summary>示例代码</summary>

```html
<template>
  <ol-crud
    url="/api/app/product"
    method="post"
    :fetchData="fetchList"
    :btnlist="this.hasBtn(this)"
    :selection.sync="selectedRows"
    :searchModel.sync="query"
    :searchFields="searchFields"
    :columns="columns"
    :operates="operates"
    ref="crud"
  >
    <!-- 工具栏：显示勾选统计 -->
    <template #toolbarBefore="{ selection, pagination }">
      <span style="color:#666">已选 {{ selection.length }} / 共 {{ pagination.total }} 条</span>
    </template>

    <!-- 表格列：自定义状态渲染 -->
    <template #status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>
  </ol-crud>
</template>

<script>
export default {
  data() {
    return {
      selectedRows: [],
      query: { status: 1 },
      searchFields: [
        { prop: 'name', label: '名称', type: 'input' },
        { prop: 'status', label: '状态', type: 'select', options: [
          { key: 1, label: '启用' }, { key: 0, label: '禁用' }
        ]},
        { prop: 'createTime', label: '创建时间', type: 'daterange' },
      ],
      columns: [
        { prop: 'name', label: '名称', minWidth: '120' },
        { prop: 'code', label: '编码', width: '120' },
        { prop: 'price', label: '价格', width: '100', sortable: true },
        { prop: 'status', label: '状态', width: '80' },
        { prop: 'createTime', label: '创建时间', minWidth: '160' },
      ],
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
    async fetchList({ searchParams, filterConditions, page, limit }) {
      const res = await this.$http.post('/api/app/product/pages', {
        FilterConditions: filterConditions,
        Page: page, MaxResultCount: limit, ...searchParams,
      })
      return { rows: res.result.items, total: res.result.totalCount }
    },
    // btnlist 绑定的方法
    create() { /* 新增弹窗 */ },
    export() { /* 导出 */ },
    // 操作列
    handleEdit(row) { /* 编辑弹窗 */ },
    async handleDelete(row) {
      await this.$confirm('确认删除？')
      await this.$http.delete(`/api/app/product/${row.id}`)
      this.$message.success('删除成功')
      this.$refs.crud.refresh()
    },
  },
}
</script>
```

</details>
