import OlPrintModel from "./src/index.vue";

OlPrintModel.install = function (Vue) {
  Vue.component("ol-print-model", OlPrintModel);
};

export default OlPrintModel;
