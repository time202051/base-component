import OlCustomSearch from "./src/index.vue";

OlCustomSearch.install = function (Vue) {
  Vue.component("ol-customSearch", OlCustomSearch);
};

export default OlCustomSearch;
