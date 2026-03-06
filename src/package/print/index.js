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
    Vue.prototype.$hiprint = function (data, template) {
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
      printInstance = new PrintComponent({
        propsData: {
          printData: data || {},
          onTemplate: template,
        },
      });

      printInstance.$mount(container);
    };

    // 提供销毁方法（可选）
    Vue.prototype.$hiprint.destroy = function () {
      if (printInstance) {
        printInstance.$destroy();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
        printInstance = null;
        container = null;
      }
    };
  },
};

// 导出组件和插件
export { OlPrint, Hiprint };
export default OlPrint;
