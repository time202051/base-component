import OlCrud from "./src/index.vue";

OlCrud.install = function (Vue) {
  Vue.component("ol-crud", OlCrud);
};

export default OlCrud;
