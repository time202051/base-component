# base-component

二次封装的通用组件库，包含表格（Table）和表单（Form）等组件。

## 安装

您可以通过 npm 安装这个组件库：

```bash
npm install ol-base-components
```

## 效果图

![Local demo](./src/assets/effectPicture.png "Local demo")

## 使用说明

在您的 Vue 项目中，您需要在入口文件（通常是 `main.js` 或 `app.js`）中导入并使用该组件库：

```javascript
// main.js
import Vue from "vue";
import App from "./App.vue";
import OlBaseComponents from "ol-base-components"; // 导入组件库

// 使用组件库
Vue.use(OlBaseComponents);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
```

## 组件示例

### 搜索框组件

您可以在您的组件中使用搜索框组件组件，例如：

```vue
<template>
  <div>
    <ol-search
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      @handleReset="handleReset"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      formSearchData: {
        reset: true,
        expendShow: false,
        value: {
          WarehouseCode: null,
          WarehouseName: null,
        },
        tableSearch: [
          {
            label: "仓库编码",
            value: "WarehouseCode",
            inputType: "text",
          },
          {
            label: "仓库名称",
            value: "WarehouseName",
            inputType: "text",
          },
        ],
      },
    };
  },
  mounted() {
    this.getTable();
  },
  method: {
    getTable() {
      //   this.get({
      //     url: Basic.getWarehoseList,
      //     isLoading: true,
      //     data: Object.assign(this.formSearchData.value, {
      //       Page: this.paginations.page,
      //       MaxResultCount: this.paginations.limit,
      //     }),
      //   }).then((res) => {
      //     this.tableData.rows = res.result.items;
      //     this.paginations.total = res.result.totalCount;
      //     this.tableData.emptyImg = true;
      //   });
    },
    handleSearch(from) {
      var self = this;
      self.formSearchData.value = { ...from };
      self.paginations.page = 1;
      this.getTable(); // 获取表格数据
    },
    handleReset() {},
  },
};
</script>
```

### 表格组件

您可以在您的组件中使用表格组件组件，例如：

```vue
<template>
  <div>
    <ol-table
      :paginations="paginations"
      :btnlist="this.hasBtn(this)"
      :empty-img="tableData.emptyImg"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    >
      <template slot="classes" slot-scope="scope">
        <div style="color: #1682e6; cursor: pointer" @click="config(scope)">
          设置
        </div>
      </template>
    </ol-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      multipleSelection: [],
      tableData: {
        loading: false,
        emptyImg: true,
        options: {
          selection: true, //多选框
          index: null, //序号
          headTool: true, //开启头部工具栏
          refreshBtn: true, //开启表格头部刷新按钮
          downloadBtn: true, //开启表格头部下载按钮
        }, //序号和复选框
        rows: [], //表数据
        columns: [
          {
            label: "",
            minWidth: "",
            type: "selection",
            show: true,
          },
          {
            prop: "warehouseCode",
            label: "仓库编码",
            minWidth: "",
            sortable: false,
            show: true,
          },
          {
            prop: "warehouseName",
            label: "仓库名称",
            minWidth: "",
            sortable: false,
            show: true,
          },
          {
            prop: "enabledDesc",
            label: "状态",
            minWidth: "",
            sortable: false,
            show: true,
          },
          {
            prop: "createdUser",
            label: "创建人",
            minWidth: "",
            sortable: false,
            show: true,
          },
          {
            prop: "createTime",
            label: "创建时间",
            minWidth: "",
            show: true,
          },
          {
            prop: "classes",
            label: "班次",
            minWidth: "",
            show: true,
            renderSlot: true,
          },
          {
            prop: "remark",
            label: "备注",
            minWidth: "",
            show: true,
          },
        ], //表头
        operates: [], //表格里面的操作按钮
        tableHeightDiff: 300,
      },
      paginations: {
        page: 1, //当前位于那页面
        total: 10, //总数
        limit: 30, //一页显示多少条
        pagetionShow: true,
      },
    };
  },
  methods: {
    SelectionChange(row) {
      this.multipleSelection = row;
    },
    handleSizeChange(val) {
      this.paginations.page = 1;
      this.paginations.limit = val;
      this.getTable();
    },
    handleindexChange(val) {
      this.paginations.page = val;
      this.getTable();
    },
  },
};
</script>
```

### 表单弹框组件

您可以在您的组件中使用表单弹框组件组件，例如：

```vue
<template>
  <div>
       <ol-dialogTemplate :form="form" />
    </ol-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        dialogFormVisible: false,
        title: "",
        model: [
            {
                label: "字典编码",
                type: "input",
                prop: "code",
            },
            {
                label: "字典名称",
                type: "input",
                prop: "displayName",
            },
            // {
            //     label: "启用",
            //     type: "switch",
            //     prop: "enabled",
            // },
            {
                label: "备注",
                type: "textarea",
                prop: "remark",
            },
        ],
        rules: {
            displayName: [{ required: true, message: "必填", trigger: "blur" }],
            code: [{ required: true, message: "必填", trigger: "blur" }],
        },
        value: {
            code: "",
            displayName: "",
            // enabled: true,
            remark: "",
        },
        requestData: {
            flage: "add",
            url: PublicAggregate.dictionaries,
            fn: this.getTable,
        },
      ,
    };
  },
};
</script>
```

## 贡献

欢迎任何形式的贡献！如果您有建议或发现问题，请提交 issue 或 pull request。

## License

MIT License
