<template>
  <div class="print-dialog-overlay">
    <div class="print-dialog">
      <div class="print-dialog-header">
        <span>打印设计器</span>
        <i class="iconfont close-btn" @click="close">x</i>
      </div>
      <div class="print-dialog-body">
        <div class="header-box" style="margin-bottom: 10px">
          <paper-selector :hiprint-template="hiprintTemplate" ref="paperSelector" />
          <div>
            <!--
              slot 暴露给父组件的方法：
              save = 保存模板并关闭弹窗（emit submit 事件）
              download = 导出模板为 JSON 文件下载到本地
              import-template = 从本地 JSON 文件导入模板
            -->
            <slot
              :hiprint-template="hiprintTemplate"
              :print="print"
              :clear-paper="clearPaper"
              :save="save"
              :download="handleExport"
              :import-template="handleImport"
              :export-json="save"
            >
            </slot>
            <el-button-group>
              <el-button type="primary" icon="el-icon-upload2" @click="handleExport"></el-button>
              <el-button type="primary" icon="el-icon-download" @click="handleImport"></el-button>
            </el-button-group>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileChange"
            />
            <el-button type="primary" @click="print" style="margin-left: 10px">
              <i class="iconfont sv-printer" />
              打印
            </el-button>
            <el-button type="danger" @click="clearPaper" style="margin-left: 10px">
              <i class="iconfont sv-clear" />
              清空纸张
            </el-button>
            <el-button type="success" @click="save" style="margin-left: 10px">
              <i class="iconfont sv-export" />
              保存
            </el-button>
          </div>
        </div>
        <div class="main flex-row" style="height: 87vh">
          <div class="flex-2 left flex-col">
            <!-- provider1 的容器; 加上 class "rect-printElement-types" 使用默认样式 -->
            <!-- 当然可以 重写 或者 自定义样式 -->
            <div id="provider-container1" class="container rect-printElement-types"></div>
          </div>
          <div class="flex-5 center">
            <!-- 设计器的 容器 -->
            <div id="hiprint-printTemplate"></div>
          </div>
          <div class="flex-2 right">
            <!-- 元素参数的 容器 -->
            <div id="PrintElementOptionSetting"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { hiprint } from "vue-plugin-hiprint";
import jQuery from "jquery";
import { provider1 } from "./provide/provider1.js";
import PaperSelector from "./components/PaperSelector.vue";

window.$ = window.jQuery = jQuery;
export default {
  name: "print",
  components: {
    PaperSelector,
  },
  props: {
    // 打印数据
    printData: {
      type: Object,
      default: () => {},
    },
    // {
    //     name: "CcSimple",
    //     barcode: "33321323",
    //     table: [
    //       { id: "1", name: "王小可", gender: "男", count: "120", amount: "9089元" },
    //       { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
    //     ],
    //     table1: [
    //       { id: "1", name: "王小可11", gender: "男", count: "120", amount: "9089元" },
    //       { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
    //     ],
    //   }
    onPrintData: {
      type: Function,
      default: null,
    },
    // {panels:[]}
    defaultTemplate: {
      type: Object,
      default: () => {},
    },
    grid: {
      type: Boolean,
      default: false,
    },
    paperSize: {
      type: Object,
      default: () => ({ width: 210, height: 296.6 }),
    },
  },
  data() {
    return {
      hiprintTemplate: {},
      isDirty: false,
    };
  },
  created() {
    hiprint.init({
      //   providers: [defaultElementTypeProvider()],
      providers: [provider1()],
    });
  },
  mounted() {
    // 监听 元素参数容器 变化, 并更新 字体大小 选项 （用MutationObserver监听）
    this.startObserver();
    this.buildLeftElement();
    this.buildDesigner();
  },
  methods: {
    buildLeftElement() {
      $("#provider-container1").empty();
      hiprint.PrintElementTypeManager.build($("#provider-container1"), "providerModule1");

      // eslint-disable-next-line no-undef
      //   hiprint.PrintElementTypeManager.buildByHtml($(".ep-draggable-item"));
    },
    async buildDesigner() {
      // eslint-disable-next-line no-undef
      $("#hiprint-printTemplate").empty(); // 先清空, 避免重复构建

      this.hiprintTemplate = new hiprint.PrintTemplate({
        template: this.defaultTemplate,
        settingContainer: "#PrintElementOptionSetting",
        // paginationContainer: ".hiprint-printPagination", //多页打印
        history: true,
        onDataChanged: (type, json) => {
          console.log(type); // 新增、移动、删除、修改(参数调整)、大小、旋转
          console.log(json); // 返回 template
          this.isDirty = true;
        },
        // fontList: [
        //   { title: "微软雅黑", value: "Microsoft YaHei" },
        //   { title: "黑体", value: "STHeitiSC-Light" },
        //   { title: "思源黑体", value: "SourceHanSansCN-Normal" },
        //   { title: "王羲之书法体", value: "王羲之书法体" },
        //   { title: "宋体", value: "SimSun" },
        //   { title: "华为楷体", value: "STKaiti" },
        //   { title: "cursive", value: "cursive" },
        // ],
      });
      // 使用 props 传入的纸张大小
      if (this.$refs.paperSelector) {
        this.$refs.paperSelector.curPaper = this.paperSize;
      }
      // 构建 并填充到 容器中
      // 可以先 console.log($("#hiprint-printTemplate")) 看看是否有该 dom
      this.hiprintTemplate.design("#hiprint-printTemplate", {
        grid: this.grid,
      });
    },
    startObserver() {
      const container = document.getElementById("PrintElementOptionSetting");
      if (!container) return;

      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver(() => {
        this.addFontSizeOptions();
      });

      this.observer.observe(container, {
        childList: true,
        subtree: true,
      });

      this.addFontSizeOptions();
    },
    addFontSizeOptions() {
      const container = document.getElementById("PrintElementOptionSetting");
      if (!container) return;

      const fontSizeSelect = $(container)
        .find('.hiprint-option-item-label:contains("字体大小")')
        .next(".hiprint-option-item-field")
        .find("select.auto-submit");
      if (!fontSizeSelect.length) return;

      // 断开观察器，避免修改 DOM 时触发自身造成死循环
      if (this.observer) {
        this.observer.disconnect();
      }

      try {
        const currentValue = fontSizeSelect.val();
        const targetOptions = [
          { value: "5", text: "5pt" },
          { value: "4", text: "4pt" },
          { value: "3", text: "3pt" },
          { value: "2", text: "2pt" },
        ];

        let hasChanges = false;
        const defaultOption = fontSizeSelect.find('option[value=""]');

        targetOptions.forEach(opt => {
          const existing = fontSizeSelect.find(`option[value="${opt.value}"]`);
          if (existing.length) {
            if (existing.text() !== opt.text) {
              existing.text(opt.text);
              hasChanges = true;
            }
          } else {
            defaultOption.after(`<option value="${opt.value}">${opt.text}</option>`);
            hasChanges = true;
          }
        });

        if (hasChanges && currentValue) {
          fontSizeSelect.val(currentValue);
        }
      } finally {
        // 重新连接观察器
        if (this.observer) {
          this.observer.observe(container, {
            childList: true,
            subtree: true,
          });
        }
      }
    },
    async print() {
      // 使用外部传入的打印数据
      let data = this.printData;
      if (this.onPrintData) {
        try {
          const result = await this.onPrintData(this.printData);
          if (result) data = result;
          else console.error("onPrintData 执行失败，返回数据为空");
        } catch (error) {
          console.error("onPrintData 执行失败:", error);
        }
      }
      // 参数: 打印时设置 左偏移量，上偏移量
      let options = { leftOffset: -1, topOffset: -1 };
      // 扩展
      let ext = {
        // callback: () => {
        //   console.log("浏览器打印窗口已打开");
        // },
        styleHandler: () => {
          // 翻译扩展（如 KISS-Translator）崩溃时会在 body 中注入报错文本节点。
          // 扩展的 JS 运行在隔离世界，无法从页面侧 patch 其原型，只能靠 CSS。
          // body 默认隐藏 → 仅 hiprint 纸张区域可见，裸文本节点自然不可见。
          return "<style>body{visibility:hidden!important}.hiprint-printPaper,.hiprint-printPaper *{visibility:visible!important}</style>";
        },
      };

      // 使用 props 传入的纸张大小
      ext.curPaper = this.paperSize;

      // 调用浏览器打印
      this.hiprintTemplate.print(data, options, ext);
    },
    save() {
      const json = this.hiprintTemplate.getJson();
      // 校验模板是否有元素，防止保存空白模板
      const panels = json && json.panels;
      if (!panels || !panels.length || !panels.some(p => p.printElements && p.printElements.length)) {
        this.$message && this.$message({
          message: "模板为空，请先添加元素",
          type: "warning",
          customClass: "print-message-zindex",
        });
        return;
      }
      const dataStr = JSON.stringify(json, null, 2);
      console.log("保存", JSON.parse(dataStr));
      this.$emit("submit", JSON.parse(dataStr));
      this.isDirty = false;
      this.close();
    },
    clearPaper() {
      const json = this.hiprintTemplate.getJson();
      const panels = json && json.panels;
      if (!panels || !panels.length || !panels.some(p => p.printElements && p.printElements.length)) {
        this.$message && this.$message({
          message: "纸张上已无元素，无需清空",
          type: "warning",
          customClass: "print-message-zindex",
        });
        return;
      }
      this.$confirm("确定要清空纸张上所有元素吗？此操作不可撤销。", "清空确认", {
        confirmButtonText: "确定清空",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "print-message-zindex",
      }).then(() => {
        this.hiprintTemplate.clear();
      }).catch(() => {});
    },
    handleExport() {
      const json = this.hiprintTemplate.getJson();
      // 校验模板是否有元素，防止导出空白模板
      const panels = json && json.panels;
      if (!panels || !panels.length || !panels.some(p => p.printElements && p.printElements.length)) {
        this.$message && this.$message({
          message: "模板中没有元素，请先拖拽组件到纸张上",
          type: "warning",
          customClass: "print-message-zindex",
        });
        return;
      }
      this.$confirm("确定要导出当前模板为 JSON 文件吗？", "导出确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "print-message-zindex",
      }).then(() => {
        const dataStr = JSON.stringify(json, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "print-template-" + Date.now() + ".json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }).catch(() => {});
    },
    handleImport() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const json = JSON.parse(e.target.result);
          this.hiprintTemplate.update(json);
          this.$message && this.$message({
            message: "导入成功",
            type: "success",
            customClass: "print-message-zindex",
          });
        } catch (err) {
          this.$message && this.$message({
            message: "导入失败：JSON 格式不正确",
            type: "error",
            customClass: "print-message-zindex",
          });
          console.error("导入失败:", err);
        }
      };
      reader.readAsText(file);
      // 重置 input，允许重复选择同一个文件
      event.target.value = "";
    },
    close() {
      if (this.isDirty) {
        this.$confirm("模板数据已修改，确定放弃编辑吗？", "提示", {
          confirmButtonText: "确定放弃",
          cancelButtonText: "继续编辑",
          type: "warning",
          customClass: "print-message-zindex",
        })
          .then(() => {
            this.doClose();
          })
          .catch(() => {});
      } else {
        this.doClose();
      }
    },
    doClose() {
      console.log("关闭");
      // 清理 MutationObserver
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      // 清理 hiprintTemplate 引用，释放内部 DOM 绑定
      if (this.hiprintTemplate) {
        this.hiprintTemplate = null;
      }
      // 先通知父组件关闭，再销毁自身
      this.$emit("close");
      this.$destroy();
      this.$el.remove();
    },
  },
};
</script>

<style scoped>
/* flex */
.flex-row {
  display: flex;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
.flex-wrap {
  flex-wrap: wrap;
}
.align-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}

.flex-1 {
  flex: 1;
}
.flex-2 {
  flex: 2;
}
.flex-3 {
  flex: 3;
}
.flex-4 {
  flex: 4;
}
.flex-5 {
  flex: 5;
}

.ml-10 {
  margin-left: 10px;
}
.mr-10 {
  margin-right: 10px;
}
.mt-10 {
  margin-top: 10px;
}
.mb-10 {
  margin-bottom: 10px;
}

/* button 样式 为了好看点 */
button {
  padding: 10px;
  min-width: 40px;
  color: white;
  opacity: 0.9;
  cursor: pointer;
  border-width: 0;
  border: 1px solid #d9d9d9;
}
button:hover {
  opacity: 1;
}
button i {
  font-size: 16px !important;
}
.circle,
.circle-4 {
  border-radius: 4px !important;
}
.circle-10 {
  border-radius: 10px !important;
}
/* 按钮颜色 */
.primary {
  background: purple;
}
.info {
  color: #000;
  background: none;
}
.info:hover {
  color: purple;
  border-color: purple;
}
.secondary {
  background: #1976d2;
}
.warning {
  background: #d32f2f;
}

/* modal */
.modal {
  padding: 0;
  margin: 0;
}
.modal .mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  height: 100%;
  background-color: #00000073;
}
.modal .wrap {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  overflow: auto;
  background-color: #00000073;
  outline: 0;
}
.modal .wrap .box {
  position: relative;
  margin: 10% auto;
  width: 40%;
  background: #fff;
  border-radius: 4px;
  z-index: 1001;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}
.modal-box__header {
  padding: 10px 14px;
  border-bottom: 1px solid #e9e9e9;
}
.modal-box__footer {
  text-align: end;
}
.modal-box__footer button {
  min-width: 100px;
}
.modal-box__footer button:not(:last-child) {
  margin-right: 10px;
}

/* 重写全局 hiprint 样式 */
.hiprint-headerLine,
.hiprint-footerLine {
  border-color: purple !important;
}

.hiprint-headerLine:hover,
.hiprint-footerLine:hover {
  border-top: 3px dashed purple !important;
}

.hiprint-headerLine:hover:before {
  content: "页眉线";
  left: calc(50% - 18px);
  position: relative;
  background: #ffff;
  top: -14px;
  color: purple;
  font-size: 12px;
}

.hiprint-footerLine:hover:before {
  content: "页脚线";
  left: calc(50% - 18px);
  position: relative;
  color: purple;
  background: #ffff;
  top: -14px;
  font-size: 12px;
}
</style>

<style>
/* 设置 message 提示层级高于打印弹窗 (z-index: 5000) */
.print-message-zindex {
  z-index: 5100 !important;
}

/* $confirm 的 z-index 在内联 style 的 wrapper 上，customClass 无法覆盖，需单独处理 */
.el-message-box__wrapper {
  z-index: 5100 !important;
}

/* 重写默认的一个样式 */
.rect-printElement-types .hiprint-printElement-type > li > ul > li > a {
  color: #000 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自定义 provider 构建样式 */
.custom-style-types .hiprint-printElement-type {
  display: block;
}
.custom-style-types .hiprint-printElement-type {
  padding: 0 0 0 0;
  list-style: none;
}
.custom-style-types .hiprint-printElement-type > li > .title {
  display: block;
  padding: 4px 0px;
  color: rgb(0, 58, 230);
  clear: both;
}
.custom-style-types .hiprint-printElement-type > li > ul {
  padding: 0 0 0 0;
  display: block;
  list-style: none;
}
.custom-style-types .hiprint-printElement-type > li > ul > li {
  display: block;
  width: 50%;
  float: left;
  max-width: 100px;
}
.custom-style-types .hiprint-printElement-type > li > ul > li > a {
  padding: 12px 6px;
  color: #1296db;
  text-decoration: none;
  background: #fff;
  border: 1px solid #ddd;
  margin-right: 5px;
  width: 95%;
  max-width: 100px;
  display: inline-block;
  text-align: center;
  margin-bottom: 7px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.15);
}
/* 隐藏 hiprint 打印 iframe，避免影响页面布局 */
#hiwprint_iframe {
  position: fixed !important;
  top: -9999px !important;
  left: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  visibility: hidden !important;
  opacity: 0 !important;
}
</style>
<style scoped>
/* api按钮 */
.api {
  background: #00acc1;
}
.auto {
  width: auto !important;
}
/* 纸张 */
.paper {
  margin-right: 10px;
}
.paper button:not(class*="auto") {
  width: 60px !important;
}
/* 多个 button 间距 */
.paper button + button {
  margin-left: -1px;
}
.paper button:first-child:last-child {
  border-radius: 4px;
}
/* 两边的 btn 圆角 */
.paper button:first-child:not(:last-child) {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.paper button:last-child:not(:first-child) {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.popover {
  position: absolute;
  margin-top: 10px;
  z-index: 10;
}
.popover .popover-content {
  background: white;
  border-radius: 4px;
  padding: 10px 14px;
  box-shadow: 2px 2px 2px 4px rgb(128 0 128 / 20%);
}
.popover .input {
  height: 24px;
  padding: 2px 4px;
}
.popover .input:hover {
  border-color: rgb(245, 155, 241);
  border-radius: 4px;
}

/* 区域 */
.left {
  background: white;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: 2px 2px 2px 0px rgb(128 0 128 / 20%);
  overflow: auto;
}
.left .container {
  height: 100%;
  overflow: auto;
  padding: 0 10%;
  background: rgba(92, 91, 92, 0.1);
}
.left .container[id*="provider-container2"] {
  margin-bottom: 10px;
  background: rgba(92, 91, 92, 0.1);
}
.center {
  margin: 0 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  padding: 20px;
  box-shadow: 2px 2px 2px 0px rgb(128 0 128 / 20%);
  overflow: auto;
}
.right {
  background: white;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  padding: 10px 0;
  box-shadow: 2px 2px 2px 0px rgb(128 0 128 / 20%);
  overflow: auto;
}
/* 左侧拖拽元素样式 */
.title {
  font-size: 16px;
  font-weight: 500;
  margin: 4px 0 4px 10px;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 4px 10px;
  margin: 10px 8px 4px 8px;
  width: 38%;
  min-height: 60px;
  border-radius: 4px;
  box-shadow: 2px 2px 2px 2px rgba(171, 171, 171, 0.2);
}
.item .iconfont {
  font-size: 1.5rem;
}
.item span {
  font-size: 14px;
}
</style>

<!-- 弹框样式 -->
<style scoped>
.print-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
}

.print-dialog {
  background: #fff;
  width: 95vw;
  height: 95vh;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.print-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  cursor: pointer;
  font-size: 20px;
  color: #000;
  font-style: normal;
}

.close-btn:hover {
  color: #606266;
}

.print-dialog-body {
  flex: 1;
  overflow: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.print-dialog-body .main {
  flex: 1;
  overflow: hidden;
}
</style>

<style scoped>
.button-item {
  height: 40px;
}
.header-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
