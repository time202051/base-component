import OlForm from "./src/index.vue";

OlForm.install = function (Vue) {
  Vue.component("ol-form ", OlForm);
};

export default OlForm;
