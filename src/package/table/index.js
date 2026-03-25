import OlTable from "./src/index.vue";
import OlDropdownPrint from "./src/components/PrintTemplateSelector.vue";

OlTable.install = function (Vue) {
  Vue.component("ol-table", OlTable);
};
OlDropdownPrint.install = function (Vue) {
  Vue.component("ol-dropdown-print", OlDropdownPrint);
};

export default OlTable;
export { OlDropdownPrint };
