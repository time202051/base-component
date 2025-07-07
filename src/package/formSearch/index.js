import OlSearch from "./src/index.vue";

OlSearch.install = function (Vue) {
  Vue.component("ol-search ", OlSearch );
};

export default OlSearch;
