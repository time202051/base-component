# crud 功能兼容性差距分析

> 本文档记录 `crud` 组件与 `formSearch` + `customSearch` + `table` 的功能兼容差距，供后续逐步修复参考。

## 背景

`crud` 是 `formSearch` + `table` 合并后的重新设计。`customSearch` 是 `formSearch` 在特定项目中的用法。现在 `crud` 需要兼容所有用法。

### 符号说明

- ✅ 已支持
- ⚠️ 部分支持（有差异）
- ❌ 未支持

---

## 一、搜索字段输入类型

| 类型 | formSearch | crud | 说明 |
|------|-----------|------|------|
| `text` / `input` | ✅ | ✅ | 文本输入 |
| `number` | ✅ | ✅ | 数字输入 |
| `select` | ✅ | ✅ | 下拉选择 |
| `selectTEMP` | ✅ | ❌ | 与 select 相同但 clearable 始终为 true。建议在 `oldFieldToNew` 中映射为 `select` |
| `selectRemoteMethod` | ✅ | ⚠️ | formSearch 叫 `selectRemoteMethod`，crud 叫 `remoteSelect`。需在 `oldFieldToNew` 中做类型名映射 |
| `picker` | ✅ | ✅ | 日期选择（crud 中也叫 `date`/`datetime`/`daterange`/`datetimerange`） |
| `numberRange` | ✅ | ✅ | 数字范围 |
| `treeSelect` | ✅ | ❌ | 树形下拉选择器。crud 模板中完全没有此分支 |

---

## 二、搜索字段属性

| 属性 | formSearch | crud | 说明 |
|------|-----------|------|------|
| `value` / `prop` | ✅ | ✅ | 字段 key（格式转换中处理） |
| `label` | ✅ | ✅ | 标签 |
| `inputType` / `type` | ✅ | ✅ | 输入类型（格式转换中处理） |
| `props` | ✅ | ✅ | 传递给输入组件的额外属性 |
| `children` / `options` | ✅ | ✅ | 下拉选项（格式转换中处理） |
| `compare` | ✅ | ✅ | 默认比较方式 |
| `clearable` | ✅ | ✅ | 是否可清除 |
| `show` / `visible` | ✅ | ✅ | 控制显示/隐藏 |
| `isFrontAppend` | ✅ | ❌ | 前端追加字段标记，不参与配置弹窗编辑 |
| `isDirect` | ✅ | ❌ | 直接请求参数字段，不包装到 filterConditions 中 |
| `placeholder` | ✅ | ✅ | 占位符 |
| `maxlength` | ✅ | ❌ | 输入框最大长度，crud 模板未透传 |
| `labelProps` | ✅ | ❌ | 自定义 el-form-item 的 label 样式/属性 |
| `listeners` | ✅ | ❌ | 透传给 numberRange 的事件监听器 |
| `originalFields` | ✅ | ✅ | 日期范围字段的原始 begin/end 字段引用 |
| `dateType` | ✅ | ✅ | picker 的具体日期类型 |
| `optionSource` | ✅ | ⚠️ | 下拉选项自动加载配置。crud 支持 `dict` 和 `api` 源类型 |
| `remoteMethod` | ✅ | ⚠️ | 远程搜索函数。formSearch 中字段直接有 `remoteMethod`，crud 通过 `field.remoteMethod(query, field)` 调用 |
| `loading` | ✅ | ⚠️ | 远程搜索加载状态。crud 中通过 `field.loading` 访问 |
| `loadmores` | ✅ | ⚠️ | 滚动加载更多配置。formSearch 用 `v-el-select-all` 指令，crud 用 `v-el-select-loadmore` 指令 |
| `change` 回调 | ✅ | ⚠️ | formSearch 调用 `item.change(formSearch[value])`，crud 调用 `field.onChange(value, fullModel)`，签名不同 |

---

## 三、Props 差距

### 高优先级

| Prop | 来源 | 说明 |
|------|------|------|
| `frontSearchData` | customSearch | 前端静态搜索字段数组（标记 `isFrontAppend`），不参与配置弹窗编辑 |
| `frontDefaultValue` | customSearch | 前端默认搜索值（优先级最高），不被后端接口默认值覆盖 |
| `formProps` | formSearch | 透传给 `el-form` 的额外属性（如 `label-width`），通过 `formSearchData.options.formProps` 传入 |

### 中优先级

| Prop | 来源 | 说明 |
|------|------|------|
| `tableEvents` | table | 透传给 `el-table` 的任意事件对象 |

---

## 四、配置选项差距

| 选项 | formSearch | crud | 说明 |
|------|-----------|------|------|
| `formSearchData.reset` | ✅ | ❌ | formSearch 支持自定义 reset 行为。为 `true` 时复位时**清空**所有字段；为 `false` 时复位时**恢复为 `formSearchData.value`**。crud 总是恢复为初始值 |
| `formSearchData.tableSearchSlice` | ✅ | ❌ | formSearch 可通过此属性覆盖展开/折叠阈值。crud 只有 `columnsPerRow` prop |
| `formSearchData.options` | ✅ | ❌ | formSearch 可通过 `options.formProps` 向 `el-form` 传递额外属性 |

---

## 五、事件差距

| 事件 | formSearch/customSearch | crud | 说明 |
|------|------------------------|------|------|
| `handleSave`（非配置模式） | ✅ | ✅ | formSearch emit 展开后的 `tempFormSearch`，crud emit 原始 `internalSearchModel`，**格式不一致** |
| `btnHandleExpend` | ✅ | ❌ | 展开/折叠切换时发出 |
| `getTreeSelectValue` | ✅ | ❌ | 树形选择器的值变更（crud 不支持 treeSelect） |
| `loadmore` | ✅ | ❌ | 滚动加载更多时发出 |
| `onSave` | ✅ | ⚠️ | 配置保存。formSearch emit 到父组件 customSearch，customSearch 再持久化。crud 直接持久化后 emit `config-save` |

---

## 六、行为差距

### 6.1 自动查询（存在默认值时）

**customSearch 行为：** 在 `init()` 中如果存在非空的默认搜索条件（`defaultFilterJson` 或 `frontDefaultValue` 或 `formSearchData.value`），会在 `$nextTick` 中自动调用 `this.$refs.customSearchRef.handleSearch("formSearch")`。

**crud 行为：** `loadSearchConfig()` 回显默认值后**不自动触发查询**，需要用户手动点击"查询"按钮。

### 6.2 `isDirect` 字段处理

**formSearch 行为：** `isDirect: true` 的字段**不**包装到 `filterConditions` 中，而是在 `handleSearch` 时收集到 `directParams` 对象中，作为普通查询参数传递。

**crud 行为：** `buildSearchParams()` 和 `emitSearch()` 完全不检查 `isDirect`，所有字段都按 filterConditions 处理。

### 6.3 非配置模式 `handleSave` 数据格式

**formSearch 行为：** 发出时会将 `createdTime` 数组展开为 `BeginTime`/`EndTime`，`originalFields` 范围字段拆分。

**crud 行为：** 直接发出 `{ ...this.internalSearchModel }`，不做任何日期范围拆分。

### 6.4 Number 输入处理

**formSearch 行为：** number 类型支持 `max` 值夹持（通过 `handleOnInput`）。阻止 `e`、`E`、`-`、`+`、`.` 按键。阻止非数字粘贴。

**crud 行为：** 阻止 `e`、`E`、`-`、`+`、`.` 按键和粘贴（相同）。但缺少 `max` 值夹持和 `maxlength` 透传。

### 6.5 formSearch 的 change 回调

**formSearch 调用签名：** `item.change(formSearch[item.value])` — 只传当前字段的值。

**crud 调用签名：** `field.onChange(value, fullModel)` — 传当前值和完整搜索模型。

迁移时需要注意回调函数签名不兼容。

---

## 七、模板/样式差距

| 特性 | formSearch | crud | 说明 |
|------|-----------|------|------|
| transition-group 动画 | ✅ | ❌ | 展开/折叠时 formSearch 有 CSS 过渡动画，crud 没有 |
| labelProps 绑定 | ✅ | ❌ | formSearch 在 el-form-item 上绑定 `v-bind="item.labelProps"` |
| listeners 绑定 | ✅ | ❌ | formSearch 在 numberRange 上绑定 `v-on="item.listeners"` |
| maxlength 透传 | ✅ | ❌ | crud 的 input 模板未绑定 `:maxlength` |
| form-props 绑定 | ✅ | ❌ | formSearch 在 el-form 上绑定 `v-bind="formSearchData.options.formProps"` |

---

## 八、table 特有功能未集成

| 特性 | table | crud | 说明 |
|------|-------|------|------|
| `downloadBtn` | ✅ | ❌ | 独立 table 有下载按钮 |
| `emptyImg` | ✅ | ❌ | 独立 table 支持空状态图片 |
| `tableEvents` | ✅ | ❌ | 独立 table 透传所有事件到 el-table |
| `outTable` | ✅ | ❌ | 独立 table 有外部表格引用 |
| `radioChange` | ✅ | ❌ | 独立 table 支持单选模式 |
| `selectAll` / `selectTab` | ✅ | ❌ | 独立 table 的额外事件 |

---

## 实现建议顺序

### 第一批：核心兼容（阻碍迁移的功能）

1. **`frontSearchData` + `frontDefaultValue`** — 添加 prop，在 `initSearchDefaults()` 和 `loadSearchConfig()` 中合并
2. **`isDirect` 处理** — 在 `buildSearchParams()` 中识别 `isDirect` 字段，分离 `directParams` 和 `filterConditions`
3. **类型名映射** — `oldFieldToNew` 中将 `selectRemoteMethod` → `remoteSelect`，`selectTEMP` → `select`

### 第二批：输入类型补齐

4. **`treeSelect` 支持** — crud 模板中添加 treeSelect 分支
5. **`maxlength` 透传** — input/number 模板添加 `:maxlength="field.maxlength"`
6. **`labelProps` 绑定** — el-form-item 上添加 `v-bind="field.labelProps"`
7. **`listeners` 绑定** — numberRange 模板添加 `v-on="field.listeners"`

### 第三批：交互增强

8. **自动触发查询** — `loadSearchConfig()` 回显后若存在非空默认值，自动调用查询
9. **`formProps` 支持** — 添加 prop，透传到 el-form
10. **`change` 回调兼容** — `onFieldChange` 中同时调用 `field.change` 和 `field.onChange`
11. **非配置模式 `handleSave` 格式对齐** — 拆分日期范围字段后再 emit

### 第四批：锦上添花

12. **`btnHandleExpend` 事件**
13. **`loadmore` 事件**
14. **CSS 过渡动画**
15. **Number 输入 `max` 夹持**
16. **`tableEvents` 透传**
17. **table 的 `downloadBtn`、`emptyImg` 等功能**

---

## 相关文件

- `src/package/crud/src/index.vue` — 主要修改目标
- `src/package/formSearch/src/index.vue` — formSearch 参考实现
- `src/package/customSearch/src/index.vue` — customSearch 参考实现（frontSearchData/frontDefaultValue）
- `src/package/table/src/index.vue` — 独立 table 参考实现
