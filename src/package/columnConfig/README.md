# ol-column-config 列动态配置

表格列配置弹窗组件。支持拖拽排序、显示/隐藏、固定列、别名、角色权限。已内置 API 持久化，开箱即用。

---

## 快速开始

### 独立使用（不依赖 ol-curd）

```html
<template>
  <div>
    <el-button @click="visible = true">列配置</el-button>
    <ol-column-config
      :visible.sync="visible"
      :columns="columns"
      page-key="/product"
      menu-id="123"
      @save="onSave"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      columns: [
        { prop: "name", label: "名称", show: true },
        { prop: "price", label: "价格", show: true, fixed: "left" },
      ],
    };
  },
  methods: {
    onSave(result) {
      // result 是排好序的列数组，已包含 show/fixed/alias/roleIds
      this.columns = result;
    },
  },
};
</script>
```

### 在 ol-curd 中使用

```html
<!-- simple 模式：本地 checkbox 切换列显示/隐藏 -->
<ol-curd url="/api/app/product/product" show-column-filter />

<!-- persisted 模式：弹窗拖拽 + API 持久化 -->
<ol-curd
  url="/api/app/product/product"
  show-column-filter
  column-config-mode="persisted"
  page-key="/JYstockIn"
/>
```

---

## 两种模式

### simple 模式（默认）

```
点击 ☰ → 下拉多选框 → 勾选/取消列 → 表格即时刷新
```

- 列数据来自 Swagger 自动生成
- 纯本地操作，不调接口
- 刷新后恢复默认

### persisted 模式

```
页面加载 → GET /api/app/user-field-config/config → 表格显示已保存的列配置
点击 ☰ → 弹窗（拖拽排序/勾选/改别名/设角色）→ 确定 → POST 保存 → 表格即时刷新
```

- 列数据来自 API 接口
- 支持拖拽排序、显示/隐藏、固定列、别名、角色权限
- 配置持久化，刷新不丢失
- **不依赖 Swagger**，API 返回什么列就显示什么列

---

## Props（ol-column-config）

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | Boolean | `false` | 弹窗可见性（支持 `.sync`） |
| `columns` | Array | `[]` | 列配置数组，每项 `{ prop, label, show, fixed, alias, roleIds }` |
| `pageKey` | String | `""` | 页面标识，API 存取用（默认取 `$route.path`） |
| `menuId` | String/Number | `""` | 菜单ID，API 存取用（默认从 `localStorage.wms.SET_MENUS` 自动匹配当前路由） |
| `showRoleConfig` | Boolean | `undefined` | 是否显示角色权限列。`undefined`=自动（默认显示），`true`=强制显示，`false`=强制隐藏 |
| `loadApi` | String | `/api/app/user-field-config/config` | 加载接口地址 |
| `saveApi` | String | `/api/app/user-field-config/save-config` | 保存接口地址 |

## Props（ol-curd 透传）

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showColumnFilter` | Boolean | `false` | 开启列过滤入口 |
| `columnConfigMode` | String | `'simple'` | `'simple'` 或 `'persisted'` |
| `pageKey` | String | `""` | 透传给 ol-column-config |

---

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `save` | `result: Array` | 保存时触发，`result` 为排好序的列数组 |
| `open` | `columns: Array` | 弹窗打开时触发 |

---

## API 接口

### 加载配置

```
GET /api/app/user-field-config/config?pageKey=/JYstockIn&sysMenuId=xxx
```

响应格式：
```json
{
  "code": 200,
  "result": {
    "id": "7962af78-...",
    "pageKey": "/JYstockIn",
    "sysMenuId": "117d64db-...",
    "fields": [
      {
        "fieldName": "productName",
        "order": 0,
        "isVisible": true,
        "isFixed": false,
        "displayName": "物料名称",
        "alias": "物料名称",
        "enumName": null,
        "roleIds": []
      }
    ]
  }
}
```

### 保存配置

```
POST /api/app/user-field-config/save-config
Body: {
  "pageKey": "/JYstockIn",
  "sysMenuId": "117d64db-...",
  "fields": [
    {
      "fieldName": "productName",
      "displayName": "物料名称",
      "alias": "物料名称",
      "isVisible": true,
      "isFixed": false,
      "roleIds": [],
      "enumName": null
    }
  ]
}
```

---

## 弹窗功能说明

| 列 | 功能 | 说明 |
|----|------|------|
| ⋮⋮ 拖拽 | 拖拽排序 | 固定列（`isFixed=true`）不可拖拽，手柄变灰 |
| 序号 | 当前顺序 | 数字，拖拽后自动更新 |
| 字段 | 列标识 | 第一行显示 `label`（中文名），第二行显示 `prop`（字段名） |
| 显示 | 勾选框 | 控制该列在表格中是否可见 |
| 固定 | 勾选框 | 勾选后列固定在左侧，且不可拖拽 |
| 别名 | 输入框 | 覆盖列标题的显示文本，留空使用原标签 |
| 可用角色 | 多选下拉 | 设置哪些角色可以看到该列。admin 用户可见（自动检测 `$store.getters.userName`） |

---

## 完整示例

```html
<template>
  <ol-curd
    ref="crud"
    url="/api/app/product/product"
    show-column-filter
    column-config-mode="persisted"
    page-key="/JYstockIn"
    show-selection
    show-index
    show-refresh-btn
    show-print-btn
    :operates="operates"
  >
    <template #toolbar>
      <el-button type="primary" @click="$refs.crud.openAdd()">新增</el-button>
    </template>
  </ol-curd>
</template>

<script>
export default {
  data() {
    return {
      operates: [
        { label: "编辑", click: (row) => this.$refs.crud.openEdit(row) },
        { label: "删除", type: "danger", click: (row) => this.handleDelete(row.id) },
      ],
    };
  },
};
</script>
```
