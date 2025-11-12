import OlNumberRange from "./src/index.vue";

OlNumberRange.install = function (Vue) {
  Vue.component("ol-form ", OlNumberRange);
};

export default OlNumberRange;
