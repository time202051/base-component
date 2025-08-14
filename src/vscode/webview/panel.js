const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

// 复用现有的模板生成逻辑
function generateKeyName(url, method) {
  const cleanedUrl = url.replace(/\/api\/app/, "");
  const arr = cleanedUrl.split("/");

  const processedArr = arr.map(item =>
    item
      .replace(/{(.*?)}/, (_, param) => `By${param.charAt(0).toUpperCase() + param.slice(1)}`)
      .replace(/[-_]/g, "")
  );

  if (processedArr[0] === "") {
    processedArr.shift();
  }

  const resultArr = [];
  for (let i = 0; i < processedArr.length; i++) {
    if (i === 0 || processedArr[i] !== processedArr[i - 1]) {
      const capitalizedItem = processedArr[i].charAt(0).toUpperCase() + processedArr[i].slice(1);
      resultArr.push(capitalizedItem);
    }
  }
  const key = resultArr.join("");
  return `${method.toLowerCase()}${key}`;
}

// 复用现有的 vue2Template 函数
function vue2Template(moduleName, config) {
  let pageUrlKey = "",
    exportUrlKey = "",
    addUrlKey = "",
    editUrlKey = "",
    deleteUrlKey = "",
    detailUrlKey = "",
    baseUrlKey = "";

  if (config.pageUrl) pageUrlKey = generateKeyName(config.pageUrl, "get");
  if (config.exportUrl) exportUrlKey = generateKeyName(config.exportUrl, "post");
  if (config.detailUrl) {
    detailUrlKey = generateKeyName(config.detailUrl, "get");
    baseUrlKey = `${detailUrlKey}CompleteUrl`;
  }
  if (config.editUrl) {
    editUrlKey = generateKeyName(config.editUrl, "put");
    baseUrlKey = `${editUrlKey}CompleteUrl`;
  }
  if (config.addUrl) baseUrlKey = addUrlKey = generateKeyName(config.addUrl, "post");
  if (config.deleteUrl) deleteUrlKey = generateKeyName(config.deleteUrl, "delete");

  const generateImports = () => {
    const imports = [];
    if (config.pageUrl) imports.push(`${pageUrlKey}`);
    if (config.addUrl) imports.push(`${addUrlKey}`);
    if (config.editUrl) imports.push(`${editUrlKey}`);
    if (config.detailUrl) imports.push(`${detailUrlKey}`);
    if (config.deleteUrl) imports.push(`${deleteUrlKey}`);
    return imports.join(", ");
  };

  const generateMethods = () => {
    const methods = [];
    if (config.hasAdd) {
      methods.push(`
    addBtnHandler() {
      this.type = 1;
      this.dialogVisible = true;
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
        this.formData = result || {};`
          : `this.formData = { ...row };`
      }
      this.type = 2;
      this.dialogVisible = true;
    }`);
    }

    if (config.hasDetail) {
      methods.push(`async detailBtnHandler() {
      const data = this.multipleSelection;
      if(data.length !== 1) return this.$message.info("请选择一条数据");
      const row = data[0];
      const { result = {} } = await ${detailUrlKey}(row.${config.rowId});
      this.formData = result || {};
      this.type = 0;
      this.dialogVisible = true;
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

    if (config.hasAdd || config.hasEdit || config.hasDetail) {
      methods.push(`
        onCancel() {
          this.dialogVisible = false;
        }`);
    }

    if (config.hasAdd || config.hasEdit) {
      methods.push(`
        async onSubmit({ form, data }) {
          if(form.type === 1){
            const res = await ${addUrlKey}(data);
            if(res.code !== 200) return;
            this.$message("新建成功");
          }else if (form.type === 2) {
            const res = await ${editUrlKey}(data['${config.rowId}'], data);
            if(res.code !== 200) return;
            this.$message("编辑成功");
            this.init();
          };
          this.init();
          this.onCancel()
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
      config.hasDialog
        ? `<el-dialog :title="this.form.title" :visible.sync="dialogVisible" width="80%">
      <FormModule 
        v-if="dialogVisible"
        :formData="formData"
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
     formSearchData: {
       reset: true,
       expendShow: true,
       value: {},
       tableSearch: []
     },
     tableData: {
       loading: false,
       emptyImg: true,
       options: {
         selection: true,
         index: null,
         headTool: true,
         refreshBtn: true,
         downloadBtn: true
       },
       rows: [],
       columns: [],
       operatesAttrs: {},
       operates: [],
       tableHeightDiff: 330
     },
     paginations: {
       page: 1,
       total: 10,
       limit: 30,
       pagetionShow: true
     },
     ${
       config.hasDialog
         ? `type: 1,
         formData: {},
         dialogVisible: false`
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
    },
    ${
      config.hasExport
        ? `export() {
      const timer = this.formSearchData.value.createdTime;
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
</script>
`;
}

// 复用现有的 vue2Form 函数
function vue2Form(moduleName, config) {
  let editUrlKey = "",
    detailUrlKey = "",
    baseUrlKey = "";

  if (config.detailUrl) {
    detailUrlKey = generateKeyName(config.detailUrl, "get");
    baseUrlKey = `${detailUrlKey}CompleteUrl`;
  }

  if (config.editUrl) {
    editUrlKey = generateKeyName(config.editUrl, "put");
    baseUrlKey = `${editUrlKey}CompleteUrl`;
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
    v-if="dialogVisible"
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
        type: this.type,
        title: "",
        defaultValue: {},
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
      this.form.value = { ...this.formData };
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
}

class GeneratorPanel {
  static currentPanel = undefined;

  static createOrShow(extensionUri, targetUri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GeneratorPanel.currentPanel) {
      GeneratorPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "vueGenerator",
      "Vue 页面生成器",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      }
    );

    GeneratorPanel.currentPanel = new GeneratorPanel(panel, extensionUri, targetUri);
  }

  constructor(panel, extensionUri, targetUri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._targetUri = targetUri;
    this._disposables = [];

    this._setWebviewMessageListener();
    this._update();
  }

  _setWebviewMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "generate":
            this._generateFiles(message.config);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  async _generateFiles(config) {
    try {
      const moduleName = config.moduleName;
      const targetPath = path.dirname(this._targetUri.fsPath);
      const outputDir = path.join(targetPath, moduleName);

      // 检查目录是否存在
      if (fs.existsSync(outputDir)) {
        vscode.window.showErrorMessage(`❌ 创建失败，文件夹 ${outputDir} 已存在`);
        return;
      }

      // 创建目录
      fs.mkdirSync(outputDir, { recursive: true });

      // 生成主页面
      const mainContent = vue2Template(moduleName, config);
      const mainPath = path.join(outputDir, "index.vue");
      fs.writeFileSync(mainPath, mainContent);

      // 如果有弹窗功能，生成表单组件
      if (config.hasDialog) {
        const componentsDir = path.join(outputDir, "components");
        fs.mkdirSync(componentsDir, { recursive: true });

        const formContent = vue2Form(moduleName, config);
        const formPath = path.join(componentsDir, "formModule.vue");
        fs.writeFileSync(formPath, formContent);
      }

      vscode.window.showInformationMessage(`✅ 模板已生成并保存到 ${outputDir}`);

      // 打开生成的文件
      const document = await vscode.workspace.openTextDocument(mainPath);
      vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`❌ 发生错误：${error.message}`);
    }
  }

  _update() {
    const webview = this._panel.webview;
    this._panel.title = "Vue 页面生成器";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Vue 页面生成器</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input[type="text"], input[type="url"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            box-sizing: border-box;
        }
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .checkbox-group label {
            display: flex;
            align-items: center;
            margin-bottom: 0;
            cursor: pointer;
        }
        .checkbox-group input[type="checkbox"] {
            margin-right: 5px;
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .section {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--vscode-editor-foreground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>🎉 Vue 页面生成器</h2>
        
        <div class="section">
            <h3>基础配置</h3>
            <div class="form-group">
                <label for="moduleName">页面名称:</label>
                <input type="text" id="moduleName" placeholder="请输入页面名称" required>
            </div>
        </div>

        <div class="section">
            <h3>API 配置</h3>
            <div class="form-group">
                <label for="pageUrl">分页接口地址:</label>
                <input type="url" id="pageUrl" placeholder="/api/app/xxx/paged-result" required>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="hasExport"> 是否有导出接口
                </label>
            </div>
            
            <div class="form-group" id="exportUrlGroup" style="display:none;">
                <label for="exportUrl">导出接口地址:</label>
                <input type="url" id="exportUrl" placeholder="/api/app/xxx/export">
            </div>
        </div>

        <div class="section">
            <h3>功能选择</h3>
            <div class="form-group">
                <div class="checkbox-group">
                    <label><input type="checkbox" id="hasAdd"> 新增功能</label>
                    <label><input type="checkbox" id="hasEdit"> 编辑功能</label>
                    <label><input type="checkbox" id="hasDelete"> 删除功能</label>
                    <label><input type="checkbox" id="hasDetail"> 详情功能</label>
                </div>
            </div>
        </div>

        <div class="section" id="operationConfig" style="display:none;">
            <h3>操作接口配置</h3>
            <div class="form-group">
                <label for="baseUrl">操作接口基础路径:</label>
                <input type="url" id="baseUrl" placeholder="/api/app/xxx">
            </div>
            
            <div class="form-group">
                <label for="idField">URL后缀ID字段名:</label>
                <input type="text" id="idField" placeholder="admissionInfoId">
            </div>
            
            <div class="form-group">
                <label for="rowId">行数据中ID字段键名:</label>
                <input type="text" id="rowId" placeholder="id">
            </div>
        </div>

        <div class="section">
            <h3>模块配置</h3>
            <div class="form-group">
                <label for="swaggerModule">接口模块名:</label>
                <input type="text" id="swaggerModule" placeholder="AdmissionInfo">
            </div>
        </div>

        <button class="btn" id="generateBtn">🚀 生成页面</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // 获取DOM元素
        const moduleNameInput = document.getElementById('moduleName');
        const pageUrlInput = document.getElementById('pageUrl');
        const hasExportCheckbox = document.getElementById('hasExport');
        const exportUrlGroup = document.getElementById('exportUrlGroup');
        const exportUrlInput = document.getElementById('exportUrl');
        const hasAddCheckbox = document.getElementById('hasAdd');
        const hasEditCheckbox = document.getElementById('hasEdit');
        const hasDeleteCheckbox = document.getElementById('hasDelete');
        const hasDetailCheckbox = document.getElementById('hasDetail');
        const operationConfig = document.getElementById('operationConfig');
        const baseUrlInput = document.getElementById('baseUrl');
        const idFieldInput = document.getElementById('idField');
        const rowIdInput = document.getElementById('rowId');
        const swaggerModuleInput = document.getElementById('swaggerModule');
        const generateBtn = document.getElementById('generateBtn');

        // 监听导出功能选择
        hasExportCheckbox.addEventListener('change', () => {
            exportUrlGroup.style.display = hasExportCheckbox.checked ? 'block' : 'none';
        });

        // 监听功能选择
        function updateOperationConfig() {
            const hasOperations = hasAddCheckbox.checked || hasEditCheckbox.checked || 
                                 hasDeleteCheckbox.checked || hasDetailCheckbox.checked;
            operationConfig.style.display = hasOperations ? 'block' : 'none';
        }

        hasAddCheckbox.addEventListener('change', updateOperationConfig);
        hasEditCheckbox.addEventListener('change', updateOperationConfig);
        hasDeleteCheckbox.addEventListener('change', updateOperationConfig);
        hasDetailCheckbox.addEventListener('change', updateOperationConfig);

        // 生成按钮点击事件
        generateBtn.addEventListener('click', () => {
            // 验证必填字段
            if (!moduleNameInput.value.trim()) {
                alert('请输入页面名称');
                return;
            }
            if (!pageUrlInput.value.trim()) {
                alert('请输入分页接口地址');
                return;
            }

            const config = {
                moduleName: moduleNameInput.value.trim(),
                pageUrl: pageUrlInput.value.trim(),
                hasExport: hasExportCheckbox.checked,
                exportUrl: exportUrlInput.value.trim(),
                hasAdd: hasAddCheckbox.checked,
                hasEdit: hasEditCheckbox.checked,
                hasDelete: hasDeleteCheckbox.checked,
                hasDetail: hasDetailCheckbox.checked,
                baseUrl: baseUrlInput.value.trim(),
                idField: idFieldInput.value.trim() || 'id',
                rowId: rowIdInput.value.trim() || 'id',
                swaggerModule: swaggerModuleInput.value.trim() || 'Module',
                hasDialog: hasAddCheckbox.checked || hasEditCheckbox.checked || hasDetailCheckbox.checked
            };

            // 发送消息给扩展
            vscode.postMessage({
                command: 'generate',
                config: config
            });
        });

        // 设置默认值
        pageUrlInput.value = '/api/app/admission-info/paged-result';
        baseUrlInput.value = '/api/app/admission-info/admission-info';
        idFieldInput.value = 'admissionInfoId';
        rowIdInput.value = 'id';
        swaggerModuleInput.value = 'AdmissionInfo';
    </script>
</body>
</html>`;
  }

  dispose() {
    GeneratorPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

module.exports = {
  GeneratorPanel,
};
