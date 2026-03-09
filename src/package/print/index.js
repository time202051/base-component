import OlPrint from "./src/index.vue";

// 方式1：组件方式注册
OlPrint.install = function (Vue) {
  Vue.component("ol-print", OlPrint);
};

// 方式2：插件方式注册（全局方法）
let printInstance = null;
let container = null;

const Hiprint = {
  install(Vue) {
    const hiprint = function (options) {
      const { printData, onPrintData, defaultTemplate, onTemplate, onSubmit, grid } = options;
      // 销毁旧实例
      if (printInstance) {
        printInstance.$destroy();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
        printInstance = null;
        container = null;
      }

      // 创建新实例
      container = document.createElement("div");
      document.body.appendChild(container);

      const PrintComponent = Vue.extend(OlPrint);
      const propsData = {
        grid,
      };
      if (printData) {
        propsData.printData = printData;
      }
      if (onPrintData) {
        propsData.onPrintData = onPrintData;
      }

      if (onTemplate) {
        propsData.onTemplate = onTemplate;
      }

      if (defaultTemplate) {
        propsData.defaultTemplate = defaultTemplate;
      }

      printInstance = new PrintComponent({
        propsData,
      });

      // 监听 submit 事件
      if (onSubmit && typeof onSubmit === "function") {
        printInstance.$on("submit", json => {
          onSubmit(json);
        });
      }

      printInstance.$mount(container);

      // 返回实例，方便外部调用
      return printInstance;
    };
    Vue.prototype.$hiprint = hiprint;

    // 快捷方法：直接打印
    Vue.prototype.$hiprint.print = function (options) {
      const instance = hiprint(options);
      instance.print();
      instance.$nextTick(() => {
        instance.close();
      });
    };
  },
};

// 导出组件和插件
export { OlPrint, Hiprint };
export default OlPrint;
