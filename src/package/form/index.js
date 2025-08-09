import Form from "./src/index.vue";

Form.install = function (Vue) {
  Vue.component("ol-form ", Form);
};

export default Form;
