# 搜索框与表格组件 API 接口梳理

> 本文档梳理 `formSearch` + `customSearch` + `table` + `crud` 组件中涉及的所有后端接口及其用途。

## 目录

1. [搜索配置持久化（3个接口）](#1-搜索配置持久化)
2. [列配置持久化（2个接口）](#2-列配置持久化)
3. [角角色列表（1个接口）](#3-角色列表)
4. [打印模板管理（4个接口）](#4-打印模板管理)
5. [实体变更审计（1个接口）](#5-实体变更审计)
6. [业务数据查询（动态接口）](#6-业务数据查询)
7. [下拉选项动态加载（动态接口）](#7-下拉选项动态加载)
8. [打印数据获取（动态接口）](#8-打印数据获取)
9. [Swagger 元数据获取（IndexedDB + CLI）](#9-swagger-元数据)
10. [接口与组件关系矩阵](#10-接口与组件关系矩阵)

---

## 1. 搜索配置持久化

> 用途：将用户在搜索栏中**配置的字段列表**和**填写的默认查询条件**保存到后端，
> 下次打开页面时自动恢复，避免重复配置。

### 1.1 加载搜索配置

```
GET /api/app/menu-search-setting/by-menu?sysMenuId={菜单ID}
```

| 项目 | 说明 |
|------|------|
| **调用方** | `customSearch/src/index.vue` (第95行)、`crud/src/index.vue` (第1897行) |
| **调用时机** | 页面加载时（`mounted` 生命周期） |
| **请求参数** | `sysMenuId` — 菜单ID，优先取 `menuId` prop，其次取路由 query，最后从 localStorage 菜单树匹配当前路由 |
| **返回数据** | `{ settingJson: string, defaultFilterJson: string }` |
| **`settingJson`** | 搜索字段配置 JSON 数组，定义哪些字段显示在搜索栏、以什么类型展示、默认比较方式等 |
| **`defaultFilterJson`** | 用户上次保存的默认搜索条件 JSON 数组，定义每个字段的默认值和比较符 |
| **处理逻辑** | ① 解析 `settingJson` → 合并/覆盖本地 `searchFields`；② 解析 `defaultFilterJson` → 回显到搜索表单；③ `crud` 中需等待 watcher 执行完毕再回显 |

**settingJson 数据格式（旧格式 → 组件内部转新格式）：**

```json
[
  {
    "value": "Name",
    "label": "姓名",
    "inputType": "text",
    "compare": "contains",
    "show": false,
    "props": {},
    "dateType": null,
    "children": []
  },
  {
    "value": "Status",
    "label": "状态",
    "inputType": "select",
    "compare": "eq",
    "children": [{ "key": 1, "value": "启用" }, { "key": 0, "value": "禁用" }]
  },
  {
    "value": "CreatedTime",
    "label": "创建时间",
    "inputType": "picker",
    "dateType": "datetimerange",
    "compare": "range"
  }
]
```

**defaultFilterJson 数据格式：**

```json
[
  {
    "key": "Name",
    "values": ["张三"],
    "compare": "contains"
  },
  {
    "key": "Status",
    "values": [1],
    "compare": "eq"
  },
  {
    "key": "CreatedTime",
    "values": ["2024-01-01 00:00:00", "2024-12-31 23:59:59"],
    "compare": "range"
  }
]
```

> **注意**：`settingJson` 和 `defaultFilterJson` 是**独立保存/独立加载**的。
> 可能只有字段配置没有默认值，也可能只有默认值没有字段配置。

### 1.2 保存搜索字段配置

```
POST /api/app/menu-search-setting
```

| 项目 | 说明 |
|------|------|
| **调用方** | `customSearch/src/index.vue` (第164行)、`crud/src/index.vue` (第2244行) |
| **调用时机** | 用户在「配置弹窗」中编辑搜索字段后点击「确定」 |
| **请求参数** | `{ sysMenuId, settingJson: JSON.stringify([...]) }` |
| **用途** | 持久化用户在配置弹窗中设置的搜索字段列表（增删字段、修改输入类型、修改比较方式等） |

### 1.3 保存默认搜索条件

```
POST /api/app/menu-search-setting/set-default-filter
```

| 项目 | 说明 |
|------|------|
| **调用方** | `formSearch/src/index.vue` (第747行)、`crud/src/index.vue` (第2208行) |
| **调用时机** | 用户在搜索栏填写好查询条件后，点击「更多」→「保存搜索条件」 |
| **请求参数** | `{ sysMenuId, defaultFilterJson: JSON.stringify([...]) }` |
| **用途** | 持久化用户填写的当前搜索条件，下次打开页面时自动填入作为默认值 |
| **备注** | 仅在自定义搜索模式（`showCustomSearch=true`）下有效；非配置模式下由父组件通过 `handleSave` 事件自行处理 |

### 接口关系图

```
┌─────────────────────────────────────────────────────────┐
│                    页面加载时                             │
│  GET /by-menu ─→ 返回 settingJson + defaultFilterJson    │
│                     │                    │               │
│              解析为字段配置        解析为默认搜索值        │
│              覆盖 searchFields    回显到搜索表单           │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────────┐
│   配置弹窗点「确定」    │    │  更多菜单点「保存搜索条件」  │
│  POST /menu-search-   │    │  POST /set-default-filter │
│       setting         │    │                          │
│  保存字段列表配置       │    │  保存当前搜索条件为默认值   │
└──────────────────────┘    └──────────────────────────┘
```

---

## 2. 列配置持久化

> 用途：将用户对表格列的**顺序**、**可见性**、**固定状态**、**列别名**保存到后端，
> 实现个性化表格视图。

### 2.1 加载列配置

```
GET /api/app/user-field-config/config?pageKey={页面路径}&sysMenuId={菜单ID}
```

| 项目 | 说明 |
|------|------|
| **调用方** | `columnConfig/src/index.vue` (第192行)、`crud/src/index.vue` (第2052行) |
| **调用时机** | 页面加载时，当 `columnConfigMode === 'persisted'` |
| **请求参数** | `pageKey` — 页面路径（默认取 `$route.path`），`sysMenuId` — 菜单ID |
| **用途** | 加载用户个性化列配置 |

**返回数据示例：**

```json
[
  {
    "fieldName": "Name",
    "displayName": "姓名",
    "alias": "客户姓名",
    "isVisible": true,
    "isFixed": false,
    "sortOrder": 1,
    "roleIds": []
  }
]
```

### 2.2 保存列配置

```
POST /api/app/user-field-config/save-config
```

| 项目 | 说明 |
|------|------|
| **调用方** | `columnConfig/src/index.vue` (第257行) |
| **调用时机** | 用户在「列配置弹窗」中调整列顺序/可见性后点击「保存」 |
| **请求参数** | `{ pageKey, sysMenuId, fields: [...] }` |
| **fields 字段** | `fieldName`, `displayName`, `alias`, `isVisible`, `isFixed`, `roleIds`, `enumName` |
| **用途** | 持久化用户的列配置偏好 |

---

## 3. 角色列表

> 用途：在列配置中支持**按角色设置列可见性**。

```
GET /api/app/identity-role/list
```

| 项目 | 说明 |
|------|------|
| **调用方** | `columnConfig/src/index.vue` (第170行) |
| **调用时机** | 列配置弹窗打开时 |
| **用途** | 获取系统角色列表，用于配置哪些角色可以看到某列 |
| **备注** | 仅在 persisted 模式的列配置弹窗中使用 |

---

## 4. 打印模板管理

> 用途：管理**智能打印模板**的 CRUD 操作。普通打印（直接打印表格）不涉及接口。

### 4.1 查询打印模板列表

```
GET /api/app/print-templete/page-list
```

| 项目 | 说明 |
|------|------|
| **调用方** | `printModel/src/index.vue` (第194行)、`table/src/components/PrintTemplateSelector.vue` (第106行) |
| **请求参数** | `MenuId` (或 `menuId`)、`Page`、`MaxResultCount` |
| **用途** | 根据菜单ID加载该页面可用的打印模板列表 |

### 4.2 新增打印模板

```
POST /api/app/print-templete/print-templete
```

| 项目 | 说明 |
|------|------|
| **调用方** | `printModel/src/index.vue` (第268行) |
| **请求参数** | `{ menuId, templeteName, templeteJson, sourceUrl }` |
| **用途** | 创建新的打印模板 |

### 4.3 编辑打印模板

```
PUT /api/app/print-templete/print-templete
```

| 项目 | 说明 |
|------|------|
| **调用方** | `printModel/src/index.vue` (第257行) |
| **请求参数** | `{ id, templeteName, templeteJson, sourceUrl }` |
| **用途** | 更新已有打印模板 |

### 4.4 删除打印模板

```
DELETE /api/app/print-template/print-template?Id={模板ID}
```

| 项目 | 说明 |
|------|------|
| **调用方** | `printModel/src/index.vue` (第241行) |
| **用途** | 删除指定ID的打印模板 |

### 打印与组件的关系

```
                         ┌──────────────┐
                         │   ol-table   │
                         │  (独立表格)   │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
    ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐
    │  普通打印     │   │  智能打印      │   │  打印模板管理       │
    │  printTable  │   │  PrintTemplate│   │  ol-print-model   │
    │  (纯前端)     │   │  Selector     │   │  (独立页面)        │
    │  不调接口     │   │  调 page-list │   │  调 CRUD 4 个接口  │
    └─────────────┘   └──────────────┘   └──────────────────┘
```

---

## 5. 实体变更审计

> 用途：查看选中数据行的**字段级修改历史记录**（谁、什么时间、把什么字段从什么值改成什么值）。

```
POST /api/app/audit-logging/entity-change-pages
```

| 项目 | 说明 |
|------|------|
| **调用方** | `crud/src/components/EntityChangeRecord.vue` |
| **调用时机** | 用户选中行后点击工具栏「实体变更记录」按钮 |
| **请求参数** | `{ FilterConditions: [{ key: "EntityId", values: [...选中行ID], compare: "in" }], Page: 1, MaxResultCount: 20 }` |
| **用途** | 分页查询选中数据的变更审计日志 |
| **备注** | 仅 `crud` 组件支持（通过 `showEntityChangeBtn` prop 开启），独立 `table` 组件不支持 |

---

## 6. 业务数据查询

> 用途：表格展示的**核心业务数据**查询。URL 由使用者通过 prop 传入，不是固定接口。

### 6.1 自动模式（crud 内置 `url` prop）

| 项目 | 说明 |
|------|------|
| **调用方** | `crud/src/index.vue` (第1680-1700行) |
| **方法** | GET 或 POST（由 `method` prop 或 `$olBaseConfig.method` 决定，默认 GET） |
| **URL** | `url` prop（如 `/api/app/product`） |
| **请求参数** | 搜索条件（普通模式：扁平参数；配置模式：`FilterConditions` 数组）+ 分页参数（`Page`/`MaxResultCount` 等） |
| **用途** | crud 内部自动发起请求，获取表格数据，管理 loading 状态和分页 |

### 6.2 手动模式（crud 内置 `fetchData` prop）

| 项目 | 说明 |
|------|------|
| **调用方** | `crud/src/index.vue` → 调用 `fetchData({ searchParams, filterConditions, page, limit, pagination })` |
| **URL** | 由父组件的 `fetchData` 函数内部控制 |
| **用途** | 父组件自行处理 API 调用，crud 只管展示和 UI 状态 |

### 6.3 独立表格模式（ol-table）

| 项目 | 说明 |
|------|------|
| **调用方** | 父组件通过 `tableData.rows` prop 直接传入数据 |
| **用途** | 独立 `ol-table` 不发起任何 API 请求，纯展示组件 |

---

## 7. 下拉选项动态加载

> 用途：搜索栏中的 `select` 类型字段，其下拉选项可以从**后端字典**或**API接口**动态加载。

### 7.1 字典方式（localStorage 缓存）

配置 `optionSource: { sourceType: "dict", dictKey: "StatusEnum" }`：

| 项目 | 说明 |
|------|------|
| **数据来源** | `localStorage.wms.SET_enumsSelect["StatusEnum"].enums` |
| **不调接口** | 数据在应用初始化时已加载到 localStorage，组件直接从 localStorage 读取 |
| **调用方** | `formSearch/src/index.vue`、`crud/src/index.vue`、`SearchConfigDialog.vue` |

### 7.2 API 方式

配置 `optionSource: { sourceType: "api", apiUrl: "/api/app/dict/status", method: "get", valueField: "key", labelField: "value" }`：

| 项目 | 说明 |
|------|------|
| **调用方** | `formSearch/src/index.vue` (第828行)、`crud/src/index.vue` (第1990行)、`SearchConfigDialog.vue` (第714行) |
| **方法** | GET 或 POST（由 `optionSource.method` 决定） |
| **URL** | 由用户在配置弹窗中填写，或代码中写死 `optionSource.apiUrl` |
| **用途** | 从任意 API 端点获取下拉选项，用 `valueField`/`labelField` 映射为 `{ key, value }` 格式 |

---

## 8. 打印数据获取

> 用途：智能打印模板在打印前，可能需要从后端**获取额外的打印数据**。

| 项目 | 说明 |
|------|------|
| **调用方** | `table/src/components/PrintTemplateSelector.vue` (第209行) |
| **方法** | GET |
| **URL** | 由打印模板中的 `sourceUrl` 字段动态决定（模板保存时配置） |
| **请求参数** | `{ ids: [...选中行ID数组] }` |
| **用途** | 根据选中行ID获取打印所需的详细数据 |

---

## 9. Swagger 元数据

> 用途：获取后端 Swagger/OpenAPI 规范，自动生成搜索字段和表格列。

### 9.1 运行时加载

| 项目 | 说明 |
|------|------|
| **调用方** | `src/package/index.js` → `swaggerInstall(swaggerUrl)` |
| **调用时机** | 应用启动时，由宿主项目在入口文件中调用 |
| **URL** | 由宿主项目传入（如 `http://localhost:44388/swagger/v1/swagger.json`） |
| **存储方式** | 存入 IndexedDB `SwaggerDB` / `swaggerDataStore` |
| **读取方** | `formSearch`、`table`、`crud`、`form` 等组件通过 `getData()` 读取 |
| **用途** | 根据接口参数自动创建搜索字段（枚举→select、日期→picker），根据响应属性自动创建表格列（枚举→xxxDesc） |

### 9.2 CLI 代码生成

| 端点 | 用途 |
|------|------|
| `{baseURL}/swagger/v1/swagger.json` | `bin/fetch-swagger.js` 下载原始 JSON |
| 同上 | `api/api.js` 用 `SwaggerClient` 生成 API 函数模块 |
| 同上 | `api/run.js` 生成 URL 常量对象 |

> 这些是**开发时**使用的，不影响运行时。

---

## 10. 接口与组件关系矩阵

| 接口 | formSearch | customSearch | crud | table | columnConfig | printModel |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /menu-search-setting/by-menu` | — | ✅ | ✅ | — | — | — |
| `POST /menu-search-setting` | — | ✅ | ✅ | — | — | — |
| `POST /menu-search-setting/set-default-filter` | ✅ | — | ✅ | — | — | — |
| `GET /user-field-config/config` | — | — | ✅ | — | ✅ | — |
| `POST /user-field-config/save-config` | — | — | — | — | ✅ | — |
| `GET /identity-role/list` | — | — | — | — | ✅ | — |
| `GET /print-templete/page-list` | — | — | — | ✅ | — | ✅ |
| `POST /print-templete/print-templete` | — | — | — | — | — | ✅ |
| `PUT /print-templete/print-templete` | — | — | — | — | — | ✅ |
| `DELETE /print-template/print-template` | — | — | — | — | — | ✅ |
| `POST /audit-logging/entity-change-pages` | — | — | ✅ | — | — | — |
| `url` prop（业务数据） | — | — | ✅ | — | — | — |
| `optionSource.apiUrl`（下拉选项） | ✅ | — | ✅ | — | — | — |
| `sourceUrl`（打印数据） | — | — | — | ✅ | — | — |

### 图例

- ✅ 直接调用
- — 不涉及

### 关键发现

1. **`formSearch` 只调 2 个接口**：保存默认搜索条件 + 动态加载下拉选项。它不负责加载和保存搜索字段配置，这些由 `customSearch` 包装器处理。
2. **`customSearch` 是对 `formSearch` 的包装**，增加了 2 个接口：加载字段配置 + 保存字段配置。
3. **`crud` 目标是替代 `formSearch` + `customSearch` + `table` 的合体**，所以它调了所有搜索相关接口 + 列配置接口 + 业务数据接口，是调用接口最多的组件。
4. **搜索配置和默认值是分离的**：`settingJson`（字段配置）和 `defaultFilterJson`（默认查询值）分别保存/加载，互不影响。
5. **列配置接口仅 persisted 模式使用**：simple 模式（下拉勾选）不调接口。
