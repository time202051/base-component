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
  // 生成各种接口的key名称
  let pageUrlKey = "",
    exportUrlKey = "",
    addUrlKey = "",
    editUrlKey = "",
    deleteUrlKey = "",
    detailUrlKey = "",
    baseUrlKey = ""; //接口选择优先级：新增 > 编辑 > 详,

  if (config.pageUrl) pageUrlKey = generateKeyName(config.pageUrl, "get");
  if (config.exportUrl) exportUrlKey = generateKeyName(config.exportUrl, "post");
  if (config.detailUrl) {
    detailUrlKey = generateKeyName(config.detailUrl, "get");
    baseUrlKey = `${detailUrlKey}CompleteUrl`; //补充后缀
  }
  if (config.editUrl) {
    editUrlKey = generateKeyName(config.editUrl, "put");
    baseUrlKey = `${editUrlKey}CompleteUrl`; //补充后缀
  }
  if (config.addUrl) baseUrlKey = addUrlKey = generateKeyName(config.addUrl, "post");
  if (config.deleteUrl) deleteUrlKey = generateKeyName(config.deleteUrl, "delete");

  // 生成导入语句
  const generateImports = () => {
    const imports = [];
    if (config.pageUrl) imports.push(`${pageUrlKey}`);
    if (config.addUrl) imports.push(`${addUrlKey}`);
    if (config.editUrl) imports.push(`${editUrlKey}`);
    if (config.detailUrl) imports.push(`${detailUrlKey}`);
    if (config.deleteUrl) imports.push(`${deleteUrlKey}`);
    return imports.join(", ");
  };

  // 生成方法
  const generateMethods = () => {
    const methods = [];

    // onCancel
    if (config.hasAdd || config.hasEdit || config.hasDetail) {
      methods.push(`
    onCancel() {
      this.formConfig.dialogVisible = false;
    }`);
    }

    // onSubmit
    if (config.hasAdd || config.hasEdit) {
      methods.push(`
    async onSubmit({ form, data }) {
      if(form.type === 1){
        //新建
        const res = await ${addUrlKey}(data);
        if(res.code !== 200) return;
        this.$message("新建成功");
      }else if (form.type === 2) {
        //编辑
        const res = await ${editUrlKey}(data['${config.rowId}'], data);
        if(res.code !== 200) return;
        this.$message("编辑成功");
        this.init();
      };
      this.init();
      this.onCancel()
    }`);
    }

    if (config.hasAdd) {
      methods.push(`
    addBtnHandler() {
      this.formConfig.title = "新增";
      this.formConfig.type = 1;
      this.formConfig.formData = {};
      this.formConfig.dialogVisible = true;
    }`);
    }

    if (config.hasEdit) {
      methods.push(`
    ${config.hasDetail ? `async ` : ``}editBtnHandler() {
      const data = this.multipleSelection;
      if(data.length !== 1) return this.$message.info("请选择一条数据");
      const row = data[0];
      ${
        config.hasDetail
          ? `const { result = {} } = await ${detailUrlKey}(row.${config.rowId});
      this.formConfig.formData = result || {};`
          : `this.formConfig.formData = { ...row };`
      }
      this.formConfig.title = "编辑";
      this.formConfig.type = 2;
      this.formConfig.dialogVisible = true;
    }`);
    }

    // 有详情
    if (config.hasDetail) {
      methods.push(`
    async detailBtnHandler() {
      const data = this.multipleSelection;
      if(data.length !== 1) return this.$message.info("请选择一条数据");
      const row = data[0];
      const { result = {} } = await ${detailUrlKey}(row.${config.rowId});
      this.formConfig.formData = result || {};
      this.formConfig.title = "详情";
      this.formConfig.type = 0;
      this.formConfig.dialogVisible = true;
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
        ${deleteUrlKey}(row.${config.rowId}).then(() => {
          this.$message.success('删除成功');
          this.init();
        }).catch(() => {
          this.$message.error('删除失败');
        });
      }).catch(() => {});
    }`);
    }

    if (config.hasExport) {
      methods.push(`
    export() {
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
  <div class="ol-container">
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
    ${config.hasDialog ? `    <el-dialog :title="formConfig.title" :visible.sync="formConfig.dialogVisible" width="80%">
      <FormModule 
        v-if="formConfig.dialogVisible"
        :formData="formConfig.formData"
        :type="formConfig.type"
        @onCancel="onCancel"
        @onSubmit="onSubmit"
      />
    </el-dialog>
  </div>` : "</div>"}
</template>
<script>
import { ${generateImports()} } from "@/api/modules";
import { ${config.swaggerModule} } from '@/api/swagger';
${config.hasDialog ? `import FormModule  from "./components/formModule.vue"` : ""}
export default {
  name: "${moduleName}",
  ${
    config.hasDialog
      ? `components: {
    FormModule
  },`
      : ""
  }
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
       config.hasDialog
         ? `formConfig: {
      type: 1,
      formData: {},
      title:"",
      dialogVisible: false   
    }`
         : ""
     }
   }
  },
  created() {
    this.init()
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
    },${generateMethods()}
  }
}
</script>
`;
};

const vue2Form = (moduleName, config = {}) => {

  let editUrlKey = "",
    detailUrlKey = "",
    baseUrlKey = "";

  if (config.detailUrl) {
    detailUrlKey = generateKeyName(config.detailUrl, "get");
    baseUrlKey = `${detailUrlKey}CompleteUrl`; //补充后缀
  }

  if (config.editUrl) {
    editUrlKey = generateKeyName(config.editUrl, "put");
    baseUrlKey = `${editUrlKey}CompleteUrl`; //补充后缀
  }

  if (config.addUrl) baseUrlKey = generateKeyName(config.addUrl, "post");

  return `<!--
  Filename: ${moduleName}.vue
  name: ${moduleName}
  Created Date: ${new Date().toLocaleString()}
  Author: 
-->
<template>
  <ol-form
    :url="swaggerUrl.${baseUrlKey}"
    :form="form"
    @onCancel="onCancel"
    @onSubmit="onSubmit"
  />
</template>
<script>
import { ${config.swaggerModule} } from '@/api/swagger';
export default {
  name: "${moduleName}Form",
  props: {
    formData: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      swaggerUrl: ${config.swaggerModule},
      form: {
        type: this.type, // 0详情，1新增, 2编辑
        title: "",
        defaultValue: {}, // 默认值
        value: {},
        model: [],
        rules: {},
        attrs: {},
      }
    }
  },
  watch: {
    type: {
      handler(val){
        this.form.type = val;
      },
      immediate: true
    }
  },
  created(){
    if(this.type !== 1) this.form.value = { ...this.formData };
  },
  methods: {
    onCancel() {
      this.$emit("onCancel");
    },
    onSubmit({form, data}) {
      this.$emit("onSubmit", { form, data });
    }
  }
}
</script>
`;
};

module.exports = {
  vue2Template,
  vue2Form,
};
