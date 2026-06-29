# 接口约定规范

## 下拉框数据接口 ol-customeSearch组件的动态下拉框数据接口

- 路径必须以 `-select` 结尾
- 请求方式必须是 GET
- 返回数组，元素包含 `key`（值）和 `value`（显示文本）
- summary 字段会作为选项名称，自动去除"获取"和"下拉框数据"

示例：
- 接口：`GET /api/warehouse-select`
- 响应：`[{ "key": "WH001", "value": "北京仓库" }]`