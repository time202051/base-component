function generateKeyName(url, method) {
  // 移除前缀 "/api/app"
  const cleanedUrl = url.replace(/\/api\/app/, "");
  const arr = cleanedUrl.split("/");

  // 处理 {xxx} 转换为 ByXxx
  const processedArr = arr.map(
    (item) =>
      item
        .replace(
          /{(.*?)}/,
          (_, param) => `By${param.charAt(0).toUpperCase() + param.slice(1)}`
        ) // 处理 {xxx}
        .replace(/[-_]/g, "") // 去除 - 和 _
  );

  // 删除第一个空项
  if (processedArr[0] === "") {
    processedArr.shift();
  }

  // 去重和拼接相邻相同的项
  const resultArr = [];
  for (let i = 0; i < processedArr.length; i++) {
    if (i === 0 || processedArr[i] !== processedArr[i - 1]) {
      // 将每项首字母大写
      const capitalizedItem =
        processedArr[i].charAt(0).toUpperCase() + processedArr[i].slice(1);
      resultArr.push(capitalizedItem);
    }
  }
  const key = resultArr.join("");
  return `${method.toLowerCase()}${key}`;
}

const vue2Template = (moduleName, options = {}) => {
  // 只有当提供了 URL 时才调用 generateKeyName
  let pageUrl = "";
  let exportUrl = "";
  if (options.url) {
    pageUrl = generateKeyName(options.url, "get");
  }
  if (options.export) {
    exportUrl = generateKeyName(options.export, "post");
  }

  return `<!--
  Filename: ${moduleName}.vue
  name: ${moduleName}
  Created Date: ${new Date().toLocaleString()}
  Author: 
-->
<template>
  <div>
    <ol-search
      :url="swaggerUrl.${pageUrl}"
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      @handleReset="handleReset"
    />
    <ol-table
      :url="swaggerUrl.${pageUrl}"
      :paginations="paginations"
      :btnlist="this.hasBtn(this)"
      :empty-img="tableData.emptyImg"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    />
  </div>
</template>
<script>
import { ${pageUrl} } from "@/api/modules";
import { ${options.swaggerModule} } from '@/api/swagger'
export default {
  name: "${moduleName}",
  data() {
    return {
      swaggerUrl: ${options.swaggerModule},
      multipleSelection: [],
      // 查询表单
      formSearchData: {
        reset: true, // 重置
        expendShow: true, // 展开
        value: {},
        tableSearch: []
      },
      // 表格数据
      tableData: {
        loading: false,
        emptyImg: true,
        options: {
          selection: true, // 多选框
          index: null, // 序号
          headTool: true, // 开启头部工具栏
          refreshBtn: true, // 开启表格头部刷新按钮
          downloadBtn: true // 开启表格头部下载按钮
        }, // 序号和复选框
        rows: [], // 表数据
        columns: [],
        operatesAttrs: {},
        operates: [], // 表格里面的操作按钮
        tableHeightDiff: 330
      },
      paginations: {
        page: 1, // 当前位于那页面
        total: 10, // 总数
        limit: 30, // 一页显示多少条
        pagetionShow: true
      },
    }
  },
  created() {
    this.init();
  },
  methods: {
    async init() {
      const params = {
        ...this.formSearchData.value,
        Page: this.paginations.page,
        MaxResultCount: this.paginations.limit
      };
      const { result: { items = [], totalCount = 0 } = {} } = await ${pageUrl}(params, {
        isLoading: true
      });
      this.tableData.rows = items;
      this.paginations.total = totalCount;
      this.tableData.emptyImg = true;
    },
    handleSearch(from) {
      this.formSearchData.value = { ...from };
      this.paginations.page = 1;
      this.init();
    },
    handleReset() {
      for (let key in this.formSearchData.value) {
        this.formSearchData.value[key] = null;
      }
      this.paginations.page = 1;
    },
    SelectionChange(row) {
      this.multipleSelection = row;
    },
    handleSizeChange(val) {
      this.paginations.page = 1;
      this.paginations.limit = val;
      this.init();
    },
    handleindexChange(val) {
      this.paginations.page = val;
      this.init();
    },
    export() {
      let timer = this.formSearchData.value.createdTime
        ;
      this.formSearchData.value.BeginTime = timer ? timer[0] : "";
      this.formSearchData.value.EndTime = timer ? timer[1] : "";
      this.post({
        url: ${options.swaggerModule}.${exportUrl},
        isLoading: true,
        responseType: "blob",
        data: Object.assign(this.formSearchData.value, {
          Page: this.paginations.page,
          MaxResultCount: this.paginations.limit
        })
      }).then(res => {
        this.fnexsl(res);
      });
    },
  }
}
</script>
<style lang="scss" scoped>
</style>
`;
};

module.exports = vue2Template;
