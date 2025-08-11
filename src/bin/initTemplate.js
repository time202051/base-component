function generateKeyName(url, method) {
  // 移除前缀 "/api/app"
  const cleanedUrl = url.replace(/\/api\/app/, "");
  const arr = cleanedUrl.split("/");

  // 处理 {xxx} 转换为 ByXxx
  const processedArr = arr.map(
    item =>
      item
        .replace(/{(.*?)}/, (_, param) => `By${param.charAt(0).toUpperCase() + param.slice(1)}`) // 处理 {xxx}
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
      const capitalizedItem = processedArr[i].charAt(0).toUpperCase() + processedArr[i].slice(1);
      resultArr.push(capitalizedItem);
    }
  }
  const key = resultArr.join("");
  return `${method.toLowerCase()}${key}`;
}
const vue2Template = (moduleName, config = {}) => {
  console.log(888, config);

  // 生成各种接口的key名称
  let pageUrlKey = "";
  let exportUrlKey = "";
  let addUrlKey = "";
  let editUrlKey = "";
  let deleteUrlKey = "";
  let detailUrlKey = "";

  if (config.pageUrl) pageUrlKey = generateKeyName(config.pageUrl, "get");
  if (config.exportUrl) exportUrlKey = generateKeyName(config.exportUrl, "post");
  if (config.addUrl) addUrlKey = generateKeyName(config.addUrl, "post");
  if (config.editUrl) editUrlKey = generateKeyName(config.editUrl, "put");
  if (config.deleteUrl) deleteUrlKey = generateKeyName(config.deleteUrl, "delete");
  if (config.detailUrl) detailUrlKey = generateKeyName(config.detailUrl, "get");

  // 生成导入语句
  const generateImports = () => {
    const imports = [];
    if (config.pageUrl) imports.push(`${pageUrlKey}`);
    if (config.addUrl) imports.push(`${addUrlKey}`);
    if (config.editUrl) imports.push(`${editUrlKey}`);
    if (config.deleteUrl) imports.push(`${deleteUrlKey}`);
    if (config.detailUrl) imports.push(`${detailUrlKey}`);
    return imports.join(", ");
  };

  // 生成方法
  const generateMethods = () => {
    const methods = [];
    if (config.hasAdd) {
      methods.push(`
    addBtnHandler() {
      this.form.type = 1;
      this.dialogVisible = true;
    }`);
    }

    // if (config.hasEdit) {
    //   methods.push(`
    // editBtnHandler() {
    //   this.form.type = 2;
    //   this.dialogVisible = true;
    // }`);
    // }

    if (config.hasEdit) {
      methods.push(`
    ${config.hasDetail ? `async ` : ``}editBtnHandler() {
      const data = this.multipleSelection;
      if(data.length !== 1) return this.$message.info("请选择一条数据");
      const row = data[0];
      this.form.type = 2;
      ${
        config.hasDetail
          ? `const { result = {} } = await ${detailUrlKey}(row.${config.idField});
      this.form.value = result || {};`
          : `this.form.value = { ...row };`
      }
      this.dialogVisible = true;
    }`);
    }

    // onCancel
    if (config.hasAdd || config.hasEdit || config.hasDetail) {
      methods.push(`
    onCancel() {
      this.dialogVisible = false;
    }`);
    }

    // onSubmit
    if (config.hasAdd || config.hasEdit) {
      // editUrlKey
      // addUrlKey
      methods.push(`
    async onSubmit({ form, data }) {
      if(form.type === 1){
        //新建
        const res = await ${addUrlKey}(data);
        if(res.code !== 200) return;
        this.$message("新建成功");
      }else if(form.type === 2){
        //编辑
        const res = await ${editUrlKey}(data['${config.idField}'], data);
        if(res.code !== 200) return;
        this.$message("编辑成功");
        this.init();
      };
      this.init();
      this.onCancel()
    }`);
    }

    if (config.hasDelete) {
      methods.push(`
    deleteBtnHandler() {
      const data = this.multipleSelection;
      if(data.length !== 1) return this.$message.info("请选择一条数据");
      const row = data[0];
      this.$confirm('确认删除当前数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ${deleteUrlKey}(row.${config.idField}).then(() => {
          this.$message.success('删除成功');
          this.init();
        }).catch(() => {
          this.$message.error('删除失败');
        });
      }).catch(() => {});
    }`);
    }

    return methods.join(",");
  };

  return `<!--
  Filename: ${moduleName}.vue
  name: ${moduleName}
  Created Date: ${new Date().toLocaleString()}
  Author: 
-->
<template>
  <div>
    <ol-search
      :url="swaggerUrl.${pageUrlKey}"
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      @handleReset="handleReset"
    />
    <ol-table
      :url="swaggerUrl.${pageUrlKey}"
      :paginations="paginations"
      :btnlist="this.hasBtn(this)"
      :empty-img="tableData.emptyImg"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    />
    ${
      config.hasAdd || config.hasEdit || config.hasDetail
        ? `<el-dialog :title="this.form.title" :visible.sync="dialogVisible" width="80%">
      <ol-form
        v-if="dialogVisible"
        :url="swaggerUrl.${pageUrlKey}"
        :form="form"
        @onCancel="onCancel"
        @onSubmit="onSubmit"
      />
    </el-dialog>`
        : ""
    }
  </div>
</template>
<script>
import { ${generateImports()} } from "@/api/modules";
import { ${config.swaggerModule} } from '@/api/swagger';
export default {
  name: "${moduleName}",
  data() {
   return {
     swaggerUrl: ${config.swaggerModule},
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
     ${
       config.hasAdd || config.hasEdit || config.hasDetail
         ? `form: {
       type: 0, // 0详情，1新增, 2编辑
       title: "",
       // 默认值
       defaultValue: {},
       value: {},
       model: [],
       rules: {},
       attrs: {},
     },
     dialogVisible: false`
         : ""
     }
   }
  },
  methods: {
    async init() {
      const params = {
        ...this.formSearchData.value,
        Page: this.paginations.page,
        MaxResultCount: this.paginations.limit
      };
      const { result: { items = [], totalCount = 0 } = {} } = await ${pageUrlKey}(params, {
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
    ${
      config.hasExport
        ? `export() {
      const timer = this.formSearchData.value.createdTime
        ;
      this.formSearchData.value.BeginTime = timer ? timer[0] : "";
      this.formSearchData.value.EndTime = timer ? timer[1] : "";
      this.post({
        url: ${config.swaggerModule}.${exportUrlKey},
        isLoading: true,
        responseType: "blob",
        data: Object.assign(this.formSearchData.value, {
          Page: this.paginations.page,
          MaxResultCount: this.paginations.limit
        })
      }).then(res => {
        this.fnexsl(res);
      });
    },`
        : ""
    }${generateMethods()}
  }
}
`;
};

module.exports = vue2Template;
