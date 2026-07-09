import OlExportExcel from "./src/index.vue";
OlExportExcel.install = function (Vue) {
  Vue.component("ol-export-excel", OlExportExcel);
};
export default OlExportExcel;
