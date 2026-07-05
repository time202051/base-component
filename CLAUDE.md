# CLAUDE.md

本文件为 Claude Code 在 `ol-base-components` 项目中工作时提供指导。

## 项目概述

Vue 2 企业级组件库，基于 Element UI + Vite 构建。将搜索表单、数据表格、分页、工具栏封装为可复用组件，支持 Swagger 自动映射。输出 UMD + ESM 双格式供外部项目引用。

## 常用命令

```bash
npm run build       # Vite 生产构建 → dist/index.umd.js + dist/index.mjs + dist/style.css
npm run build:cli   # vue-cli 备选构建
```

包发布前 `prepublishOnly` 自动执行 `npm run build`。

## 目录结构

```
src/
├── package/              # 组件源码
│   ├── index.js          # 入口：注册所有组件，暴露 swaggerInstall/getData
│   ├── crud/             # ★ 核心组件 ol-crud，约 1900 行
│   ├── table/            # ol-table 基础表格 + 打印
│   ├── formSearch/       # ol-search 搜索表单（旧版）
│   ├── customSearch/     # 自定义搜索配置（含 API 持久化）
│   ├── dialog/           # 弹窗组件
│   ├── form/             # ol-form 动态表单
│   ├── numberRange/      # ol-number-range 数字范围输入
│   ├── print/            # 打印功能（含 hiprint）
│   ├── printModel/       # 打印模板
│   └── columnConfig/     # 列配置弹窗（拖拽排序）
├── api/                  # 命令行工具（init/run/api）
├── bin/                  # CLI 脚本（add/fetch-swagger）
└── utils/                # getEnum 等工具函数
```

## 组件注册

用户安装后在入口：

```js
import OlBaseComponents from 'ol-base-components'
Vue.use(OlBaseComponents, { /* 全局配置 */ })
```

插件做的事：
1. 10 个组件以 `ol-xxx` 标签名全局注册
2. `Vue.prototype.$olBaseConfig = options || {}` — 全局配置
3. 导出 `swaggerInstall(url)` / `swaggerUnload()` / `getData()` — Swagger 初始化

## 核心组件：ol-crud

最重要的组件，位于 `src/package/crud/src/index.vue`。文档在 `src/package/crud/README.md`。

### 两种数据模式

| 模式 | 用法 | 说明 |
|------|------|------|
| 自动 | `<ol-crud url="/api/app/product" />` | crud 内部调 API，管理 UI |
| 手动 | `<ol-crud :fetchData="myFn" />` | 父组件调 API，crud 管 UI |

有 `url` 时自动从 Swagger（IndexedDB）获取搜索字段和表格列。

### 全局配置机制

**`$cfg(key)` 方法** — 三级优先级：

```
父组件显式传参 > $olBaseConfig 全局 > 组件 prop 默认值
```

通过 `this.$options.propsData` 检测父组件是否显式传了该 prop。

**支持全局配置的 prop（14 个）：**

| 类别 | Prop | 默认值 |
|------|------|--------|
| 请求 | `method` | `'get'` |
| 请求 | `pageParams` | `{ page:'Page', limit:'MaxResultCount' }` |
| 请求 | `pageSizes` | `[20,30,40,60,100,200]` |
| 请求 | `pagination` | `{ limit: 20, ... }` |
| 列 | `columnConfigMode` | `'simple'` |
| 开关 | `showSearch` / `showSelection` / `showIndex` | `true` |
| 开关 | `showRefreshBtn` / `showPrintBtn` | `true` |
| 开关 | `showCustomSearch` | `false` |
| 开关 | `showColumnFilterBtn` | `true` |
| 开关 | `showSmartPrintBtn` | `false` |
| 开关 | `showEntityChangeBtn` | `false` |

### Swagger 集成

Swagger 数据通过 `swaggerInstall(url)` 拉取 → 存入 IndexedDB `SwaggerDB` → `getData()` 读取。

`initFromSwagger()` 流程：
1. 参数 → `mapParameterToSearchField()` → 搜索字段（只保留有中文 description 的）
2. `autoDetectRangeTimeFields()` → 自动合成 `xxxBegin + xxxEnd → xxxTime` daterange
3. Response properties → `mapPropertyToColumn()` → 表格列（枚举→`xxxDesc`, bool→`xxxText`）

四个钩子可在映射链路中插入处理：`onSearchSwagger` → `onSearchMerged` → `onTableSwagger` → `onTableMerged`

### filterableColumns / columns 的关系

- `filterableColumns`：递归展平 `columns`，只取有 prop 的叶子列
- simple 模式列过滤下拉框基于 `filterableColumns`
- persisted 模式列配置弹窗基于 `columnsForConfig`

## 兼容性注意事项

1. **禁止使用 `??` 运算符** — 消费项目的 webpack/babel 可能不支持，用 `!= null ? x : y` 替代
2. **保留 `exports` 字段** — package.json 中 `exports` 确保 webpack 消费方能正确解析
3. **Vue 2 only** — 依赖 `Vue.prototype`、`$set`、`$scopedSlots` 等 Vue 2 专属 API
4. **el-dropdown 渲染** — `el-dropdown-menu` 可能被渲染到 body 外，scoped CSS 无法穿透，需用非 scoped `<style>` 块
5. **列去重** — `initFromSwagger` 中 push 新列后必须同步更新去重 Set，否则同 prop 列会重复
