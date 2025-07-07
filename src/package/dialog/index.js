import Dialog from "./src/index.vue";

Dialog.install = function (Vue) {
  Vue.component("ol-dialogTemplate ", Dialog);
};

export default Dialog;
